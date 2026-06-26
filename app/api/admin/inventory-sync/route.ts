import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { fetchCJProductDetail } from "@/lib/cjdropshipping";

export const maxDuration = 60; // Allow 60 seconds for execution if supported by host

export async function POST(req: NextRequest) {
    try {
        console.log("Starting CJ Inventory Sync...");

        const url = new URL(req.url);
        const totalProducts = await prisma.product.count({ where: { cjProductId: { not: null } } });
        const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || '20'), 1), 50);
        const skip = Math.max(Number(url.searchParams.get('skip') || '0'), 0);

        // Fetch a bounded batch of products linked to CJ to avoid Vercel function timeout.
        const cjProducts = await prisma.product.findMany({
            where: {
                cjProductId: { not: null }
            },
            skip,
            take: limit
        });

        if (cjProducts.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No CJ products to sync in this batch.",
                totalProducts,
                processed: 0,
                skip,
                limit,
            });
        }

        let updatedCount = 0;
        let outOfStockCount = 0;
        let priceChangedCount = 0;
        const syncErrors: string[] = [];

        // In a real production app with thousands of products, we'd batch these
        for (const product of cjProducts) {
            if (!product.cjProductId) continue;

            const cjDetail = await fetchCJProductDetail(product.cjProductId);
            
            if (cjDetail.success && cjDetail.data) {
                const latestCost = parseFloat(cjDetail.data.sellPrice || "0");
                const latestStock = parseInt(cjDetail.data.productInventory || "0");

                const updates: any = {};
                let requiresUpdate = false;

                // Sync Stock
                if (product.stock !== latestStock) {
                    updates.stock = latestStock;
                    requiresUpdate = true;
                    if (latestStock === 0) {
                        updates.isActive = false; // Auto-disable if OOS
                        outOfStockCount++;
                    }
                }

                // Sync Price and Protect Margins (assuming 1.5x margin multiplier)
                const currentCost = Number(product.costPrice || 0);
                if (latestCost > 0 && Math.abs(currentCost - latestCost) > 0.1) {
                    updates.costPrice = latestCost;
                    updates.price = Math.ceil(latestCost * 1.5); // 50% margin
                    requiresUpdate = true;
                    priceChangedCount++;
                }

                if (requiresUpdate) {
                    await prisma.product.update({
                        where: { id: product.id },
                        data: updates
                    });
                    updatedCount++;
                }
            } else {
                const errorMessage = cjDetail.error || 'Unknown CJ fetch error';
                console.warn(`Failed to fetch CJ details for ${product.cjProductId}: ${errorMessage}`);
                syncErrors.push(`CJ product ${product.cjProductId}: ${errorMessage}`);
            }
            
            // Add a small delay to avoid hitting CJ API rate limits
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        return NextResponse.json({
            success: syncErrors.length === 0,
            message: syncErrors.length === 0 ? `Synced ${cjProducts.length} products.` : `Synced ${cjProducts.length} products with ${syncErrors.length} errors.`,
            stats: {
                updated: updatedCount,
                priceChanged: priceChangedCount,
                flaggedOOS: outOfStockCount,
                errorCount: syncErrors.length
            },
            errors: syncErrors,
            totalProducts,
            skip,
            limit,
            processed: cjProducts.length
        });
    } catch (error) {
        console.error("Inventory Sync Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
