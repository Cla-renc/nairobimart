import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const zones = await prisma.deliveryZone.findMany({
            orderBy: { name: "asc" }
        });
        return NextResponse.json({ success: true, zones });
    } catch (error) {
        console.error("Fetch Delivery Zones Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, fee, isActive } = body;

        if (!name || fee === undefined) {
            return NextResponse.json({ success: false, message: "Name and fee are required" }, { status: 400 });
        }

        const zone = await prisma.deliveryZone.create({
            data: {
                name,
                fee: parseFloat(fee),
                isActive: isActive ?? true
            }
        });

        return NextResponse.json({ success: true, zone });
    } catch (error) {
        console.error("Create Delivery Zone Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
