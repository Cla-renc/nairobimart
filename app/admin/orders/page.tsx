"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    Search,
    MoreVertical,
    Eye,
    Truck,
    CheckCircle2,
    Filter,
    Smartphone,
    Calendar,
    CreditCard,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    total: number;
    createdAt: string;
    shippingName: string;
    user?: {
        name: string;
        email: string;
    };
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/orders?search=${searchTerm}`);
            if (!response.ok) throw new Error("Failed to fetch orders");
            const data = await response.json();
            setOrders(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast({
                title: "Error",
                description: "Failed to load orders. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const updateOrderStatus = async (orderId: string, status: string) => {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error("Failed to update status");

            toast({
                title: "Success",
                description: `Order status updated to ${status}`,
            });
            fetchOrders();
        } catch {
            console.error("Error updating status");

            toast({
                title: "Error",
                description: "Failed to update order status.",
                variant: "destructive"
            });
        }
    };

    const updatePaymentStatus = async (orderId: string, paymentStatus: string) => {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentStatus })
            });

            if (!response.ok) throw new Error("Failed to update payment");

            toast({
                title: "Success",
                description: `Payment marked as ${paymentStatus}`,
            });
            fetchOrders();
        } catch {
            console.error("Error updating payment");

            toast({
                title: "Error",
                description: "Failed to update payment status.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-primary">Orders</h1>
                    <p className="text-muted-foreground">Monitor customer purchases and update fulfillment status.</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline">Export CSV</Button>
                    <Button className="bg-primary text-white hover:bg-primary/90">
                        Print Shipping Labels
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm">
                <CardContent className="p-0">
                    <div className="p-4 border-b flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by order number or customer name..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Filter className="mr-2 h-4 w-4" /> Filter
                            </Button>
                            <Button variant="outline" size="sm">
                                <Calendar className="mr-2 h-4 w-4" /> Date Range
                            </Button>
                        </div>
                    </div>

                    <div className="min-h-[400px] relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                            </div>
                        )}

                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent bg-muted/20">
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length === 0 && !loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                            No orders found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-bold text-accent">{order.orderNumber}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-primary">{order.shippingName || order.user?.name || "Guest"}</span>
                                                    <span className="text-[10px] text-muted-foreground">{order.user?.email || "No email"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {format(new Date(order.createdAt), "yyyy-MM-dd")}
                                            </TableCell>
                                            <TableCell className="font-bold whitespace-nowrap">
                                                KES {order.total.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <Badge className={cn(
                                                        "w-fit border-none text-[10px] font-bold uppercase",
                                                        order.paymentStatus === "paid" ? "bg-green-100 text-green-700" :
                                                            order.paymentStatus === "refunded" ? "bg-orange-100 text-orange-700" :
                                                                "bg-red-100 text-red-700"
                                                    )}>
                                                        {order.paymentStatus}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground mt-1 flex items-center">
                                                        {order.paymentMethod === "mpesa" ? <Smartphone className="h-3 w-3 mr-1" /> : <CreditCard className="h-3 w-3 mr-1" />}
                                                        {order.paymentMethod}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "border-none uppercase text-[10px] font-bold",
                                                    order.status === "delivered" ? "bg-green-100 text-green-700" :
                                                        order.status === "processing" ? "bg-blue-100 text-blue-700" :
                                                            order.status === "shipped" ? "bg-orange-100 text-orange-700" :
                                                                order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                                                    "bg-red-100 text-red-700"
                                                )}>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel>Order Management</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/orders/${order.id}`} className="flex items-center cursor-pointer">
                                                                <Eye className="mr-2 h-4 w-4" /> View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="flex items-center cursor-pointer" onClick={() => updateOrderStatus(order.id, "processing")}>
                                                            <Truck className="mr-2 h-4 w-4" /> Mark Processing
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="flex items-center cursor-pointer" onClick={() => updatePaymentStatus(order.id, "paid")}>
                                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Paid
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="flex items-center text-red-600 cursor-pointer" onClick={() => updateOrderStatus(order.id, "cancelled")}>
                                                            Cancel Order
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                        <span>Showing {orders.length} orders</span>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <Button variant="outline" size="sm">Next</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
