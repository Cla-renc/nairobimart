import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";

export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: params.id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, phone: true },
                },
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, slug: true, images: { take: 1 } },
                        },
                        variant: { select: { name: true, value: true } },
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { status, paymentStatus, trackingNumber, trackingUrl, notes } = body;

        const currentOrder = await prisma.order.findUnique({ where: { id: params.id } });
        if (!currentOrder) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        const updateData: Record<string, string> = {};
        if (status) updateData.status = status;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
        if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl;
        if (notes !== undefined) updateData.notes = notes;

        const order = await prisma.order.update({
            where: { id: params.id },
            data: updateData,
        });

        // Send SMS & WhatsApp if status changed
        if (status && status !== currentOrder.status) {
            let message = "";
            let triggerWhatsApp = false;

            if (status === "shipped") {
                const waybill = trackingNumber || currentOrder.trackingNumber || "N/A";
                const url = trackingUrl || currentOrder.trackingUrl;
                
                message = `Hi ${order.shippingName}, your NairobiMart order ${order.orderNumber} has been dispatched. Waybill/Tracking Number: ${waybill}.`;
                if (url) message += ` Track your package here: ${url}`;
                else message += ` Expected arrival: 1-3 days.`;

                triggerWhatsApp = true;
            } else if (status === "delivered") {
                message = `Hi ${order.shippingName}, your NairobiMart order ${order.orderNumber} has been successfully delivered. Thank you for shopping with us!`;
            }

            if (message && order.shippingPhone) {
                await sendSMS(order.shippingPhone, message).catch(console.error);
            }

            // WhatsApp Integration
            if (triggerWhatsApp) {
                try {
                    const botUrl = process.env.WHATSAPP_BOT_URL || 'http://localhost:3000';
                    const phone = order.shippingPhone;
                    
                    if (phone) {
                        await fetch(`${botUrl}/api/send-dispatch`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                phone,
                                customerName: order.shippingName || "Customer",
                                orderNumber: order.orderNumber,
                                trackingUrl: trackingUrl || currentOrder.trackingUrl || ""
                            })
                        });
                        console.log(`WhatsApp dispatch notification sent for ${order.orderNumber}`);
                    }
                } catch (botError) {
                    console.error("WhatsApp trigger failed in order update:", botError);
                }
            }
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.order.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting order:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
