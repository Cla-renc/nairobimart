"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Search,
    MoreVertical,
    Eye,
    Truck,
    CheckCircle2,
    Filter,
    ArrowUpDown,
    Smartphone,
    Calendar
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

// Mock orders
const orders = [
    {
        id: "ORD-7231",
        customer: "Amos Wekesa",
        email: "amos@example.com",
        status: "Delivered",
        payment: "Paid",
        method: "M-Pesa",
        amount: 4500,
        date: "2026-03-14",
    },
    {
        id: "ORD-7230",
        customer: "Sarah Njeri",
        email: "sarah@example.com",
        status: "Processing",
        payment: "Paid",
        method: "Stripe",
        amount: 12400,
        date: "2026-03-15",
    },
    {
        id: "ORD-7229",
        customer: "Brian Otieno",
        email: "brian@example.com",
        status: "Shipped",
        payment: "Paid",
        method: "M-Pesa",
        amount: 3200,
        date: "2026-03-15",
    },
    {
        id: "ORD-7228",
        customer: "Grace Mwangi",
        email: "grace@example.com",
        status: "Pending",
        payment: "Unpaid",
        method: "M-Pesa",
        amount: 8500,
        date: "2026-03-15",
    },
    {
        id: "ORD-7227",
        customer: "David Ochieng",
        email: "david@example.com",
        status: "Cancelled",
        payment: "Refunded",
        method: "Stripe",
        amount: 1500,
        date: "2026-03-13",
    },
];

export default function AdminOrdersPage() {
    const [searchTerm, setSearchTerm] = useState("");

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
                                placeholder="Search by order ID or customer name..."
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
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-bold text-accent">{order.id}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-primary">{order.customer}</span>
                                            <span className="text-[10px] text-muted-foreground">{order.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{order.date}</TableCell>
                                    <TableCell className="font-bold">KES {order.amount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <Badge className={cn(
                                                "w-fit border-none text-[10px] font-bold uppercase",
                                                order.payment === "Paid" ? "bg-green-100 text-green-700" :
                                                    order.payment === "Refunded" ? "bg-orange-100 text-orange-700" :
                                                        "bg-red-100 text-red-700"
                                            )}>
                                                {order.payment}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground mt-1 flex items-center">
                                                {order.method === "M-Pesa" ? <Smartphone className="h-3 w-3 mr-1" /> : <CreditCard className="h-3 w-3 mr-1" />}
                                                {order.method}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn(
                                            "border-none uppercase text-[10px] font-bold",
                                            order.status === "Delivered" ? "bg-green-100 text-green-700" :
                                                order.status === "Processing" ? "bg-blue-100 text-blue-700" :
                                                    order.status === "Shipped" ? "bg-orange-100 text-orange-700" :
                                                        order.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
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
                                                <DropdownMenuItem className="flex items-center cursor-pointer">
                                                    <Truck className="mr-2 h-4 w-4" /> Update Status
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="flex items-center cursor-pointer">
                                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Paid
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="flex items-center text-red-600 cursor-pointer">
                                                    Refund Order
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                        <span>Showing 1 to 5 of 124 orders</span>
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

// Fixed missing import
import { CreditCard } from "lucide-react";
