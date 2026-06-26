import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (!session || (session.user as { role?: string }).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const cat = await prisma.category.findUnique({ where: { slug: 'imported-cj' } });
        if (!cat) return NextResponse.json([]);

        const products = await prisma.product.findMany({
            where: { categoryId: cat.id },
            orderBy: { createdAt: 'desc' },
            include: { images: { take: 1 }, category: true }
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('[IMPORTED_PRODUCTS_GET]', error);
        return NextResponse.json({ error: 'Failed to fetch imported products' }, { status: 500 });
    }
}
