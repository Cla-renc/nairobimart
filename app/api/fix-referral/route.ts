import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// v4 - actual fix

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

        // Find the most recently registered user (not the admin) who hasn't been linked yet
        const targetUser = await prisma.user.findFirst({
            where: {
                id: { not: adminUser.id },
                referredById: null
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!targetUser) {
            return NextResponse.json({ message: "All users are already linked to a referrer. Nothing to fix." });
        }

        // Link the newest unlinked user to admin
        await prisma.user.update({
            where: { id: targetUser.id },
            data: { referredById: adminUser.id }
        });
        
        // Award 100 loyalty points to admin
        await prisma.user.update({
            where: { id: adminUser.id },
            data: { loyaltyPoints: { increment: 100 } }
        });

        // Count total referrals now
        const totalReferrals = await prisma.user.count({
            where: { referredById: adminUser.id }
        });
        
        return NextResponse.json({ 
            success: true, 
            message: `Successfully linked ${targetUser.email} to ${adminUser.email}! 100 loyalty points awarded.`,
            totalReferralsNow: totalReferrals,
            linkedUser: {
                email: targetUser.email,
                registeredAt: targetUser.createdAt
            }
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) });
    }
}
