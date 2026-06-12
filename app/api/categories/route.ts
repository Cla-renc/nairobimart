import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            where: {
                isActive: true
            },
            include: {
                _count: {
                    select: { products: { where: { isActive: true } } }
                }
            },
            orderBy: {
                position: "asc"
            }
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("[PUBLIC_CATEGORIES_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
