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
        const { isApproved } = body;

        const review = await prisma.review.update({
            where: { id: params.id },
            data: {
                isApproved
            }
        });

        return NextResponse.json(review);
    } catch (error) {
        console.error("[REVIEW_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session || (session.user as { role: string }).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await prisma.review.delete({
            where: { id: params.id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[REVIEW_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
