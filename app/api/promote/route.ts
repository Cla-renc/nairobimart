import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const user = await prisma.user.update({
            where: { email: "yaaclarence@gmail.com" },
            data: { role: "admin" },
        });
        return NextResponse.json({ message: "User promoted to admin", user });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
