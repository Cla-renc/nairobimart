import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fetchCJProductList, fetchCJProductDetail } from '@/lib/cjdropshipping';
import { Prisma } from '@prisma/client';

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

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const maxPages = Number(url.searchParams.get('maxPages') || process.env.CJ_SEED_MAX_PAGES || 50);
        const maxPerCategory = Number(url.searchParams.get('maxPerCategory') || process.env.CJ_SEED_MAX_PER_CATEGORY || 0); // 0 = unlimited
        const force = (url.searchParams.get('force') || 'false').toLowerCase() === 'true';
        const verbose = (url.searchParams.get('verbose') || 'false').toLowerCase() === 'true';

        const categories = await prisma.category.findMany();
        if (categories.length === 0) {
            return NextResponse.json({ success: false, message: "No categories found in the database. Please create them first." }, { status: 400 });
        }

        let insertedCount = 0;
        let skippedCount = 0;
        let updatedCount = 0;
        const report: any[] = [];

        for (const category of categories) {
            const keyword = getSearchKeyword(category.name);
            console.log(`Seeding category: ${category.name} with keyword: ${keyword}`);

            const categoryReport: any = {
                category: category.name,
                keyword,
                pagesProcessed: 0,
                productsFound: 0,
                inserted: 0,
                updated: 0,
                skipped: 0,
                samples: [] as string[],
            };

            // Iterate pages until no more results or limits reached
            let page = 1;
            let processedCount = 0;
            const pageDelayMs = Number(process.env.CJ_SEED_PAGE_DELAY_MS || 300);

            // Process helper
            interface CJProduct {
                id: string;
                nameEn?: string;
                sellPrice?: string;
                bigImage?: string;
                productImage?: string;
                sku?: string;
                description?: string;
                [key: string]: unknown;
            }

            outer: while (page <= maxPages) {
                const cjResponse = await fetchCJProductList(keyword, undefined, page);

                if (!cjResponse.success) {
                    console.error(`CJ API Error for keyword ${keyword} page ${page}:`, cjResponse.error);
                    break outer;
                }

                const content = cjResponse.data?.content;
                const products = content && content.length > 0 ? content[0].productList : null;

                if (!products || products.length === 0) break outer;

                console.log(`Found ${products.length} products for ${keyword} on page ${page}`);
                categoryReport.pagesProcessed = page;

                for (const pd of products as CJProduct[]) {
                    // collect sample ids (limited)
                    if (categoryReport.samples.length < 10 && pd.id) categoryReport.samples.push(pd.id);
                    categoryReport.productsFound++;
                    try {
                        // Check if already exists by CJ ID
                        const exists = await prisma.product.findFirst({
                            where: { cjProductId: pd.id },
                            include: { images: true }
                        });

                        // If exists and has rich description already, skip this product unless force update requested
                        if (exists && exists.description && exists.description.length > 100 && !force) {
                            skippedCount++;
                            categoryReport.skipped++;
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
                        let imageUrls = [pd.bigImage || pd.productImage || ""];
                        if (detail?.productImagePool) {
                            const pool = detail.productImagePool.split(',');
                            if (pool.length > 0) imageUrls = pool;
                        }

                        // Extract technical attributes if available
                        let attributes = null;
                        if (detail?.productAttributes) {
                            try {
                                if (typeof detail.productAttributes === 'string') {
                                    attributes = JSON.parse(detail.productAttributes);
                                } else {
                                    attributes = detail.productAttributes;
                                }
                            } catch (e) {
                                console.error("Error parsing CJ attributes:", e);
                            }
                        }

                        if (exists) {
                            const existingProduct = exists as Record<string, unknown>;
                            // Update existing product with missing details
                            // Determine best matching category from CJ metadata or fall back to review bucket
                            const candidateNames = [
                                (detail as any)?.oneCategoryName,
                                (detail as any)?.twoCategoryName,
                                (detail as any)?.threeCategoryName,
                            ].filter(Boolean).map((s: any) => String(s).trim());

                            let assignedCategoryId: string | null = null;
                            for (const name of candidateNames) {
                                const found = await prisma.category.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
                                if (found) { assignedCategoryId = found.id; break; }
                            }

                            if (!assignedCategoryId) {
                                // fallback to a review bucket so admin can reassign later
                                const review = await prisma.category.upsert({
                                    where: { slug: 'imported-cj' },
                                    update: {},
                                    create: { name: 'Imported (CJ)', slug: 'imported-cj', isActive: false }
                                });
                                assignedCategoryId = review.id;
                            }

                            await prisma.product.update({
                                where: { id: existingProduct.id as string },
                                data: {
                                    description: detail?.description || existingProduct.description as string,
                                    attributes: attributes || existingProduct.attributes || null,
                                    comparePrice: (existingProduct.comparePrice as number) || Math.round(retailPriceKES * 1.3),
                                    category: { connect: { id: assignedCategoryId } },
                                    images: {
                                        deleteMany: {}, // Fresh start for images to ensure order and quality
                                        create: imageUrls.map((url: string, index: number) => ({
                                            url: url || "",
                                            position: index
                                        }))
                                    }
                                } as unknown as Prisma.ProductUpdateInput
                            });
                            updatedCount++;
                            categoryReport.updated++;
                            insertedCount++; // keep total increment for compatibility with previous message
                            processedCount++;
                            if (maxPerCategory > 0 && processedCount >= maxPerCategory) {
                                console.log(`Reached maxPerCategory=${maxPerCategory} for ${category.name}`);
                                break outer;
                            }
                        } else {
                            // Create new product
                            // Determine best matching category from CJ metadata or fall back to review bucket
                            const candidateNames = [
                                (detail as any)?.oneCategoryName,
                                (detail as any)?.twoCategoryName,
                                (detail as any)?.threeCategoryName,
                            ].filter(Boolean).map((s: any) => String(s).trim());

                            let assignedCategoryId: string | null = null;
                            for (const name of candidateNames) {
                                const found = await prisma.category.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
                                if (found) { assignedCategoryId = found.id; break; }
                            }

                            if (!assignedCategoryId) {
                                const review = await prisma.category.upsert({
                                    where: { slug: 'imported-cj' },
                                    update: {},
                                    create: { name: 'Imported (CJ)', slug: 'imported-cj', isActive: false }
                                });
                                assignedCategoryId = review.id;
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
                                    attributes: attributes || null,
                                    category: { connect: { id: assignedCategoryId } },
                                    isActive: true,
                                    images: {
                                        create: imageUrls.map((url: string, index: number) => ({
                                            url: url || "",
                                            position: index
                                        }))
                                    }
                                }
                            });
                            insertedCount++;
                            categoryReport.inserted++;
                            processedCount++;
                            if (maxPerCategory > 0 && processedCount >= maxPerCategory) {
                                console.log(`Reached maxPerCategory=${maxPerCategory} for ${category.name}`);
                                break outer;
                            }
                        }
                    } catch (err) {
                        console.error(`Error processing product ${pd.id}:`, err);
                    }
                }

                // small delay between pages to be kind to the CJ API
                await new Promise((r) => setTimeout(r, pageDelayMs));
                page++;
            }
            report.push(categoryReport);
        }

        const result: any = {
            success: true,
            message: `Seeding completed! Inserted ${insertedCount} new CJ products. Updated ${updatedCount}. Skipped ${skippedCount} duplicates.`
        };
        if (verbose) result.report = report;

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error("Critical error in seeding process:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
