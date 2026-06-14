import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

type CartSyncItem = {
    productId: string;
    variantId?: string | null;
    quantity: number;
    price?: number | string;
};

// This endpoint now performs a merge: incoming quantities are added to existing server-side quantities.
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    try {
        const body = await req.json();
        const items = Array.isArray(body.items) ? (body.items as unknown[]) : [];

        const isCartSyncItem = (item: unknown): item is CartSyncItem => {
            return (
                !!item &&
                typeof item === "object" &&
                "productId" in item &&
                "quantity" in item
            );
        };

        const normalized = items
            .filter(isCartSyncItem)
            .map((item) => ({
                productId: item.productId,
                variantId: item.variantId ?? null,
                quantity: Number(item.quantity),
                price: Number(item.price ?? 0) || 0,
            }));

        const processed: { productId: string; variantId: string | null; quantity: number; action: 'created' | 'merged' }[] = [];

        for (const item of normalized) {
            const existingItem = await prisma.cartItem.findFirst({
                where: {
                    userId: user.id,
                    productId: item.productId,
                    variantId: item.variantId,
                },
            });

            if (existingItem) {
                const newQuantity = existingItem.quantity + item.quantity;
                await prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: newQuantity },
                });
                processed.push({ productId: item.productId, variantId: item.variantId, quantity: newQuantity, action: 'merged' });
            } else {
                await prisma.cartItem.create({
                    data: {
                        userId: user.id,
                        productId: item.productId,
                        variantId: item.variantId ?? undefined,
                        quantity: item.quantity,
                    },
                });
                processed.push({ productId: item.productId, variantId: item.variantId, quantity: item.quantity, action: 'created' });
            }
        }

        // Note: do not delete existing server-side items during merge; keep items user previously had.

        return NextResponse.json({ success: true, processedCount: processed.length, processed });
    } catch (error) {
        console.error("Cart sync failed:", error);
        return NextResponse.json({ success: false, message: "Failed to sync cart" }, { status: 500 });
    }
}
