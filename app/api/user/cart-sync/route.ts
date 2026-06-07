import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

type CartSyncItem = {
    productId: string;
    variantId?: string | null;
    quantity: number;
    price?: number | string;
};

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
                variantId: item.variantId || null,
                quantity: Number(item.quantity),
                price: Number(item.price ?? 0) || 0,
            }));

        const existing = await prisma.cartItem.findMany({ where: { userId: user.id } });

        const incomingKeys = normalized.map((item) => `${item.productId}:${item.variantId ?? ""}`);

        await Promise.all(
            normalized.map(async (item) => {
                await prisma.cartItem.upsert({
                    where: {
                        userId_productId_variantId: {
                            userId: user.id,
                            productId: item.productId,
                            variantId: item.variantId as string,
                        },
                    },
                    create: {
                        userId: user.id,
                        productId: item.productId,
                        variantId: item.variantId ?? undefined,
                        quantity: item.quantity,
                    },
                    update: {
                        quantity: item.quantity,
                    },
                });
            })
        );

        const toDeleteIds = existing
            .filter((item) => !incomingKeys.includes(`${item.productId}:${item.variantId ?? ""}`))
            .map((item) => item.id);

        if (toDeleteIds.length > 0) {
            await prisma.cartItem.deleteMany({ where: { id: { in: toDeleteIds } } });
        }

        return NextResponse.json({ success: true, syncedItems: normalized.length });
    } catch (error) {
        console.error("Cart sync failed:", error);
        return NextResponse.json({ success: false, message: "Failed to sync cart" }, { status: 500 });
    }
}
