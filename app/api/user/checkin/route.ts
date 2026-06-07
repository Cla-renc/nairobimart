import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (user.lastCheckInDate && user.lastCheckInDate >= today) {
            return NextResponse.json({ success: false, message: "Already checked in today" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                loyaltyPoints: { increment: 10 },
                lastCheckInDate: new Date(),
                pointsHistory: {
                    create: {
                        points: 10,
                        reason: "daily_checkin",
                        details: "Daily loyalty check-in reward",
                    }
                }
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: "Checked in successfully! You earned 10 points.",
            points: updatedUser.loyaltyPoints
        });

    } catch (error) {
        console.error("Checkin error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
