import prisma from "@/lib/prisma";
import LogisticsClient from "./LogisticsClient";

export const dynamic = "force-dynamic";

export default async function LogisticsPage() {
    const zones = await prisma.deliveryZone.findMany({
        orderBy: { name: "asc" }
    });

    const stations = await prisma.pickupStation.findMany({
        orderBy: { name: "asc" }
    });

    return <LogisticsClient initialZones={zones} initialStations={stations} />;
}
