import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: params.id },
            include: {
                category: true,
                images: true,
            },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Product fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
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

        // Find or create category
        const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const dbCategory = await prisma.category.upsert({
            where: { slug: categorySlug },
            update: {},
            create: {
                name: category,
                slug: categorySlug
            }
        });

        const updatedProduct = await prisma.product.update({
            where: { id: params.id },
            data: {
                name,
                slug,
                description,
                price: parseFloat(price),
                comparePrice: comparePrice ? parseFloat(comparePrice) : null,
                sku,
                stock: parseInt(stock),
                categoryId: dbCategory.id,
                isActive: status === "Active",
                cjProductId: cjProductId || null,
            },
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error("Product update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.product.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Product delete error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
