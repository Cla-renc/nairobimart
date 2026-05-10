import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { productId } = body;

        if (!productId) {
            return new NextResponse("Product ID is required", { status: 400 });
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return new NextResponse("Product not found", { status: 404 });
        }

        const existing = await prisma.wishlist.findFirst({
            where: {
                userId: session.user.id,
                productId,
            },
        });

        if (existing) {
            return NextResponse.json({ success: true, alreadyExists: true });
        }

        await prisma.wishlist.create({
            data: {
                userId: session.user.id,
                productId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[WISHLIST_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { productId } = body;

        if (!productId) {
            return new NextResponse("Product ID is required", { status: 400 });
        }

        const deleted = await prisma.wishlist.deleteMany({
            where: {
                userId: session.user.id,
                productId,
            },
        });

        if (deleted.count === 0) {
            return new NextResponse("Wishlist item not found", { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[WISHLIST_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
