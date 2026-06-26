import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ObjectId } from 'mongodb';
import { getCachedValue, makeCacheKey, setCachedValue } from '@/lib/server-cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const cacheKey = makeCacheKey('product-facets', url);
        const cached = getCachedValue(cacheKey) as any | undefined;
        if (cached) {
            return NextResponse.json(cached, {
                headers: {
                    'Cache-Control': 'public, max-age=15, stale-while-revalidate=30',
                },
            });
        }
        const search = url.searchParams.get('search') ?? undefined;
        const category = url.searchParams.get('category') ?? undefined;
        const filter = url.searchParams.get('filter') ?? undefined;
        const minPrice = url.searchParams.get('minPrice') ? Number(url.searchParams.get('minPrice')) : undefined;
        const maxPrice = url.searchParams.get('maxPrice') ? Number(url.searchParams.get('maxPrice')) : undefined;
        const facet = url.searchParams.get('facet') ?? undefined; // specific facet name to page
        const page = url.searchParams.get('page') ? Math.max(1, Number(url.searchParams.get('page'))) : 1;
        const perPage = url.searchParams.get('perPage') ? Math.max(1, Number(url.searchParams.get('perPage'))) : 30;

        // Build Mongo match stage
        const match: any = { isActive: true };
        if (search) {
            const regex = { $regex: search, $options: 'i' };
            match.$or = [
                { name: regex },
                { slug: regex },
                { description: regex }
            ];
        }

        if (category) {
            // Resolve category id by slug to match categoryId objectId
            const cat = await prisma.category.findUnique({ where: { slug: category } });
            if (cat) match.categoryId = new ObjectId(cat.id);
            else match.categoryId = null; // no results
        }

        if (filter === 'sale') {
            match.comparePrice = { $ne: null };
        }

        if (filter === 'featured') {
            match.isFeatured = true;
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            match.price = {};
            if (minPrice !== undefined) match.price.$gte = minPrice;
            if (maxPrice !== undefined) match.price.$lte = maxPrice;
        }

        // Aggregation pipeline to compute attribute facets server-side
        // If a single facet is requested, run a pipeline that returns paged options and total count
        let pipeline: any[];
        if (facet) {
            const skip = (page - 1) * perPage;
            pipeline = [
                { $match: match },
                { $project: { attributes: 1 } },
                // Filter out non-object attributes using $cond
                { $project: { 
                    attributes: { 
                      $cond: [{ $eq: [{ $type: "$attributes" }, "object"] }, "$attributes", {}] 
                    } 
                } },
                { $project: { kv: { $objectToArray: '$attributes' } } },
                { $unwind: '$kv' },
                { $match: { 'kv.k': facet } },
                { $group: { _id: '$kv.v', count: { $sum: 1 } } },
                { $sort: { count: -1, _id: 1 } },
                { $facet: {
                    metadata: [ { $count: 'total' } ],
                    data: [ { $skip: skip }, { $limit: perPage } ]
                } }
            ];
        } else {
            pipeline = [
                { $match: match },
                { $project: { attributes: 1 } },
                // Filter out non-object attributes
                { $project: { 
                    attributes: { 
                      $cond: [{ $eq: [{ $type: "$attributes" }, "object"] }, "$attributes", {}] 
                    } 
                } },
                { $project: { kv: { $objectToArray: '$attributes' } } },
                { $unwind: '$kv' },
                { $group: { _id: { k: '$kv.k', v: '$kv.v' }, count: { $sum: 1 } } },
                { $group: { _id: '$_id.k', options: { $push: { value: '$_id.v', count: '$count' } } } },
                { $project: { name: '$_id', options: 1, _id: 0 } },
                { $sort: { name: 1 } }
            ];
        }

        // Try aggregate via runCommandRaw (uses MongoDB aggregate command)
        try {
            let aggRes = await prisma.$runCommandRaw({ aggregate: 'Product', pipeline, cursor: {} });
            const batch = (aggRes as any)?.cursor?.firstBatch ?? [];
            if (facet) {
                // pipeline used $facet, so batch[0] contains { metadata: [...], data: [...] }
                const meta = batch[0]?.metadata?.[0]?.total ?? 0;
                const data = batch[0]?.data ?? [];
                const options = data.map((d: any) => ({ value: d._id, count: d.count }));
                return NextResponse.json({ facet: facet, options, total: meta, page, perPage });
            }

            // When no facet param provided, return full facets array
            const facets = batch;
            return NextResponse.json({ facets });
        } catch (e) {
            console.warn('Aggregation via runCommandRaw failed, falling back to in-memory aggregation', e);
        }

        // Fallback: fetch limited products and compute facets in JS
        // Fallback: fetch limited products and compute facets in JS
        const products = await prisma.product.findMany({ where: match, select: { attributes: true }, take: 2000 });
        const map: Record<string, Record<string, number>> = {};
        for (const p of products) {
            const attrs = p.attributes as Record<string, any> | null;
            if (!attrs || typeof attrs !== 'object') continue;
            for (const [k, v] of Object.entries(attrs)) {
                if (v === null || v === undefined) continue;
                const val = String(v).trim();
                if (!val) continue;
                if (!map[k]) map[k] = {};
                map[k][val] = (map[k][val] || 0) + 1;
            }
        }

        // If a single facet was requested, page its options from the in-memory map
        if (facet) {
            const m = map[facet] || {};
            const entries = Object.entries(m).sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
            const total = entries.length;
            const start = (page - 1) * perPage;
            const paged = entries.slice(start, start + perPage);
            return NextResponse.json({ facet, options: paged, total, page, perPage });
        }

        const facets = Object.entries(map).map(([key, m]) => ({
            name: key,
            options: Object.entries(m).sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }))
        }));

        const body = { facets };
        setCachedValue(cacheKey, body, 30_000);
        return NextResponse.json(body, {
            headers: {
                'Cache-Control': 'public, max-age=15, stale-while-revalidate=30',
            },
        });
    } catch (error) {
        console.error('Product facets error', error);
        return NextResponse.json({ facets: [] }, { status: 500 });
    }
}
