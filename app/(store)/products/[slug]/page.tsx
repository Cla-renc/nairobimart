import { Metadata } from "next";
import ProductDetailClient from "@/components/store/ProductDetailClient";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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

    const reviews = await prisma.review.findMany({
        where: { productId: product.id, isApproved: true },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: 'desc' }
    });

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

    // Frequently Bought Together Logic
    const orderItemsWithCurrent = await prisma.orderItem.findMany({
        where: { productId: product.id },
        select: { orderId: true },
    });
    const orderIds = orderItemsWithCurrent.map(oi => oi.orderId);
    let freqBoughtProducts: any[] = [];
    
    if (orderIds.length > 0) {
        const relatedItems = await prisma.orderItem.findMany({
            where: {
                orderId: { in: orderIds },
                productId: { not: product.id },
            },
            include: {
                product: { include: { images: true, category: true } }
            }
        });
        
        const freqMap = new Map();
        for (const item of relatedItems) {
            if (!freqMap.has(item.productId)) {
                freqMap.set(item.productId, { count: 0, product: item.product });
            }
            freqMap.get(item.productId).count++;
        }
        
        freqBoughtProducts = Array.from(freqMap.values())
            .sort((a: any, b: any) => b.count - a.count)
            .slice(0, 4)
            .map((item: any) => item.product);
    }

    // Generate JSON-LD Schema
    const jsonLd = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": product.images.length > 0 ? product.images[0].url : "",
        "description": product.description,
        "sku": product.id,
        "offers": {
            "@type": "Offer",
            "url": `https://nairobimart.com/products/${product.slug}`,
            "priceCurrency": "KES",
            "price": product.price,
            "itemCondition": "https://schema.org/NewCondition",
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        },
        "aggregateRating": reviews.length > 0 ? {
            "@type": "AggregateRating",
            "ratingValue": (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1),
            "reviewCount": reviews.length
        } : undefined
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ProductDetailClient
                product={JSON.parse(JSON.stringify(product))}
                relatedProducts={JSON.parse(JSON.stringify(relatedProductsDb))}
                frequentlyBought={JSON.parse(JSON.stringify(freqBoughtProducts))}
                reviews={JSON.parse(JSON.stringify(reviews))}
            />
        </>
    );
}
