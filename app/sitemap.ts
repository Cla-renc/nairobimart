import { MetadataRoute } from 'next'
import prisma from "@/lib/prisma"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://nairobimart.com"

    // Fetch all active products
    const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true }
    });

    const productUrls = products.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // Fetch all active categories
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true }
    });

    const categoryUrls = categories.map((category) => ({
        url: `${baseUrl}/categories/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        ...productUrls,
        ...categoryUrls,
    ]
}
