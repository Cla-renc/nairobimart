import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        // 1. Revenue over the past 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: sevenDaysAgo },
                status: { notIn: ["cancelled", "refunded"] }
            },
            select: { createdAt: true, total: true }
        });

        const revenueByDate: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
            revenueByDate[dateStr] = 0;
        }

        recentOrders.forEach(order => {
            const dateStr = order.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
            if (revenueByDate[dateStr] !== undefined) {
                revenueByDate[dateStr] += order.total;
            }
        });

        const revenueData = Object.entries(revenueByDate).map(([date, revenue]) => ({ date, revenue }));

        // 2. Top-selling products
        const topOrderItems = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });

        const topProductIds = topOrderItems.map(item => item.productId);
        const topProductsData = await prisma.product.findMany({
            where: { id: { in: topProductIds } },
            select: { id: true, name: true }
        });

        const topProducts = topOrderItems.map(item => {
            const product = topProductsData.find(p => p.id === item.productId);
            return {
                name: product?.name || "Unknown Product",
                sales: item._sum.quantity || 0
            };
        });

        // 3. Cart Abandonment Rate
        const totalOrdersCount = await prisma.order.count();
        // Carts are stored by userId and productId. To count unique carts, count unique users with items.
        const carts = await prisma.cartItem.findMany({
            select: { userId: true },
            distinct: ['userId']
        });
        
        // Simple metric: 
        const totalCarts = carts.length + totalOrdersCount; 
        const abandonmentRate = totalCarts === 0 ? 0 : Math.round((carts.length / totalCarts) * 100);

        return NextResponse.json({
            success: true,
            revenueData,
            topProducts,
            abandonmentRate
        });

    } catch (error) {
        console.error("Admin analytics error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
