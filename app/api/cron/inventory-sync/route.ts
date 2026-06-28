import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { fetchCJProductDetail } from "@/lib/cjdropshipping";

export const maxDuration = 60; // Allow 60 seconds for execution if supported by host
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (
        process.env.CRON_SECRET &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log("Starting Background CJ Inventory Sync (Cron)...");

        const validCjCondition = {
            cjProductId: { not: null },
            NOT: { cjProductId: "" }
        };

        // Fetch a bounded batch of products linked to CJ to avoid Vercel function timeout.
        // We order by updatedAt ascending to act as a round-robin queue. The oldest synced products are synced first.
        const limit = 10; // 10 products * 600ms = 6 seconds of delay + API time, safely within 10s maxDuration for Vercel Hobby.
        const cjProducts = await prisma.product.findMany({
            where: validCjCondition,
            orderBy: {
                updatedAt: 'asc'
            },
            take: limit
        });

        if (cjProducts.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No CJ products found.",
                processed: 0
            });
        }

        let updatedCount = 0;
        let outOfStockCount = 0;
        let priceChangedCount = 0;
        const syncErrors: string[] = [];

        const parsePriceValue = (raw: any): number => {
            if (!raw && raw !== 0) return NaN;
            const str = String(raw).trim();
            const match = str.match(/-?\d+(?:\.\d+)?/);
            if (!match) return NaN;
            return Number(match[0]);
        };

        for (const product of cjProducts) {
            if (!product.cjProductId) continue;

            const cjDetail = await fetchCJProductDetail(product.cjProductId);
            const updates: any = {};
            let requiresUpdate = false;
            
            if (cjDetail.success && cjDetail.data) {
                const latestCostUsd = parsePriceValue(cjDetail.data.sellPrice);
                const latestCostKES = Number.isFinite(latestCostUsd) ? latestCostUsd * 130 : NaN;
                const latestStock = parsePriceValue(cjDetail.data.productInventory);

                // Sync Stock
                if (!Number.isNaN(latestStock) && product.stock !== latestStock) {
                    updates.stock = latestStock;
                    requiresUpdate = true;
                    if (latestStock === 0) {
                        outOfStockCount++;
                    }
                }

                // Sync Cost Price and protect retail pricing against sharp drops
                const currentCost = Number(product.costPrice || 0);
                if (!Number.isNaN(latestCostKES) && latestCostKES > 0 && Math.abs(currentCost - latestCostKES) > 1) {
                    updates.costPrice = latestCostKES;
                    const newRetail = Math.ceil(latestCostKES * 1.5); // suggested retail price
                    if (newRetail >= product.price) {
                        updates.price = newRetail;
                    }
                    requiresUpdate = true;
                    priceChangedCount++;
                }

            } else {
                const errorMessage = cjDetail.error || 'Unknown CJ fetch error';
                console.warn(`Failed to fetch CJ details for ${product.cjProductId}: ${errorMessage}`);
                syncErrors.push(`CJ product ${product.cjProductId}: ${errorMessage}`);
            }
            
            // We ALWAYS update updatedAt even if there were no stock/price changes, 
            // to ensure this product goes to the back of the round-robin queue.
            try {
                await prisma.product.update({
                    where: { id: product.id },
                    data: {
                        ...updates,
                        updatedAt: new Date()
                    }
                });
                if (requiresUpdate) updatedCount++;
            } catch (err) {
                console.error(`Failed to update product ${product.id} during sync`, err);
            }
            
            // Add a small delay to avoid hitting CJ API rate limits (CJ QPS ~= 1/sec)
            await new Promise(resolve => setTimeout(resolve, 600));
        }

        return NextResponse.json({
            success: syncErrors.length === 0,
            message: syncErrors.length === 0 ? `Synced ${cjProducts.length} products.` : `Synced ${cjProducts.length} products with ${syncErrors.length} errors.`,
            stats: {
                processed: cjProducts.length,
                updated: updatedCount,
                priceChanged: priceChangedCount,
                flaggedOOS: outOfStockCount,
                errorCount: syncErrors.length
            },
            errors: syncErrors
        });
    } catch (error) {
        console.error("Cron Inventory Sync Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
