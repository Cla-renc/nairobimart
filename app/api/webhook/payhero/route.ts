import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { processPurchaseRewards } from "@/lib/loyalty";
import { pusherServer } from "@/lib/pusher";

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

            // TRIGGER REAL-TIME PUSHER EVENT
            try {
                await pusherServer.trigger("admin-orders", "order-paid", {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    status: "paid"
                });
            } catch (pusherErr) {
                console.error("Pusher trigger failed:", pusherErr);
            }

            if (order.userId) {
                await processPurchaseRewards(order.id);
            }
            const { processSuccessfulPayment } = await import("@/lib/postPayment");
            await processSuccessfulPayment(order.id);

            // Detect if this is a WhatsApp order
            const isWhatsAppOrder = order.notes?.includes('Source: whatsapp');
            const shippingAddr = order.shippingAddress as any;
            const customerPhone = shippingAddr?.phone || '';
            const customerName = shippingAddr?.name || 'Valued Customer';
            const deliveryAddress = shippingAddr?.address || '';
            const customerEmail = shippingAddr?.email || (updatedOrder as any).shippingEmail || '';

            // --- Email Confirmation ---
            if (customerEmail) {
                try {
                    const { sendOrderConfirmationEmail } = await import('@/lib/email');
                    await sendOrderConfirmationEmail(customerEmail, updatedOrder.orderNumber, updatedOrder.total);
                    console.log(`✅ Confirmation email sent to: ${customerEmail}`);
                } catch (emailError) {
                    console.error('❌ Failed to send confirmation email:', emailError);
                }
            }

            // --- SMS Confirmation ---
            if (customerPhone) {
                try {
                    const { sendOrderConfirmationSMS } = await import('@/lib/sms');
                    await sendOrderConfirmationSMS({
                        phone: customerPhone,
                        customerName,
                        orderNumber: updatedOrder.orderNumber,
                        total: `KES ${updatedOrder.total.toLocaleString()}`,
                        deliveryAddress,
                    });
                    console.log(`✅ Confirmation SMS sent to: ${customerPhone}`);
                } catch (smsError) {
                    console.error('❌ Failed to send confirmation SMS:', smsError);
                }
            }

            // --- WhatsApp Confirmation (WhatsApp orders only) ---
            if (isWhatsAppOrder && customerPhone && process.env.BOT_SERVER_URL) {
                try {
                    const waPhone = customerPhone.replace(/\D/g, '').replace(/^0/, '254');
                    const confirmMsg = `🎉 *Payment Confirmed!* Thank you, ${customerName}!\n\n✅ *Order Number:* ${updatedOrder.orderNumber}\n💰 *Amount Paid:* KES ${updatedOrder.total?.toLocaleString()}\n📦 *Delivery Address:* ${deliveryAddress}\n🚚 *Estimated Delivery:* 15–30 days\n\nWe'll notify you once your order is dispatched. Thank you for shopping with *NairobiMart!* 🛒✨`;
                    await fetch(`${process.env.BOT_SERVER_URL}/api/send-message`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: waPhone, message: confirmMsg }),
                    });
                    console.log(`✅ WhatsApp order confirmation sent to: ${waPhone}`);
                } catch (waError) {
                    console.error('❌ Failed to send WhatsApp confirmation:', waError);
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
