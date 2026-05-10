import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search') || '';

        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                AND: [
                    category ? { category: { name: { equals: category, mode: 'insensitive' } } } : {},
                    search ? { name: { contains: search, mode: 'insensitive' } } : {}
                ]
            },
            include: {
                images: true,
                category: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Map database product to the format expected by the frontend
        const formattedProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            comparePrice: p.comparePrice,
            image: p.images?.[0]?.url || "/images/placeholder.jpg",
            category: p.category?.name || "Uncategorized",
            rating: 4.5, // Default rating as we don't have reviews yet
            isFeatured: p.isFeatured || false,
            isSale: !!p.comparePrice
        }));

        return NextResponse.json(formattedProducts);
    } catch (error: unknown) {
        console.error("Error fetching public products:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
    }
}
