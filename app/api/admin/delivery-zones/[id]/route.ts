import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { name, fee, isActive } = body;

        const zone = await prisma.deliveryZone.update({
            where: { id: params.id },
            data: {
                name,
                fee: fee !== undefined ? parseFloat(fee) : undefined,
                isActive
            }
        });

        return NextResponse.json({ success: true, zone });
    } catch (error) {
        console.error("Update Delivery Zone Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await prisma.deliveryZone.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Delivery Zone Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
