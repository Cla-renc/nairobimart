import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";

        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where: where as import("@prisma/client").Prisma.ProductWhereInput,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    category: true,
                    images: { take: 1 }
                }
            }),
            prisma.product.count({ where: where as import("@prisma/client").Prisma.ProductWhereInput })
        ]);

        return NextResponse.json({
            products,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Admin products fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            name,
            slug,
            description,
            price,
            comparePrice,
            sku,
            stock,
            category,
            status,
            cjProductId
        } = body;

        // Generate category slug
        const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Find or create category
        const dbCategory = await prisma.category.upsert({
            where: { slug: categorySlug },
            update: {},
            create: {
                name: category,
                slug: categorySlug
            }
        });

        // Ensure product slug uniqueness
        let finalSlug = slug;
        const existingProduct = await prisma.product.findUnique({ where: { slug } });
        if (existingProduct) {
            finalSlug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }

        const product = await prisma.product.create({
            data: {
                name,
                slug: finalSlug,
                description,
                price: parseFloat(price),
                comparePrice: comparePrice ? parseFloat(comparePrice) : null,
                costPrice: parseFloat(price) * 0.7, // Fallback cost price
                sku: sku || `SKU-${Date.now()}`,
                stock: parseInt(stock),
                categoryId: dbCategory.id,
                isActive: status === "Active",
                cjProductId: cjProductId || null,
            },
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error("Admin product creation error:", error);
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}
