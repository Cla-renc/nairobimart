import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { fetchCJProductDetail } from "@/lib/cjdropshipping";

export const maxDuration = 60; // Allow 60 seconds for execution if supported by host

export async function POST(req: NextRequest) {
    try {
        console.log("Starting CJ Inventory Sync...");
        
        // Fetch all products that are linked to CJ
        const cjProducts = await prisma.product.findMany({
            where: {
                cjProductId: { not: null }
            }
        });

        if (cjProducts.length === 0) {
            return NextResponse.json({ success: true, message: "No CJ products to sync." });
        }

        let updatedCount = 0;
        let outOfStockCount = 0;
        let priceChangedCount = 0;

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
                if (latestCost > 0 && Math.abs(product.costPrice - latestCost) > 0.1) {
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
                console.warn(`Failed to fetch CJ details for ${product.cjProductId}`);
            }
            
            // Add a small delay to avoid hitting CJ API rate limits
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${cjProducts.length} products.`,
            stats: {
                updated: updatedCount,
                priceChanged: priceChangedCount,
                flaggedOOS: outOfStockCount
            }
        });
    } catch (error) {
        console.error("Inventory Sync Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
