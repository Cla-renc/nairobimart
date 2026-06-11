import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const recentOrders = await prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!recentOrders || recentOrders.length === 0) {
            return NextResponse.json({ purchases: [] });
        }

        const purchases = recentOrders.map(order => {
            // Extract first name
            const firstName = order.shippingName ? order.shippingName.split(' ')[0] : 'Someone';
            // Extract location, fallback to Nairobi
            const location = order.shippingCity || 'Nairobi';
            // Get the first item's product name
            const productName = order.items?.[0]?.product?.name || 'an item';
            // Format time ago (e.g., "5 minutes ago")
            const timeAgo = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true });

            return {
                name: firstName,
                location: location,
                product: productName,
                timeAgo: timeAgo
            };
        });

        return NextResponse.json({ purchases });
    } catch (error) {
        console.error("Error fetching recent purchases:", error);
        return NextResponse.json({ purchases: [] }, { status: 500 });
    }
}
