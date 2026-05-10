import { Metadata } from "next";
import ProductDetailClient from "@/components/store/ProductDetailClient";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const product = await prisma.product.findUnique({
        where: { slug: params.slug },
    });

    if (!product) {
        return {
            title: "Product Not Found | NairobiMart"
        };
    }

    return {
        title: `${product.name} | NairobiMart`,
        description: product.description.substring(0, 160),
        openGraph: {
            title: product.name,
            description: product.description.substring(0, 160),
        }
    };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
    const product = await prisma.product.findUnique({
        where: { slug: params.slug },
        include: {
            images: { orderBy: { position: 'asc' } },
            category: true,
            variants: true,
        }
    });

    if (!product) {
        notFound();
    }

    // Related products (same category, excluding current)
    const relatedProductsDb = await prisma.product.findMany({
        where: {
            categoryId: product.categoryId,
            id: { not: product.id },
            isActive: true
        },
        take: 4,
        include: { images: true, category: true }
    });

    return (
        <ProductDetailClient
            product={JSON.parse(JSON.stringify(product))}
            relatedProducts={JSON.parse(JSON.stringify(relatedProductsDb))}
        />
    );
}
