import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
    try {
        const session = await auth();

        if (!session || (session.user as { role?: string }).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true }
                },
                parent: {
                    select: { name: true }
                }
            },
            orderBy: {
                name: "asc"
            }
        });

        // Transform to include productCount for easier frontend use
        const transformedCategories = categories.map(cat => ({
            ...cat,
            productCount: cat._count.products
        }));

        return NextResponse.json(transformedCategories);
    } catch (error) {
        console.error("[CATEGORIES_GET]", error);
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
        const { name, slug, description, imageUrl, parentId, isActive, position } = body;

        if (!name || !slug) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Check if slug is unique
        const existingCategory = await prisma.category.findUnique({
            where: { slug }
        });

        if (existingCategory) {
            return new NextResponse("Slug already exists", { status: 400 });
        }

        const category = await prisma.category.create({
            data: {
                name,
                slug,
                description,
                imageUrl,
                parentId,
                isActive: isActive ?? true,
                position: position ?? 0
            }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("[CATEGORIES_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
