import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page') ?? '1');
        const perPage = Math.min(Number(url.searchParams.get('perPage') ?? '12'), 100);
        const search = url.searchParams.get('search') ?? undefined;
        const category = url.searchParams.get('category') ?? undefined;
        const filter = url.searchParams.get('filter') ?? undefined;
        const sort = url.searchParams.get('sort') ?? 'newest';
        const minPrice = url.searchParams.get('minPrice') ? Number(url.searchParams.get('minPrice')) : undefined;
        const maxPrice = url.searchParams.get('maxPrice') ? Number(url.searchParams.get('maxPrice')) : undefined;

        const where: any = { isActive: true };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (category) {
            where.category = { slug: category };
        }

        if (filter === 'sale') {
            where.comparePrice = { not: null };
        }

        if (filter === 'featured') {
            where.isFeatured = true;
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price.gte = minPrice;
            if (maxPrice !== undefined) where.price.lte = maxPrice;
        }

        // Sorting
        let orderBy: any = { createdAt: 'desc' };
        if (sort === 'price-low') orderBy = { price: 'asc' };
        if (sort === 'price-high') orderBy = { price: 'desc' };

        const skip = Math.max(0, (page - 1) * perPage);

        const [items, total] = await Promise.all([
            prisma.product.findMany({
                where,
                take: perPage,
                skip,
                orderBy,
                include: { images: true, category: true }
            }),
            prisma.product.count({ where })
        ]);

        const products = items.map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            comparePrice: p.comparePrice ?? null,
            category: p.category?.name ?? null,
            image: p.images?.[0]?.url ?? '/images/placeholder.jpg',
            attributes: p.attributes ?? null,
            rating: 4.5,
            isFeatured: p.isFeatured,
        }));

        return NextResponse.json({ products, total, page, perPage });
    } catch (error) {
        console.error('Products API error', error);
        return NextResponse.json({ products: [], total: 0, page: 1, perPage: 12 }, { status: 500 });
    }
}
