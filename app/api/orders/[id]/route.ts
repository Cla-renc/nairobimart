import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const order = await prisma.order.findUnique({
            where: { id },
            select: {
                id: true,
                orderNumber: true,
                paymentMethod: true,
                paymentStatus: true,
                status: true,
                total: true,
                subtotal: true,
                shippingFee: true,
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error("Get Order Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch order" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Resolve DB user by email (most reliable)
        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Find the order
        const order = await prisma.order.findUnique({
            where: { id: params.id },
            select: { id: true, userId: true }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Admins can delete any order; users can only delete their own
        const isAdmin = (dbUser.role as string) === "admin";
        const isOwner = order.userId === dbUser.id;

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: "You can only delete your own orders" }, { status: 403 });
        }

        await prisma.order.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Order Error:", error);
        return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
    }
}
