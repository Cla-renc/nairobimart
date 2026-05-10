import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

// GET single customer with full details
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await auth();
        if (!session || (session.user as { role?: string }).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const customer = await prisma.user.findUnique({
            where: { id: params.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                image: true,
                createdAt: true,
                orders: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                    select: {
                        id: true,
                        orderNumber: true,
                        total: true,
                        status: true,
                        createdAt: true,
                    }
                },
                _count: {
                    select: { orders: true, reviews: true, wishlist: true }
                }
            }
        });

        if (!customer) {
            return new NextResponse("Customer not found", { status: 404 });
        }

        const totalSpent = await prisma.order.aggregate({
            where: { userId: params.id },
            _sum: { total: true }
        });

        return NextResponse.json({
            ...customer,
            totalSpent: totalSpent._sum.total || 0,
        });
    } catch (error) {
        console.error("[CUSTOMER_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// PATCH - update role or suspended status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await auth();
        if (!session || (session.user as { role?: string }).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { role } = body;

        const updated = await prisma.user.update({
            where: { id: params.id },
            data: { role },
            select: { id: true, name: true, email: true, role: true }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[CUSTOMER_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// DELETE - remove customer account
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await auth();
        if (!session || (session.user as { role?: string }).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Prevent deleting yourself
        if ((session.user as { id?: string }).id === params.id) {
            return new NextResponse("Cannot delete your own account", { status: 400 });
        }

        await prisma.user.delete({ where: { id: params.id } });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[CUSTOMER_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
