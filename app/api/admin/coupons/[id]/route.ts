import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session || (session.user as { role: string }).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { code, type, value, minOrder, maxUses, expiresAt, isActive } = body;

        const coupon = await prisma.coupon.update({
            where: { id: params.id },
            data: {
                code,
                type,
                value,
                minOrder,
                maxUses,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined,
                isActive
            }
        });

        return NextResponse.json(coupon);
    } catch (error) {
        console.error("[COUPON_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session || (session.user as { role: string }).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await prisma.coupon.delete({
            where: { id: params.id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[COUPON_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
