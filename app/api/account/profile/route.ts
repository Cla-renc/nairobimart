import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, phone, defaultAddress, defaultCity, defaultCounty } = body;

        const updated = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                ...(name && { name }),
                ...(phone && { phone }),
                ...(defaultAddress && { defaultAddress }),
                ...(defaultCity && { defaultCity }),
                ...(defaultCounty && { defaultCounty }),
            },
        });

        return NextResponse.json({ success: true, user: { name: updated.name, phone: updated.phone } });
    } catch (error) {
        console.error("Update Profile Error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
