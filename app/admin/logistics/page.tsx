import prisma from "@/lib/prisma";
import LogisticsClient from "./LogisticsClient";

export const dynamic = "force-dynamic";

export default async function LogisticsPage() {
    const zones = await prisma.deliveryZone.findMany({
        orderBy: { name: "asc" }
    });

    const activeOrders = await prisma.order.findMany({
        where: {
            status: { in: ['pending', 'processing'] }
        },
        include: { user: { select: { name: true, phone: true } } },
        orderBy: { createdAt: 'desc' }
    });

    return <LogisticsClient initialZones={zones} activeOrders={activeOrders} />;
}
