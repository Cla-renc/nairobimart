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

        // Find users who have no referredById (excluding the admin themselves)
        const recentUsers = await prisma.user.findMany({
            where: {
                referredById: null,
                id: { not: adminUser.id }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5 // get the 5 most recently registered users
        });

        if (recentUsers.length === 0) {
             return NextResponse.json({ message: "No unlinked users found at all in the database." });
        }

        // If there's exactly one, let's link it. 
        // Or if there's multiple, let's link the absolute newest one just to be helpful, 
        // since this is a manual fix for the last person who registered.
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
        
        return NextResponse.json({ 
            success: true, 
            message: `Successfully linked ${targetUser.email} (registered on ${targetUser.createdAt}) to admin! Admin awarded 100 points.`,
            otherUnlinkedFound: recentUsers.length - 1
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) });
    }
}
