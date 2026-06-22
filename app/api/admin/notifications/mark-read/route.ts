import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
    try {
        await prisma.notification.updateMany({
            where: { isRead: false },
            data: { isRead: true },
        });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to mark notifications as read:", error);
        return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
    }
}
