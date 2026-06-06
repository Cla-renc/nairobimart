import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, passwordHash: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // If user has no password (e.g. Google OAuth user), set directly
        if (user.passwordHash) {
            const valid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!valid) {
                return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
            }
        }

        const hashed = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashed }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Change Password Error:", error);
        return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
    }
}
