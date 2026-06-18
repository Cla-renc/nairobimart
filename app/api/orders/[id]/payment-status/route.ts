import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    ...(isValidObjectId ? [{ id }] : []),
                    { orderNumber: id }
                ]
            }
        });

        if (!order) {
            return NextResponse.json(
                { success: false, message: "Order not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            orderId: order.id,
            paymentStatus: order.paymentStatus,
            isPaid: order.paymentStatus === "paid"
        });
    } catch (error) {
        console.error("Error checking payment status:", error);
        return NextResponse.json(
            { success: false, message: "Failed to check payment status" },
            { status: 500 }
        );
    }
}
