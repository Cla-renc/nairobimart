import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ success: false }, { status: 401 });
        }

        const { productId } = await req.json();

        if (!productId) {
            return NextResponse.json({ success: false, message: "Product ID required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) return NextResponse.json({ success: false }, { status: 404 });

        // Upsert the recently viewed record
        await prisma.recentlyViewed.upsert({
            where: {
                userId_productId: {
                    userId: user.id,
                    productId: productId
                }
            },
            update: {
                viewedAt: new Date()
            },
            create: {
                userId: user.id,
                productId: productId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Recently viewed tracking error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, products: [] }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                recentlyViewed: {
                    orderBy: { viewedAt: 'desc' },
                    take: 5,
                    include: { product: true }
                }
            }
        });

        if (!user || user.recentlyViewed.length === 0) {
            return NextResponse.json({ success: true, products: [] });
        }

        // Get categories of recently viewed products
        const categoryIds = Array.from(new Set(user.recentlyViewed.map(rv => rv.product.categoryId)));

        // Find other products in these categories, excluding ones already viewed
        const viewedProductIds = user.recentlyViewed.map(rv => rv.productId);

        const recommendations = await prisma.product.findMany({
            where: {
                categoryId: { in: categoryIds },
                id: { notIn: viewedProductIds },
                isActive: true
            },
            include: { images: true },
            take: 8,
            orderBy: {
                // simple heuristic for "AI" - mix between new and featured
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ success: true, products: recommendations });
    } catch (error) {
        console.error("Recommendations error:", error);
        return NextResponse.json({ success: false, products: [] }, { status: 500 });
    }
}
