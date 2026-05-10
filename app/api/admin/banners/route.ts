import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
    try {
        const banners = await prisma.banner.findMany({
            orderBy: { position: 'asc' }
        });
        return NextResponse.json(banners);
    } catch (error) {
        console.error("[BANNERS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session || (session.user as { role?: string }).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { title, subtitle, imageUrl, linkUrl, isActive, startsAt, endsAt } = body;

        if (!imageUrl) {
            return new NextResponse("Image URL is required", { status: 400 });
        }

        // Get the highest position to append the new banner
        const lastBanner = await prisma.banner.findFirst({
            orderBy: { position: 'desc' }
        });

        const position = lastBanner ? lastBanner.position + 1 : 0;

        const banner = await prisma.banner.create({
            data: {
                title,
                subtitle,
                imageUrl,
                linkUrl,
                isActive: isActive ?? true,
                startsAt: startsAt ? new Date(startsAt) : null,
                endsAt: endsAt ? new Date(endsAt) : null,
                position
            }
        });

        return NextResponse.json(banner);
    } catch (error) {
        console.error("[BANNERS_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
