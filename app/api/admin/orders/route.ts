import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";

        const where: Record<string, unknown> = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { shippingName: { contains: search, mode: 'insensitive' } },
                { shippingPhone: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const orders = await prisma.order.findMany({
            where: where as import("@prisma/client").Prisma.OrderWhereInput,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: { items: true },
                },
            },
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("[ORDERS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
