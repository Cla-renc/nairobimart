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
        const { name, slug, description, imageUrl, parentId, isActive, position } = body;

        // Check if slug is unique (if slug is provided)
        if (slug) {
            const existingCategory = await prisma.category.findFirst({
                where: {
                    slug,
                    NOT: { id: params.id }
                }
            });

            if (existingCategory) {
                return new NextResponse("Slug already exists", { status: 400 });
            }
        }

        const category = await prisma.category.update({
            where: { id: params.id },
            data: {
                name,
                slug,
                description,
                imageUrl,
                parentId,
                isActive,
                position
            }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("[CATEGORY_PATCH]", error);
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

        // Check if category has products
        const productsCount = await prisma.product.count({
            where: { categoryId: params.id }
        });

        if (productsCount > 0) {
            return new NextResponse("Cannot delete category with products", { status: 400 });
        }

        // Check if category has subcategories
        const subcategoriesCount = await prisma.category.count({
            where: { parentId: params.id }
        });

        if (subcategoriesCount > 0) {
            return new NextResponse("Cannot delete category with subcategories", { status: 400 });
        }

        await prisma.category.delete({
            where: { id: params.id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[CATEGORY_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
