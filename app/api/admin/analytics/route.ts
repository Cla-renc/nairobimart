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
        const carts = await prisma.cartItem.findMany({
            select: { userId: true },
            distinct: ['userId']
        });
        const totalCarts = carts.length + totalOrdersCount; 
        const abandonmentRate = totalCarts === 0 ? 0 : Math.round((carts.length / totalCarts) * 100);

        // 4. Real Conversion Rate: orders placed / unique visitors (approximated by registered users in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentUsers = await prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } });
        const recentOrdersCount = await prisma.order.count({
            where: { createdAt: { gte: thirtyDaysAgo }, status: { notIn: ["cancelled", "refunded"] } }
        });
        const conversionRate = recentUsers === 0 ? 0 : ((recentOrdersCount / recentUsers) * 100).toFixed(1);

        // 5. Low stock products (stock <= 5)
        const lowStockProducts = await prisma.product.findMany({
            where: { isActive: true, stock: { lte: 5 } },
            select: { id: true, name: true, stock: true, slug: true },
            orderBy: { stock: 'asc' },
            take: 10
        });

        return NextResponse.json({
            success: true,
            revenueData,
            topProducts,
            abandonmentRate,
            conversionRate: Number(conversionRate),
            lowStockProducts
        });

    } catch (error) {
        console.error("Admin analytics error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
