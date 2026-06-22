import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const adminCode = "REF-G3EXML-a757";
  
        const adminUser = await prisma.user.findFirst({
            where: {
                referralCode: {
                    equals: adminCode,
                    mode: 'insensitive'
                }
            }
        });

        if (!adminUser) {
            return NextResponse.json({ error: "Could not find admin user with code " + adminCode });
        }

        // Find users created in the last 24 hours who have no referredById
        const recentUsers = await prisma.user.findMany({
            where: {
                referredById: null,
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (recentUsers.length === 0) {
             return NextResponse.json({ message: "No unlinked recent users found." });
        }

        // If there's exactly one, let's link it
        if (recentUsers.length === 1) {
            const targetUser = recentUsers[0];
            await prisma.user.update({
                where: { id: targetUser.id },
                data: { referredById: adminUser.id }
            });
            // Add 100 points to admin
            await prisma.user.update({
                where: { id: adminUser.id },
                data: { loyaltyPoints: { increment: 100 } }
            });
            return NextResponse.json({ success: true, message: `Linked ${targetUser.email} to admin! Admin awarded 100 points.` });
        } else {
            return NextResponse.json({ message: "Found multiple unlinked users, skipping auto-link to be safe.", users: recentUsers.map(u => u.email) });
        }
    } catch (e) {
        return NextResponse.json({ error: String(e) });
    }
}
