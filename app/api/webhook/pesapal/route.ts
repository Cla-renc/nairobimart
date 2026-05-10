import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Log the webhook payload for debugging
        console.log("PesaPal Webhook received:", body);

        // PesaPal sends different event types
        // For completed payments, we need to update the order status
        if (body.event_type === "ORDER_COMPLETED" || body.status === "COMPLETED") {
            const orderId = body.merchant_reference || body.order_tracking_id;

            if (orderId) {
                // Update order status to paid
                await prisma.order.update({
                    where: { id: orderId },
                    data: {
                        paymentStatus: "paid",
                        status: "processing",
                        pesapalTransactionId: body.order_tracking_id || body.transaction_id,
                    },
                });

                console.log(`✅ Order ${orderId} marked as paid via PesaPal`);
                return NextResponse.json({ success: true });
            }
        }

        // Handle other PesaPal events as needed
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PesaPal Webhook Error:", error);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
}