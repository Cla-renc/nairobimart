import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
    try {
        const session = await auth();

        if (!session || (session.user as { role?: string }).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const coupons = await prisma.coupon.findMany({
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json(coupons);
    } catch (error) {
        console.error("[COUPONS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session || (session.user as { role?: string }).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { code, type, value, minOrder, maxUses, expiresAt } = body;

        if (!code || !type || value === undefined || !expiresAt) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const coupon = await prisma.coupon.create({
            data: {
                code,
                type,
                value,
                minOrder,
                maxUses,
                expiresAt: new Date(expiresAt),
                isActive: true
            }
        });

        return NextResponse.json(coupon);
    } catch (error) {
        console.error("[COUPONS_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
