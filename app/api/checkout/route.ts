import { NextResponse } from "next/server";
import { createPesaPalCheckout } from "@/lib/pesapal";
import { initiatePayHeroStkPush } from "@/lib/payhero";
import { sendGaPurchaseEvent } from "@/lib/gaServer";
import { processPurchaseRewards } from "@/lib/loyalty";
import prisma from "@/lib/prisma";
import { applyCouponCode, validateCouponCode } from "@/lib/coupons";

type CheckoutItem = {
    productId: string;
    price: number;
    quantity: number;
    variantId?: string;
    id?: string;
    name?: string;
};

export async function POST(req: Request) {
    try {
        const { items, totalPrice, deliveryInfo, paymentMethod, paymentType, deliveryMethod, pickupStationId, couponCode, gaClientId } = await req.json();

        console.log("=== CHECKOUT REQUEST ===");
        console.log("Payment Method:", paymentMethod);
        console.log("Delivery Method:", deliveryMethod);
        console.log("Items Count:", items.length);
        console.log("Total Price:", totalPrice);
        console.log("Available payment methods: wallet, mpesa_till, pesapal");
        console.log("=== END REQUEST ===");

        // Verify shipping fee dynamically or from database to prevent tampering
        let shippingFee = 500;
        
        if (deliveryMethod === "door") {
            const { getDhlQuote } = await import("@/lib/dhl");
            const quote = await getDhlQuote({
                country: deliveryInfo.country,
                county: deliveryInfo.county,
                city: deliveryInfo.city,
            });
            shippingFee = quote.success ? quote.fee : 500;
        } else if (deliveryMethod === "pickup" && pickupStationId) {
            const station = await prisma.pickupStation.findUnique({ where: { id: pickupStationId } });
            shippingFee = station ? station.fee : 50;
        }

        // 1. Resolve product IDs from slugs (cart stores productId which is the DB id)
        const resolvedItems = await Promise.all(
            (items as CheckoutItem[]).map(
                async (item) => {
                    // look up product cost price for margin tracking
                    const product = await prisma.product.findUnique({
                        where: { id: item.productId },
                        select: { id: true, costPrice: true },
                    });
                    return {
                        productId: item.productId,
                        variantId: item.variantId || null,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        costPrice: product?.costPrice ?? item.price * 0.6, // fallback 60% cost estimate
                    };
                }
            )
        );

        const orderTotal = totalPrice + shippingFee;
        let couponDiscount = 0;
        let couponValidationError = null;

        if (couponCode) {
            const validation = await validateCouponCode(couponCode, totalPrice);
            if (!validation.valid) {
                couponValidationError = validation.error || "Coupon code is invalid.";
            } else {
                couponDiscount = validation.amount;
            }
        }

        if (couponValidationError) {
            return NextResponse.json({ success: false, message: couponValidationError }, { status: 400 });
        }

        const totalAfterDiscount = Math.max(orderTotal - couponDiscount, 0);
        let depositAmount = null;
        let balanceRemaining = null;
        let amountToCharge = totalAfterDiscount;

        if (paymentType === "LAYBY") {
            depositAmount = Math.round(totalAfterDiscount * 0.3);
            balanceRemaining = totalAfterDiscount - depositAmount;
            amountToCharge = depositAmount;
        } else if (paymentType === "COMMITMENT") {
            depositAmount = shippingFee > 0 ? shippingFee : 500;
            balanceRemaining = totalAfterDiscount - depositAmount;
            amountToCharge = depositAmount;
        }

        // Add userId if user is logged in (needed for wallet)
        const { auth } = await import("@/auth");
        const session = await auth();
        let userId = null;
        if (session?.user?.email) {
            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (user) userId = user.id;
        }

        // 2. Real-time Inventory Check and Lock
        const lockedProducts: { id: string, qty: number }[] = [];
        try {
            for (const item of resolvedItems) {
                if (!item.productId) continue;
                const updateRes = await prisma.product.updateMany({
                    where: { id: item.productId, stock: { gte: item.quantity } },
                    data: { stock: { decrement: item.quantity } }
                });
                
                if (updateRes.count === 0) {
                    throw new Error(`Insufficient stock for one or more items in your cart.`);
                }
                lockedProducts.push({ id: item.productId, qty: item.quantity });
            }
        } catch (e) {
            // Rollback optimistic locks
            for (const locked of lockedProducts) {
                await prisma.product.update({
                    where: { id: locked.id },
                    data: { stock: { increment: locked.qty } }
                });
            }
            return NextResponse.json({ success: false, message: e instanceof Error ? e.message : "Out of stock for one or more items." }, { status: 400 });
        }

        // 3. Create Order with its Items in one transaction
        const orderNumber = `ORD-${Math.floor(Math.random() * 100000).toString()}`;
        const order = await prisma.order.create({
            data: {
                orderNumber,
                subtotal: totalPrice,
                shippingFee,
                discount: couponDiscount,
                couponCode: couponCode ? couponCode.toUpperCase() : null,
                total: totalAfterDiscount,
                paymentMethod,
                paymentType: paymentType || "FULL",
                depositAmount,
                balanceRemaining,
                shippingName: `${deliveryInfo.firstName} ${deliveryInfo.lastName}`,
                shippingPhone: deliveryInfo.phone,
                shippingAddress: deliveryInfo.address,
                shippingCity: deliveryInfo.city,
                shippingCounty: deliveryInfo.county,
                shippingCountry: deliveryInfo.country,
                pickupStationId: pickupStationId || null,
                mpesaTillNumber: deliveryInfo.tillNumber || null,
                userId,
                paymentStatus: "pending",
                status: "pending",
                items: {
                    create: resolvedItems.filter((i) => i.productId), // skip any bad refs
                },
                installments: {
                    create: [{
                        amount: amountToCharge,
                        paymentMethod,
                        paymentStatus: "pending"
                    }]
                }
            },
        });

        // Send GA4 purchase event (best-effort)
        try {
            const gaItems = (items as CheckoutItem[]).map(i => ({
                item_id: i.productId || i.id || i.name,
                item_name: i.name,
                price: i.price,
                quantity: i.quantity
            }));
            // fire-and-forget but await to capture errors when possible
            await sendGaPurchaseEvent({
                clientId: gaClientId || null,
                transactionId: order.orderNumber,
                value: totalAfterDiscount,
                currency: 'KES',
                items: gaItems
            });
        } catch (e) {
            console.warn('GA purchase send failed', e);
        }

        if (couponCode) {
            try {
                await applyCouponCode(couponCode, totalPrice);
            } catch (couponError) {
                console.warn("Coupon apply error:", couponError);
            }
        }

        // 4. Send Order Confirmation Email
        if (deliveryInfo.email) {
            try {
                const { sendOrderConfirmationEmail } = await import("@/lib/email");
                // Don't await if you don't want it to slow down checkout, but awaiting is fine
                sendOrderConfirmationEmail(deliveryInfo.email, orderNumber, totalAfterDiscount);
                console.log(`Order confirmation email triggered for ${deliveryInfo.email}`);
            } catch (emailError) {
                console.error("Failed to send confirmation email:", emailError);
            }
        }

        // 5. Initiate Payment
        console.log("Processing payment for method:", paymentMethod);

        if (paymentMethod === "wallet") {
            if (!userId) {
                return NextResponse.json({ success: false, message: "Must be logged in to use wallet" }, { status: 401 });
            }

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || user.walletBalance < amountToCharge) {
                return NextResponse.json({ success: false, message: "Insufficient wallet balance" }, { status: 400 });
            }

            // Deduct balance and create transaction
            await prisma.user.update({
                where: { id: userId },
                data: {
                    walletBalance: { decrement: amountToCharge },
                    walletTransactions: {
                        create: {
                            amount: amountToCharge,
                            type: "PAYMENT",
                            status: "COMPLETED",
                            reference: `PAY-${orderNumber}`
                        }
                    }
                }
            });

            // Update order and installment status
            await prisma.order.update({
                where: { id: order.id },
                data: { paymentStatus: "paid" }
            });

            await prisma.paymentInstallment.updateMany({
                where: { orderId: order.id },
                data: { paymentStatus: "completed" }
            });

            await processPurchaseRewards(order.id);
            const { processSuccessfulPayment } = await import("@/lib/postPayment");
            await processSuccessfulPayment(order.id);

            return NextResponse.json({
                success: true,
                orderId: order.id,
                type: "wallet",
                url: `/success?order_id=${order.id}`
            });
        }

        if (paymentMethod === "mpesa_till") {
            console.log("Initiating Pay Hero STK Push for M-Pesa Till");

            if (!deliveryInfo.phone) {
                return NextResponse.json({ success: false, message: "Phone number is required for M-Pesa payments" }, { status: 400 });
            }

            try {
                const finalPayHeroAmount = Math.round(amountToCharge);
                const tillNumber = "3510645";
                console.log("PayHero Debug:", {
                    username: process.env.PAYHERO_API_USERNAME ? "SET" : "MISSING",
                    password: process.env.PAYHERO_API_PASSWORD ? "SET" : "MISSING",
                    channelId: process.env.PAYHERO_CHANNEL_ID || "MISSING",
                    amount: finalPayHeroAmount,
                    phone: deliveryInfo.phone,
                    orderId: order.id,
                    tillNumber
                });
                await initiatePayHeroStkPush(finalPayHeroAmount, deliveryInfo.phone, order.id, tillNumber);
                return NextResponse.json({
                    success: true,
                    orderId: order.id,
                    type: "mpesa",
                    message: "Please check your phone and enter your M-Pesa PIN to complete payment on till 3510645.",
                    url: `/success?order_id=${order.id}&payment=mpesa_pending`
                });
            } catch (error) {
                console.error("Pay Hero STK Push Error:", error);
                const msg = error instanceof Error ? error.message : "Failed to initiate M-Pesa payment";
                return NextResponse.json({ success: false, message: msg }, { status: 500 });
            }
        }

        if (paymentMethod === "pesapal") {
            console.log("Initiating Pesapal checkout — supports Card");

            // Map cart items to PesaPalLineItem format
            const pesapalItems = (items as { name: string; image?: string; price: number; quantity: number }[]).map(
                (item) => ({
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.quantity,
                })
            );

            const result = await createPesaPalCheckout(
                pesapalItems,
                order.id,
                deliveryInfo.email,
                deliveryInfo.phone,
                amountToCharge,
                deliveryInfo.firstName,
                deliveryInfo.lastName
            );

            console.log("Pesapal result:", result);

            if (!result.checkoutUrl) {
                console.log("ERROR: No checkout URL returned from Pesapal");
                return NextResponse.json({ success: false, message: "Failed to create Pesapal payment session" }, { status: 500 });
            }

            console.log("Redirecting to Pesapal checkout URL:", result.checkoutUrl);
            return NextResponse.json({
                success: true,
                orderId: order.id,
                type: "pesapal",
                url: result.checkoutUrl,
                orderTrackingId: result.orderTrackingId
            });
        }

        return NextResponse.json({ success: false, message: `Unsupported payment method: ${paymentMethod}. Supported: wallet, mpesa_till, pesapal` }, { status: 400 });
    } catch (error) {
        console.error("Checkout Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        const errorDetails = error instanceof Error ? error.stack : JSON.stringify(error);
        console.error("Error Details:", errorDetails);
        return NextResponse.json({ 
            success: false, 
            message: errorMessage,
            details: process.env.NODE_ENV === "development" ? errorDetails : undefined
        }, { status: 500 });
    }
}
