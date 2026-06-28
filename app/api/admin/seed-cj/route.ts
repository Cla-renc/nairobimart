import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fetchCJProductList, fetchCJProductDetail } from '@/lib/cjdropshipping';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Ordered list: MORE SPECIFIC keys must come BEFORE shorter/broader keys to avoid wrong matches
// e.g. "Smart Home & Security" must match 'smart home' before 'home'
const KEYWORD_MAP: { key: string; value: string }[] = [
    { key: 'smart home', value: 'smart home device' },
    { key: 'security', value: 'security camera' },
    { key: 'automotive', value: 'car accessories' },
    { key: 'electronics', value: 'phone accessories' },
    { key: 'computer', value: 'computer accessories' },
    { key: 'laptop', value: 'laptop' },
    { key: 'watch', value: 'watch' },
    { key: 'fashion', value: 'women fashion clothing' },
    { key: 'clothing', value: 'women fashion clothing' },
    { key: 'beauty', value: 'skincare beauty' },
    { key: 'skincare', value: 'skincare beauty' },
    { key: 'toy', value: 'toys' },
    { key: 'kitchen', value: 'kitchen gadgets' },
    { key: 'office', value: 'office desk accessories' },
    { key: 'home', value: 'home decor' },
];

function getSearchKeyword(categoryName: string): string {
    const lowerName = categoryName.toLowerCase();

    // Iterate in order — more specific keys are listed first
    for (const { key, value } of KEYWORD_MAP) {
        if (lowerName.includes(key)) {
            return value;
        }
    }

    // Default: use cleaned category name
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
        
        const startTime = Date.now();
        const VERCEL_TIMEOUT_MS = 7500; // Return early before Vercel 10s hobby timeout
        const isVercel = process.env.VERCEL === '1';

        const categories = await prisma.category.findMany();
        if (categories.length === 0) {
            return NextResponse.json({ success: false, message: "No categories found in the database. Please create them first." }, { status: 400 });
        }

        // Shuffle categories so repeated clicks don't get stuck skipping the same first category
        const shuffledCategories = categories.sort(() => Math.random() - 0.5);

        let insertedCount = 0;
        let skippedCount = 0;
        let updatedCount = 0;
        const report: any[] = [];

        for (const category of shuffledCategories) {
            if (isVercel && Date.now() - startTime > VERCEL_TIMEOUT_MS) {
                console.log("Approaching Vercel timeout, returning early.");
                break;
            }

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
                    if (isVercel && Date.now() - startTime > VERCEL_TIMEOUT_MS) {
                        console.log("Approaching Vercel timeout inside loop, returning early.");
                        break outer;
                    }

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
                            // Directly use the current store category we are seeding for
                            const assignedCategoryId: string = category.id;

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
                            // Directly use the current store category we are seeding for
                            const assignedCategoryId: string = category.id;

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
