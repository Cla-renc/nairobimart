export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import {
    TrendingUp,
    DollarSign,
    Users,
    ShoppingCart,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import AnalyticsCharts from "./AnalyticsCharts";

export default async function AnalyticsPage() {
    // Current month sales
    const now = new Date();
    const firstDayOfMonth = startOfMonth(now);
    const lastDayOfMonth = endOfMonth(now);

    // Previous month for comparison
    const firstDayOfPrevMonth = startOfMonth(subMonths(now, 1));
    const lastDayOfPrevMonth = endOfMonth(subMonths(now, 1));

    const currentMonthOrders = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: firstDayOfMonth,
                lte: lastDayOfMonth
            },
            status: { not: 'cancelled' }
        }
    });

    const prevMonthOrders = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: firstDayOfPrevMonth,
                lte: lastDayOfPrevMonth
            },
            status: { not: 'cancelled' }
        }
    });

    const currentRevenue = currentMonthOrders.reduce((acc, o) => acc + o.total, 0);
    const prevRevenue = prevMonthOrders.reduce((acc, o) => acc + o.total, 0);

    const revenueChange = prevRevenue === 0 ? 100 : ((currentRevenue - prevRevenue) / prevRevenue) * 100;
    const orderChange = prevMonthOrders.length === 0 ? 100 : ((currentMonthOrders.length - prevMonthOrders.length) / prevMonthOrders.length) * 100;

    const totalUsers = await prisma.user.count();
    const newUsers = await prisma.user.count({
        where: {
            createdAt: { gte: firstDayOfMonth }
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Store Analytics</h1>
                    <p className="text-muted-foreground mt-1">Real-time insights into your store&apos;s performance.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="bg-white shadow-sm border-none">
                        <Calendar className="mr-2 h-4 w-4" /> Last 30 Days
                    </Button>
                    <Button variant="outline" size="icon" className="bg-white shadow-sm border-none">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">KES {currentRevenue.toLocaleString()}</div>
                        <div className="flex items-center mt-1">
                            {revenueChange >= 0 ? (
                                <span className="text-xs font-bold text-green-600 flex items-center">
                                    <ArrowUpRight className="h-3 w-3 mr-1" /> +{revenueChange.toFixed(1)}%
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-red-600 flex items-center">
                                    <ArrowDownRight className="h-3 w-3 mr-1" /> {revenueChange.toFixed(1)}%
                                </span>
                            )}
                            <span className="text-[10px] text-muted-foreground ml-2">from last month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{currentMonthOrders.length}</div>
                        <div className="flex items-center mt-1">
                            {orderChange >= 0 ? (
                                <span className="text-xs font-bold text-green-600 flex items-center">
                                    <ArrowUpRight className="h-3 w-3 mr-1" /> +{orderChange.toFixed(1)}%
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-red-600 flex items-center">
                                    <ArrowDownRight className="h-3 w-3 mr-1" /> {orderChange.toFixed(1)}%
                                </span>
                            )}
                            <span className="text-[10px] text-muted-foreground ml-2">from last month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">New Customers</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{newUsers}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Total base: <span className="font-bold text-primary">{totalUsers}</span></p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Conversion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">3.2%</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Industry avg: <span className="font-bold text-primary">2.1%</span></p>
                    </CardContent>
                </Card>
            </div>

            <AnalyticsCharts />
        </div>
    );
}
