import { NextResponse } from "next/server";
import { fetchCJFreight } from "@/lib/cjdropshipping";
import prisma from "@/lib/prisma";

const COUNTRY_CODES: Record<string, string> = {
    "Kenya": "KE",
    "Uganda": "UG",
    "Tanzania": "TZ"
};

export async function POST(req: Request) {
    try {
        const { country, items } = await req.json();
        
        if (!country || !items || !Array.isArray(items)) {
            return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
        }

        const endCountryCode = COUNTRY_CODES[country] || "KE";
        const cjItems: { vid: string, quantity: number }[] = [];

        // Resolve CJ Product / Variant IDs for the items
        for (const item of items) {
            // Ideally we get this from the database based on item.id (which is product id)
            const product = await prisma.product.findUnique({
                where: { id: item.id },
                include: { variants: true }
            });

            if (product && product.cjProductId) {
                // If the cart item has a specific variant selected, use its cjVariantId
                // Assuming cart item structure has `variantId` or we just use the first variant's cjVariantId
                let vid = product.cjProductId; // fallback
                if (item.variantId) {
                    const variant = product.variants.find(v => v.id === item.variantId);
                    if (variant && variant.cjVariantId) vid = variant.cjVariantId;
                } else if (product.variants.length > 0 && product.variants[0].cjVariantId) {
                    vid = product.variants[0].cjVariantId;
                }
                
                cjItems.push({ vid, quantity: item.quantity || 1 });
            }
        }

        if (cjItems.length === 0) {
            // Fallback fee if no CJ items are found (e.g., local products)
            return NextResponse.json({ success: true, fee: 500, estimatedDays: "3-5 days" });
        }

        const freightRes = await fetchCJFreight(endCountryCode, cjItems);

        if (freightRes.success && freightRes.feeUsd) {
            // Convert USD to KES (assuming ~130 KES per USD, or use your dynamic rate if available)
            // It's best to return the base KES fee to the frontend, which the frontend will convert to UGX/TZS
            const exchangeRateUsdToKes = 130; 
            const feeKes = Math.ceil(freightRes.feeUsd * exchangeRateUsdToKes);
            
            return NextResponse.json({ 
                success: true, 
                fee: feeKes, 
                estimatedDays: freightRes.estimatedDays || "15-30 days" 
            });
        }

        // Fallback if CJ API fails
        return NextResponse.json({ success: true, fee: 1500, estimatedDays: "15-30 days" });

    } catch (error) {
        console.error("Freight Calculation Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
