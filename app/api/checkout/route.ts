import { NextResponse } from "next/server";
import { createPesaPalCheckout } from "@/lib/pesapal";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { items, totalPrice, deliveryInfo, paymentMethod, paymentType, deliveryMethod, deliveryZoneId, pickupStationId } = await req.json();

        console.log("=== CHECKOUT REQUEST ===");
        console.log("Payment Method:", paymentMethod);
        console.log("Delivery Method:", deliveryMethod);
        console.log("Items Count:", items.length);
        console.log("Total Price:", totalPrice);
        console.log("=== END REQUEST ===");

        // Verify shipping fee dynamically or from database to prevent tampering
        let shippingFee = 500;
        
        if (deliveryMethod === "door") {
            const { getMotorspeedQuote } = await import("@/lib/motorspeed");
            const quote = await getMotorspeedQuote({
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
            (items as { productId: string; price: number; quantity: number; variantId?: string }[]).map(
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
        let depositAmount = null;
        let balanceRemaining = null;
        let amountToCharge = orderTotal;

        if (paymentType === "LAYBY") {
            depositAmount = Math.round(orderTotal * 0.3);
            balanceRemaining = orderTotal - depositAmount;
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

        // 2. Create Order with its Items in one transaction
        const orderNumber = `ORD-${Math.floor(Math.random() * 100000).toString()}`;
        const order = await prisma.order.create({
            data: {
                orderNumber,
                subtotal: totalPrice,
                shippingFee,
                total: orderTotal,
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

        // 3. Initiate Payment
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

            return NextResponse.json({
                success: true,
                orderId: order.id,
                type: "wallet",
                url: `/success?order_id=${order.id}`
            });
        }

        if (paymentMethod === "mpesa" || paymentMethod === "pesapal") {
            console.log("Initiating Pesapal checkout — supports M-Pesa and Card");

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

        return NextResponse.json({ success: false, message: "Unsupported payment method" }, { status: 400 });
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
