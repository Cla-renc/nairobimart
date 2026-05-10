import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
    Mail,
    Phone,
    Calendar,
    Settings,
    Package,
    ChevronRight,
    MapPin,
    CreditCard,
    ShoppingBag
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/button-variants";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ExtendedUser {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    phone?: string;
    createdAt?: Date | string;
}

export default async function AccountPage() {
    const session = await auth();
    const user = session?.user as ExtendedUser | undefined;

    if (!user) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h1 className="text-2xl font-bold">Please log in to view your account.</h1>
                <Link href="/login" className={cn(buttonVariants(), "mt-4")}>Login</Link>
            </div>
        );
    }

    // Fetch real orders from database
    const orders = await prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;

    const formatDate = (date: Date | string) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            year: 'numeric'
        }).format(new Date(date));
    };

    const formatFullDate = (date: Date | string) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }).format(new Date(date));
    };

    return (
        <div className="bg-muted/30 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-primary">My Account</h1>
                        <p className="text-muted-foreground mt-1">Manage your profile, orders, and preferences.</p>
                    </div>
                    <Button variant="outline" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Edit Profile
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-none shadow-sm overflow-hidden">
                            <div className="h-24 bg-gradient-to-r from-primary to-accent"></div>
                            <CardContent className="pt-0 -mt-12 text-center pb-8">
                                <div className="inline-block p-1 bg-white rounded-full mb-4 shadow-md">
                                    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center text-primary text-3xl font-bold border-4 border-white">
                                        {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold">{user.name || "NairobiMart User"}</h2>
                                <Badge variant="secondary" className="mt-1 px-3">
                                    {user.role === "admin" ? "Store Administrator" : "Valued Customer"}
                                </Badge>

                                <div className="mt-6 space-y-4 text-left">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 truncate">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Email Address</p>
                                            <p className="font-medium truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Phone Number</p>
                                            <p className="font-medium">{user.phone || "Not provided"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Joined On</p>
                                            <p className="font-medium">
                                                {user.createdAt ? formatDate(user.createdAt) : "Recently"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        {/* Shortcurts Section remains same but I'll skip re-typing it if possible */}
                        <Card className="border-none shadow-sm pb-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Shortcuts</CardTitle>
                            </CardHeader>
                            <CardContent className="px-2">
                                <Link href="/account/orders" className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 group transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-accent/10 text-accent">
                                            <Package className="h-4 w-4" />
                                        </div>
                                        <span className="font-semibold text-sm">Track Orders</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link href="#" className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 group transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-accent/10 text-accent">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <span className="font-semibold text-sm">Shipping Addresses</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link href="#" className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 group transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-accent/10 text-accent">
                                            <CreditCard className="h-4 w-4" />
                                        </div>
                                        <span className="font-semibold text-sm">Payment Methods</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Recent Activity / Dashboard */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Welcome Banner */}
                        <div className="bg-primary text-white rounded-3xl p-8 shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-2">Welcome back, {user.name?.split(' ')[0] || "Shopper"}!</h3>
                                <p className="text-primary-foreground/80 max-w-md">
                                    {orders.length === 0
                                        ? "You haven't placed any orders yet. Start shopping to see them here!"
                                        : `You have ${pendingOrdersCount} pending orders and your NairobiMart account is active.`}
                                </p>
                                <Link href="/products">
                                    <Button className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8">
                                        Shop New Arrivals
                                    </Button>
                                </Link>
                            </div>
                            <Package className="absolute right-[-20px] bottom-[-20px] h-48 w-48 opacity-10 rotate-12" />
                        </div>

                        {/* Recent Orders Preview */}
                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Recent Orders</CardTitle>
                                    <CardDescription>
                                        {orders.length === 0 ? "You have no orders yet." : "Your latest purchases from NairobiMart."}
                                    </CardDescription>
                                </div>
                                <Link href="/account/orders" className={cn(buttonVariants({ variant: "link" }), "text-accent font-bold px-0")}>
                                    View All Orders
                                </Link>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {orders.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="inline-block p-4 rounded-full bg-muted mb-4">
                                                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <p className="text-muted-foreground">No recent orders found.</p>
                                        </div>
                                    ) : (
                                        orders.map((order) => (
                                            <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-transparent hover:border-accent/20 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                                                        <Package className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm tracking-tight">{order.orderNumber}</p>
                                                        <p className="text-[11px] text-muted-foreground">{formatFullDate(order.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-extrabold text-sm text-primary">KES {order.total.toLocaleString()}</p>
                                                    <Badge className={cn(
                                                        "mt-1 text-[10px] border-none uppercase font-bold px-2 py-0",
                                                        order.status === 'delivered' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                                    )}>
                                                        {order.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Account Settings Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="pt-6">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                                        <Settings className="h-5 w-5" />
                                    </div>
                                    <h4 className="font-bold mb-1">Security</h4>
                                    <p className="text-xs text-muted-foreground">Change password and manage 2FA settings.</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="pt-6">
                                    <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <h4 className="font-bold mb-1">Privacy</h4>
                                    <p className="text-xs text-muted-foreground">Manage your data and email preferences.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
