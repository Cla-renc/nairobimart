import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const stations = await prisma.pickupStation.findMany({
            orderBy: { name: "asc" }
        });
        return NextResponse.json({ success: true, stations });
    } catch (error) {
        console.error("Fetch Pickup Stations Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, address, city, fee, isActive } = body;

        if (!name || !address || !city || fee === undefined) {
            return NextResponse.json({ success: false, message: "Name, address, city, and fee are required" }, { status: 400 });
        }

        const station = await prisma.pickupStation.create({
            data: {
                name,
                address,
                city,
                fee: parseFloat(fee),
                isActive: isActive ?? true
            }
        });

        return NextResponse.json({ success: true, station });
    } catch (error) {
        console.error("Create Pickup Station Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
