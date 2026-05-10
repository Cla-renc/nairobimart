import { cn } from "@/lib/utils";
import {
    DollarSign,
    ShoppingBag,
    Users,
    Clock,
    Banknote
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RevenueChart from "@/components/admin/RevenueChart";
import SeedButton from "@/components/admin/SeedButton";
import prisma from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
    // 1. Fetch valid orders
    const validOrders = await prisma.order.findMany({
        where: {
            status: { notIn: ["cancelled", "refunded"] }
        },
        include: {
            items: true
        }
    });

    // 2. Fetch recent orders for table
    const recentOrdersDb = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: true }
    });

    // 3. Count customers
    const totalCustomers = await prisma.user.count({
        where: { role: "customer" }
    });

    // 4. Calculate total revenue and profit
    let totalRevenue = 0;
    let totalProfit = 0;
    const totalOrders = validOrders.length;

    validOrders.forEach(order => {
        totalRevenue += order.total;

        let orderCost = 0;
        let orderBaseRevenue = 0;

        order.items.forEach(item => {
            const safeCostPrice = item.costPrice || 0;
            const safeUnitPrice = item.unitPrice || 0;
            orderCost += safeCostPrice * item.quantity;
            orderBaseRevenue += safeUnitPrice * item.quantity;
        });

        // Profit = Product Margins - Any Discounts applied at checkout
        totalProfit += (orderBaseRevenue - orderCost) - order.discount;
    });

    // 5. Build dynamic chart data array (last 7 days mapping)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const ordersForChart = validOrders.filter(o => o.createdAt >= sevenDaysAgo);

    const chartData = [];
    const dateCursor = new Date(sevenDaysAgo);

    // Fill 7 days
    for (let i = 0; i < 7; i++) {
        const dateStr = dateCursor.toLocaleDateString("en-US", { weekday: 'short' });
        const dayStart = new Date(dateCursor);
        const dayEnd = new Date(dateCursor);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dailyRevenue = ordersForChart
            .filter(o => o.createdAt >= dayStart && o.createdAt < dayEnd)
            .reduce((sum, o) => sum + o.total, 0);

        chartData.push({ name: dateStr, revenue: dailyRevenue });
        dateCursor.setDate(dateCursor.getDate() + 1);
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-primary">Dashboard Overview</h1>
                    <p className="text-muted-foreground">Monitor your NairobiMart business performance and profits in real-time.</p>
                </div>
                <div>
                    <SeedButton />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">KES {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                        <p className="text-xs text-muted-foreground mt-1">Overall successful revenue</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                        <Banknote className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">KES {totalProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                        <p className="text-xs text-muted-foreground mt-1">Revenue minus item costs</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Non-cancelled orders</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                        <Users className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCustomers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <RevenueChart data={chartData} />

                {/* Recent Orders */}
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Orders</CardTitle>
                            <CardDescription>Latest orders placed in the system.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentOrdersDb.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                No orders yet.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {recentOrdersDb.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold leading-none">
                                                    {order.shippingName || "Unknown"}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground mt-1">
                                                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold leading-none">KES {order.total.toLocaleString()}</p>
                                            <Badge className={cn(
                                                "mt-1 py-0 px-1.5 text-[10px] uppercase font-bold border-none",
                                                order.status === "delivered" ? "bg-green-100 text-green-700" :
                                                    order.status === "processing" ? "bg-blue-100 text-blue-700" :
                                                        order.status === "shipped" ? "bg-orange-100 text-orange-700" :
                                                            order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                                                "bg-red-100 text-red-700"
                                            )}>
                                                {order.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
