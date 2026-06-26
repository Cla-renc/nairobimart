import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as { role?: string }).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { productId, categoryId } = body || {};
        if (!productId || !categoryId) {
            return NextResponse.json({ error: 'productId and categoryId are required' }, { status: 400 });
        }

        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!category) return NextResponse.json({ error: 'Invalid categoryId' }, { status: 400 });

        const updated = await prisma.product.update({ where: { id: productId }, data: { categoryId } });
        return NextResponse.json({ success: true, product: updated });
    } catch (error) {
        console.error('[PRODUCT_REASSIGN]', error);
        return NextResponse.json({ error: 'Failed to reassign product' }, { status: 500 });
    }
}
