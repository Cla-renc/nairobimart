import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { name, address, city, fee, isActive } = body;

        const station = await prisma.pickupStation.update({
            where: { id: params.id },
            data: {
                name,
                address,
                city,
                fee: fee !== undefined ? parseFloat(fee) : undefined,
                isActive
            }
        });

        return NextResponse.json({ success: true, station });
    } catch (error) {
        console.error("Update Pickup Station Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await prisma.pickupStation.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Pickup Station Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
