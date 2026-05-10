import { auth } from "@/auth";
import {
    Package,
    Search,
    Filter,
    ChevronRight,
    Clock,
    CheckCircle2,
    Truck,
    AlertCircle,
    ArrowLeft,
    ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/button-variants";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Mock orders for the user
const userOrders = [
    {
        id: "ORD-5521",
        date: "March 14, 2026",
        total: 2500,
        status: "Delivered",
        items: [
            { name: "Wireless Earbuds", quantity: 1, price: 1500, image: "/images/product-1.jpg" },
            { name: "Phone Case", quantity: 1, price: 1000, image: "/images/product-5.jpg" }
        ]
    },
    {
        id: "ORD-5522",
        date: "March 15, 2026",
        total: 5000,
        status: "Processing",
        items: [
            { name: "Smart Watch", quantity: 1, price: 5000, image: "/images/product-2.jpg" }
        ]
    },
    {
        id: "ORD-5523",
        date: "March 20, 2026",
        total: 1200,
        status: "Shipped",
        items: [
            { name: "USB-C Cable", quantity: 2, price: 600, image: "/images/product-4.jpg" }
        ]
    }
];

export default async function OrdersPage() {
    const session = await auth();

    if (!session) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h1 className="text-2xl font-bold">Please log in to view your orders.</h1>
                <Link href="/login" className={cn(buttonVariants(), "mt-4")}>Login</Link>
            </div>
        );
    }

    return (
        <div className="bg-muted/30 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <Link href="/account" className="inline-flex items-center text-sm text-muted-foreground hover:text-accent mb-6 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Account
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-primary">My Orders</h1>
                        <p className="text-muted-foreground mt-1">Check the status of your recent purchases.</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search orders..." className="pl-10 shadow-sm border-none" />
                        </div>
                        <Button variant="outline" size="icon" className="shrink-0 shadow-sm border-none bg-white">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    {userOrders.length > 0 ? (
                        userOrders.map((order) => (
                            <Card key={order.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                                <CardHeader className="bg-white border-b pb-4">
                                    <div className="flex flex-wrap justify-between items-center gap-4">
                                        <div className="flex items-center gap-6">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Order Placed</p>
                                                <p className="text-sm font-semibold">{order.date}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Amount</p>
                                                <p className="text-sm font-bold text-primary">KES {order.total.toLocaleString()}</p>
                                            </div>
                                            <div className="hidden sm:block">
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Order ID</p>
                                                <p className="text-sm font-mono text-accent">#{order.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={cn(
                                                "border-none uppercase text-[10px] font-bold px-3 py-1",
                                                order.status === "Delivered" ? "bg-green-100 text-green-700" :
                                                    order.status === "Processing" ? "bg-blue-100 text-blue-700" :
                                                        order.status === "Shipped" ? "bg-orange-100 text-orange-700" :
                                                            "bg-red-100 text-red-700"
                                            )}>
                                                {order.status === "Delivered" && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
                                                {order.status === "Processing" && <Clock className="h-3 w-3 mr-1 inline" />}
                                                {order.status === "Shipped" && <Truck className="h-3 w-3 mr-1 inline" />}
                                                {order.status === "Cancelled" && <AlertCircle className="h-3 w-3 mr-1 inline" />}
                                                {order.status}
                                            </Badge>
                                            <Button variant="ghost" size="sm" className="text-accent hover:text-accent group-hover:bg-accent/5">
                                                Details <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-muted/50">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="p-6 flex items-center justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-20 w-20 rounded-2xl bg-muted overflow-hidden border border-muted/20 shadow-sm relative group-hover:scale-105 transition-transform">
                                                        {/* Using a placeholder if image doesn't exist */}
                                                        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                                                            <Package className="h-8 w-8 opacity-20" />
                                                        </div>
                                                        {/* <Image src={item.image} alt={item.name} fill className="object-cover" /> */}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-primary leading-tight mb-1">{item.name}</h4>
                                                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                        <p className="text-xs font-bold text-accent mt-1">KES {item.price.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" className="rounded-xl border-muted text-xs font-bold">
                                                        Buy Again
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="rounded-xl text-xs font-bold sm:flex items-center hidden">
                                                        Product Link <ExternalLink className="h-3 w-3 ml-1" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                <div className="bg-muted/10 p-4 border-t flex justify-end gap-3 sm:hidden">
                                    <Button variant="outline" size="sm" className="w-full text-xs font-bold">Track Shipment</Button>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="border-none shadow-sm p-12 text-center">
                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                            <h3 className="text-xl font-bold text-primary">No orders yet</h3>
                            <p className="text-muted-foreground mt-2 mb-6">Looks like you haven&apos;t made any purchases yet.</p>
                            <Link href="/products" className={cn(buttonVariants(), "bg-primary hover:bg-primary/90")}>
                                Start Shopping
                            </Link>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
