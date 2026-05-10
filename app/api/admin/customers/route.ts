import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as { role?: string }).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const role = searchParams.get("role") || "";

        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (role && (role === "admin" || role === "customer")) {
            where.role = role;
        }

        const customers = await prisma.user.findMany({
            where: where as import("@prisma/client").Prisma.UserWhereInput,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                image: true,
                createdAt: true,
                _count: {
                    select: { orders: true, reviews: true }
                },
                orders: {
                    select: { total: true },
                }
            }
        });

        const enriched = customers.map(c => ({
            ...c,
            orderCount: c._count.orders,
            reviewCount: c._count.reviews,
            totalSpent: c.orders.reduce((sum, o) => sum + o.total, 0),
            orders: undefined,
            _count: undefined,
        }));

        return NextResponse.json(enriched);
    } catch (error) {
        console.error("[CUSTOMERS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
