import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { processPurchaseRewards } from "@/lib/loyalty";

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        console.log("=== PAY HERO WEBHOOK ===");
        console.log(JSON.stringify(payload, null, 2));

        // The payload structure can be nested under "response" or flat.
        const data = payload.response || payload;

        const {
            result_code,
            ResultCode,
            external_reference,
            ExternalReference,
            mpesa_receipt_number,
            MpesaReceiptNumber,
            status
        } = data;

        const code = result_code !== undefined ? result_code : ResultCode;
        const orderId = external_reference || ExternalReference;
        const receipt = mpesa_receipt_number || MpesaReceiptNumber;
        const isSuccess = code === 0 || status === "Success";

        if (!orderId) {
            console.error("No external reference (Order ID) in payload");
            return NextResponse.json({ success: false, message: "Missing Order ID" }, { status: 400 });
        }

        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    ...(isValidObjectId ? [{ id: orderId }] : []),
                    { orderNumber: orderId }
                ]
            }
        });

        if (!order) {
            console.error(`Order not found: ${orderId}`);
            return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
        }

        if (order.paymentStatus === "paid") {
            console.log(`Order ${orderId} is already paid. Ignoring callback.`);
            return NextResponse.json({ success: true, message: "Already processed" });
        }

        if (isSuccess) {
            console.log(`Payment successful for order ${orderId}. Receipt: ${receipt}`);

            // Update order and installment status
            const updatedOrder = await prisma.order.update({
                where: { id: order.id },
                data: {
                    paymentStatus: "paid",
                    mpesaTransactionId: receipt,
                }
            });

            await prisma.paymentInstallment.updateMany({
                where: { orderId: order.id },
                data: {
                    paymentStatus: "completed",
                }
            });

            if (order.userId) {
                await processPurchaseRewards(order.id);
            }
            const { processSuccessfulPayment } = await import("@/lib/postPayment");
            await processSuccessfulPayment(order.id);

            // Send confirmation email ONLY after payment is confirmed
            if (updatedOrder.shippingEmail) {
                try {
                    const { sendOrderConfirmationEmail } = await import("@/lib/email");
                    await sendOrderConfirmationEmail(updatedOrder.shippingEmail, updatedOrder.orderNumber, updatedOrder.total);
                    console.log(`✅ Order confirmation email sent after M-Pesa payment for: ${updatedOrder.shippingEmail}`);
                } catch (emailError) {
                    console.error("❌ Failed to send confirmation email after M-Pesa payment:", emailError);
                    // Don't fail the webhook if email fails - payment is already confirmed
                }
            }
        } else {
            console.log(`Payment failed or cancelled for order ${orderId}. Code: ${code}`);
            
            // Optionally, mark order as failed or keep as pending so they can retry
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    paymentStatus: "failed",
                }
            });

            await prisma.paymentInstallment.updateMany({
                where: { orderId: order.id },
                data: {
                    paymentStatus: "failed",
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Pay Hero Webhook Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
