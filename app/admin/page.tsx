"use client";

import {
    DollarSign,
    ShoppingBag,
    Users,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Clock
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const data = [
    { name: "Mon", revenue: 45000 },
    { name: "Tue", revenue: 52000 },
    { name: "Wed", revenue: 48000 },
    { name: "Thu", revenue: 61000 },
    { name: "Fri", revenue: 55000 },
    { name: "Sat", revenue: 67000 },
    { name: "Sun", revenue: 72000 },
];

const recentOrders = [
    { id: "ORD-7231", customer: "Amos Wekesa", status: "Delivered", date: "2 mins ago", amount: 4500 },
    { id: "ORD-7230", customer: "Sarah Njeri", status: "Processing", date: "15 mins ago", amount: 12400 },
    { id: "ORD-7229", customer: "Brian Otieno", status: "Shipped", date: "1 hour ago", amount: 3200 },
    { id: "ORD-7228", customer: "Grace Mwangi", status: "Pending", date: "3 hours ago", amount: 8500 },
    { id: "ORD-7227", customer: "David Ochieng", status: "Cancelled", date: "5 hours ago", amount: 1500 },
];

export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-primary">Dashboard Overview</h1>
                <p className="text-muted-foreground">Monitor your NairobiMart business performance in real-time.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">KES 1,245,600</div>
                        <p className="text-xs text-green-600 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" /> +12.5% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">842</div>
                        <p className="text-xs text-green-600 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" /> +8.2% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                        <Users className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5,280</div>
                        <p className="text-xs text-red-600 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1 rotate-180" /> -2.4% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Store Visitors</CardTitle>
                        <TrendingUp className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12,400</div>
                        <p className="text-xs text-green-600 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" /> +22.1% from last month
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                        <CardDescription>Daily revenue performance for the current week.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `KSh ${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{ stroke: '#f59e0b', strokeWidth: 2 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6, fill: '#f59e0b', strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Orders</CardTitle>
                            <CardDescription>Latest orders across Kenya.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80">View All</Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold leading-none">{order.customer}</p>
                                            <p className="text-[11px] text-muted-foreground mt-1">{order.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold leading-none">KSh {order.amount.toLocaleString()}</p>
                                        <Badge className={cn(
                                            "mt-1 py-0 px-1.5 text-[10px] uppercase font-bold border-none",
                                            order.status === "Delivered" ? "bg-green-100 text-green-700" :
                                                order.status === "Processing" ? "bg-blue-100 text-blue-700" :
                                                    order.status === "Shipped" ? "bg-orange-100 text-orange-700" :
                                                        order.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                                                            "bg-red-100 text-red-700"
                                        )}>
                                            {order.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
