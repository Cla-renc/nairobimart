import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fetchCJProductList } from '@/lib/cjdropshipping';

// Map our categories to typical CJ search keywords
const KEYWORDS: Record<string, string> = {
    'Electronics': 'electronics smart gadgets',
    'Laptops': 'laptop computer Macbook gaming laptop',
    'Accessories': 'watch jewelry accessories',
    'Fashion': 'clothing fashion trend',
    'Beauty': 'beauty health makeup',
    'Gifts': 'gift toys novelty',
    'Home': 'home decor kitchen',
};

export async function GET() {
    try {
        const categories = await prisma.category.findMany();
        if (categories.length === 0) {
            return NextResponse.json({ success: false, message: "No categories found in the database. Please create them first." }, { status: 400 });
        }

        let insertedCount = 0;
        let skippedCount = 0;

        for (const category of categories) {
            const keyword = KEYWORDS[category.name] || category.name;
            // Generate a random page anywhere between 1 and 500 to access the deepest parts of the catalog
            const randomPage = Math.floor(Math.random() * 500) + 1;
            const cjResponse = await fetchCJProductList(keyword, undefined, randomPage);

            const content = cjResponse.data?.content;
            const products = content && content.length > 0 ? content[0].productList : null;

            if (cjResponse.success && products) {
                const topProducts = products.slice(0, 50); // Take top 50

                for (const pd of topProducts) {
                    // Check if already exists by CJ ID
                    const exists = await prisma.product.findFirst({ where: { cjProductId: pd.id } });
                    if (exists) {
                        skippedCount++;
                        continue;
                    }

                    // Handle string prices like "8.79 -- 9.95" by taking the first number
                    const priceString = pd.sellPrice ? pd.sellPrice.split(' ')[0] : "10";
                    const basePrice = parseFloat(priceString) || 10;
                    // Apply 50% markup and convert roughly to KES (1 USD = 130 KES)
                    const retailPriceKES = Math.round(basePrice * 1.5 * 130);

                    await prisma.product.create({
                        data: {
                            name: pd.nameEn || "CJ Product",
                            slug: `cj-${pd.id}-${Math.floor(Math.random() * 10000)}`,
                            description: pd.description || "High quality dropshipping product.",
                            price: retailPriceKES,
                            costPrice: basePrice * 130, // save cost in KES
                            stock: 50,
                            sku: pd.sku || `CJ-SKU-${pd.id}`,
                            cjProductId: pd.id,
                            categoryId: category.id,
                            isActive: true,
                            images: {
                                create: [
                                    { url: pd.bigImage || pd.productImage, position: 0 }
                                ]
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
