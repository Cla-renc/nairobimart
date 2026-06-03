import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Fetch active delivery zones
        let zones = await prisma.deliveryZone.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });

        // Seed default zones if empty (for demonstration purposes)
        if (zones.length === 0) {
            await prisma.deliveryZone.createMany({
                data: [
                    { name: "Nairobi CBD & Environs", fee: 200 },
                    { name: "Nairobi (Other Areas)", fee: 350 },
                    { name: "Kiambu & Thika", fee: 400 },
                    { name: "Mombasa & Coast", fee: 500 },
                    { name: "Rest of Kenya", fee: 600 }
                ]
            });
            zones = await prisma.deliveryZone.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
        }

        // Fetch active pickup stations
        let stations = await prisma.pickupStation.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });

        // Seed default stations if empty (for demonstration purposes)
        if (stations.length === 0) {
            await prisma.pickupStation.createMany({
                data: [
                    { name: "Nairobi CBD Agent", address: "Moi Avenue, Bazaar Plaza 3rd Floor", city: "Nairobi", fee: 50 },
                    { name: "Westlands Hub", address: "Westlands, The Mall", city: "Nairobi", fee: 50 },
                    { name: "Thika Road Mall (TRM) Kiosk", address: "TRM Ground Floor", city: "Nairobi", fee: 100 },
                    { name: "Mombasa Town Agent", address: "Digo Road", city: "Mombasa", fee: 150 }
                ]
            });
            stations = await prisma.pickupStation.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
        }

        return NextResponse.json({
            success: true,
            zones,
            stations
        });
    } catch (error) {
        console.error("[DELIVERY_OPTIONS_GET]", error);
        return NextResponse.json(
            { success: false, error: "Failed to load delivery options" },
            { status: 500 }
        );
    }
}
