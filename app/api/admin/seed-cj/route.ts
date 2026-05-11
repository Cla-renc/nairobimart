import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fetchCJProductList, fetchCJProductDetail } from '@/lib/cjdropshipping';

export const dynamic = 'force-dynamic';

// Map our categories to typical CJ search keywords
const KEYWORDS: Record<string, string> = {
    'electronics': 'electronics',
    'laptop': 'laptop',
    'watch': 'watch',
    'fashion': 'clothing',
    'beauty': 'beauty',
    'toy': 'toys',
    'home': 'decor',
    'kitchen': 'kitchen',
    'automotive': 'car accessories',
    'office': 'office',
    'security': 'security camera'
};

function getSearchKeyword(categoryName: string): string {
    const lowerName = categoryName.toLowerCase();

    // Check for predefined keywords as substrings
    for (const [key, value] of Object.entries(KEYWORDS)) {
        if (lowerName.includes(key)) {
            return value;
        }
    }

    // Default: Clean the name (remove common special chars and take first few words)
    return categoryName
        .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, ' ')
        .split(' ')
        .filter(word => word.length > 2)
        .slice(0, 2)
        .join(' ') || categoryName;
}

export async function GET() {
    try {
        const categories = await prisma.category.findMany();
        if (categories.length === 0) {
            return NextResponse.json({ success: false, message: "No categories found in the database. Please create them first." }, { status: 400 });
        }

        let insertedCount = 0;
        let skippedCount = 0;

        for (const category of categories) {
            const keyword = getSearchKeyword(category.name);
            console.log(`Seeding category: ${category.name} with keyword: ${keyword}`);

            // Default to page 1 to ensure results are found.
            // Using random page > 1 often returns empty results for specific keywords.
            const cjResponse = await fetchCJProductList(keyword, undefined, 1);

            if (!cjResponse.success) {
                console.error(`CJ API Error for keyword ${keyword}:`, cjResponse.error);
                continue;
            }

            const content = cjResponse.data?.content;
            const products = content && content.length > 0 ? content[0].productList : null;

            if (products && products.length > 0) {
                console.log(`Found ${products.length} products for ${keyword}`);
                const topProducts = products.slice(0, 10); // Take top 10 to be efficient

                for (const pd of topProducts) {
                    // Check if already exists by CJ ID
                    const exists = await prisma.product.findFirst({ where: { cjProductId: pd.id } });
                    if (exists) {
                        skippedCount++;
                        continue;
                    }

                    // Fetch full product detail for rich description and all images
                    const detailResponse = await fetchCJProductDetail(pd.id);
                    const detail = detailResponse.success ? detailResponse.data : null;

                    // Handle string prices like "8.79 -- 9.95" by taking the first number
                    const priceString = detail?.sellPrice || pd.sellPrice || "10";
                    const firstPrice = priceString.split(' ')[0];
                    const basePrice = parseFloat(firstPrice) || 10;

                    // Apply 50% markup and convert roughly to KES (1 USD = 130 KES)
                    const retailPriceKES = Math.round(basePrice * 1.5 * 130);

                    // Get all images from pool or fallbacks
                    let imageUrls = [pd.bigImage || pd.productImage];
                    if (detail?.productImagePool) {
                        const pool = detail.productImagePool.split(',');
                        if (pool.length > 0) imageUrls = pool;
                    }

                    await prisma.product.create({
                        data: {
                            name: detail?.productNameEn || pd.nameEn || "CJ Product",
                            slug: `cj-${pd.id}-${Math.floor(Math.random() * 10000)}`,
                            description: detail?.description || pd.description || "High quality dropshipping product.",
                            price: retailPriceKES,
                            costPrice: basePrice * 130, // save cost in KES
                            comparePrice: Math.round(retailPriceKES * 1.3), // Suggested retail price
                            stock: 100,
                            sku: detail?.productSku || pd.sku || `CJ-SKU-${pd.id}`,
                            cjProductId: pd.id,
                            categoryId: category.id,
                            isActive: true,
                            images: {
                                create: imageUrls.map((url: string, index: number) => ({
                                    url: url,
                                    position: index
                                }))
                            }
                        }
                    });
                    insertedCount++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Seeding completed! Inserted ${insertedCount} new CJ products. (Skipped ${skippedCount} duplicates)`
        });
    } catch (error: unknown) {
        console.error("Critical error in seeding process:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
