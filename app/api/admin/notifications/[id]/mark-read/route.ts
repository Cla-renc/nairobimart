import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.notification.update({
            where: { id: params.id },
            data: { isRead: true },
        });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
        return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }
}
