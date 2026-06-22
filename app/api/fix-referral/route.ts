import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// v3 - debug all users

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

        // DEBUG: Get the 5 most recent users regardless of referredById
        const recentUsers = await prisma.user.findMany({
            where: {
                id: { not: adminUser.id }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5
        });

        // Let's just return what the DB sees so the user can share the screenshot
        return NextResponse.json({ 
            debug: "Here are the 5 most recent users. Please share this output:",
            users: recentUsers.map(u => ({
                email: u.email,
                createdAt: u.createdAt,
                referredById: u.referredById || "NULL",
                referralCode: u.referralCode
            })),
            adminFound: adminUser.email
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) });
    }
}
