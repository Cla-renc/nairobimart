import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session || (session.user as { role?: string }).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { title, subtitle, imageUrl, linkUrl, isActive, startsAt, endsAt } = body;

        const banner = await prisma.banner.update({
            where: { id: params.id },
            data: {
                title,
                subtitle,
                imageUrl,
                linkUrl,
                isActive,
                startsAt: startsAt ? new Date(startsAt) : null,
                endsAt: endsAt ? new Date(endsAt) : null,
            }
        });

        return NextResponse.json(banner);
    } catch (error) {
        console.error("[BANNER_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session || (session.user as { role?: string }).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await prisma.banner.delete({
            where: { id: params.id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[BANNER_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
