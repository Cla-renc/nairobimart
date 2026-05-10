import { NextResponse } from "next/server";
import { initiateStkPush } from "@/lib/mpesa";
import { createPesaPalCheckout } from "@/lib/pesapal";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { items, totalPrice, deliveryInfo, paymentMethod } = await req.json();

        console.log("=== CHECKOUT REQUEST ===");
        console.log("Payment Method:", paymentMethod);
        console.log("Items Count:", items.length);
        console.log("Total Price:", totalPrice);
        console.log("=== END REQUEST ===");

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

        // 2. Create Order with its Items in one transaction
        const orderNumber = `ORD-${Math.floor(Math.random() * 100000).toString()}`;
        const shippingFee = 500;
        const order = await prisma.order.create({
            data: {
                orderNumber,
                subtotal: totalPrice,
                shippingFee,
                total: totalPrice + shippingFee,
                paymentMethod,
                shippingName: `${deliveryInfo.firstName} ${deliveryInfo.lastName}`,
                shippingPhone: deliveryInfo.phone,
                shippingAddress: deliveryInfo.address,
                shippingCity: deliveryInfo.city,
                shippingCounty: deliveryInfo.county,
                shippingCountry: deliveryInfo.country,
                mpesaTillNumber: deliveryInfo.tillNumber || null,
                paymentStatus: "pending",
                status: "pending",
                items: {
                    create: resolvedItems.filter((i) => i.productId), // skip any bad refs
                },
            },
        });

        // 3. Initiate Payment
        console.log("Processing payment for method:", paymentMethod);
        
        if (paymentMethod === "mpesa") {
            console.log("Initiating M-Pesa payment");
            const result = await initiateStkPush(deliveryInfo.phone, totalPrice + shippingFee, order.id);
            return NextResponse.json({ success: true, orderId: order.id, type: "mpesa", result });
        } else if (paymentMethod === "pesapal") {
            console.log("Initiating PesaPal checkout for items:", items);
            // Map cart items to PesaPalLineItem format
            const pesapalItems = (items as { name: string; image?: string; price: number; quantity: number }[]).map(
                (item) => ({
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.quantity,
                })
            );
            console.log("Mapped PesaPal items:", pesapalItems);
            
            const result = await createPesaPalCheckout(
                pesapalItems,
                order.id,
                deliveryInfo.email,
                deliveryInfo.phone,
                shippingFee,
                totalPrice
            );
            console.log("PesaPal result:", result);
            
            if (!result.checkoutUrl) {
                console.log("ERROR: No checkout URL returned from PesaPal");
                return NextResponse.json({ success: false, message: "Failed to create PesaPal session" }, { status: 500 });
            }
            console.log("Returning PesaPal checkout URL:", result.checkoutUrl);
            return NextResponse.json({ success: true, orderId: order.id, type: "pesapal", url: result.checkoutUrl, orderTrackingId: result.orderTrackingId });
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
