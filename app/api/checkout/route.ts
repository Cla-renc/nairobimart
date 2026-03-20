import { NextResponse } from "next/server";
import { initiateStkPush } from "@/lib/mpesa";
import { createStripeCheckout } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { items, totalPrice, deliveryInfo, paymentMethod } = await req.json();

        // 1. Create Order in Database
        const orderNumber = `ORD-${Math.floor(Math.random() * 100000).toString()}`;
        const order = await prisma.order.create({
            data: {
                orderNumber,
                subtotal: totalPrice,
                shippingFee: 500,
                total: totalPrice + 500,
                paymentMethod,
                shippingName: `${deliveryInfo.firstName} ${deliveryInfo.lastName}`,
                shippingPhone: deliveryInfo.phone,
                shippingAddress: deliveryInfo.address,
                shippingCity: deliveryInfo.city,
                shippingCounty: deliveryInfo.county,
                paymentStatus: "pending",
                status: "pending",
            },
        });

        // 2. Initiate Payment
        if (paymentMethod === "mpesa") {
            const result = await initiateStkPush(deliveryInfo.phone, totalPrice + 500, order.id);
            return NextResponse.json({ success: true, orderId: order.id, type: "mpesa", result });
        } else if (paymentMethod === "card") {
            const checkoutUrl = await createStripeCheckout(items, order.id);
            return NextResponse.json({ success: true, orderId: order.id, type: "stripe", url: checkoutUrl });
        }

        return NextResponse.json({ success: true, orderId: order.id });
    } catch (error) {
        console.error("Checkout Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
