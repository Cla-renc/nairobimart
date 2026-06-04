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

        // Send SMS if status changed
        if (status && status !== currentOrder.status) {
            let message = "";
            if (status === "shipped") {
                const waybill = trackingNumber || currentOrder.trackingNumber || "N/A";
                const url = trackingUrl || currentOrder.trackingUrl;
                
                message = `Hi ${order.shippingName}, your NairobiMart order ${order.orderNumber} has been dispatched. Waybill/Tracking Number: ${waybill}.`;
                if (url) message += ` Track your package here: ${url}`;
                else message += ` Expected arrival: 1-3 days.`;
            } else if (status === "delivered") {
                message = `Hi ${order.shippingName}, your NairobiMart order ${order.orderNumber} has been successfully delivered. Thank you for shopping with us!`;
            }

            if (message && order.shippingPhone) {
                await sendSMS(order.shippingPhone, message);
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
