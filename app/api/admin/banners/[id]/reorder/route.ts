import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session || (session.user as { role?: string }).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { direction } = body; // 'up' or 'down'

        const currentBanner = await prisma.banner.findUnique({
            where: { id: params.id }
        });

        if (!currentBanner) {
            return new NextResponse("Banner not found", { status: 404 });
        }

        const otherBanner = await prisma.banner.findFirst({
            where: {
                position: direction === "up"
                    ? { lt: currentBanner.position }
                    : { gt: currentBanner.position }
            },
            orderBy: {
                position: direction === "up" ? "desc" : "asc"
            }
        });

        if (!otherBanner) {
            return new NextResponse("Cannot move further in this direction", { status: 400 });
        }

        // Swap positions
        const currentPos = currentBanner.position;
        const otherPos = otherBanner.position;

        await prisma.$transaction([
            prisma.banner.update({
                where: { id: currentBanner.id },
                data: { position: otherPos }
            }),
            prisma.banner.update({
                where: { id: otherBanner.id },
                data: { position: currentPos }
            })
        ]);

        return new NextResponse("Success", { status: 200 });
    } catch (error) {
        console.error("[BANNER_REORDER]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
