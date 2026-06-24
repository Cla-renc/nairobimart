import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * DEBUG ENDPOINT - Test login issues
 * POST with: { email: "user@example.com", password: "testpassword" }
 * Remove this file after debugging
 */
export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({
                error: "Missing email or password",
            });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({
                error: "User not found in database",
                searchedEmail: email,
            });
        }

        return NextResponse.json({
            userFound: true,
            userId: user.id,
            storedEmail: user.email,
            hasPasswordHash: !!user.passwordHash,
            passwordHashLength: user.passwordHash?.length,
            passwordHashPrefix: user.passwordHash?.substring(0, 10),
            passwordHashSuffix: user.passwordHash?.substring(user.passwordHash.length - 10),
            // Test bcrypt comparison
            bcryptComparisonResult: user.passwordHash
                ? await bcrypt.compare(password, user.passwordHash)
                : false,
            name: user.name,
            phone: user.phone,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.error("Debug error:", error);
        return NextResponse.json({
            error: "Debug endpoint error",
            details: error instanceof Error ? error.message : String(error),
        });
    }
}
