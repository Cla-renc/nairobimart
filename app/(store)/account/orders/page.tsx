import { auth } from "@/auth";
import prisma from "@/lib/prisma";
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
    ExternalLink,
    ShoppingBag,
    RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { buttonVariants } from "@/lib/button-variants";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";
import DeleteOrderButton from "./DeleteOrderButton";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
    const session = await auth();

    if (!session?.user?.email) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h1 className="text-2xl font-bold">Please log in to view your orders.</h1>
                <Link href="/login" className={cn(buttonVariants(), "mt-4")}>Login</Link>
            </div>
        );
    }

    // Resolve the actual DB user (orders are saved with the DB user ID)
    const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
    });

    const orders = dbUser
        ? await prisma.order.findMany({
            where: { userId: dbUser.id },
            orderBy: { createdAt: "desc" },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                images: { take: 1, select: { url: true } }
                            }
                        }
                    }
                }
            }
        })
        : [];

    const formatDate = (date: Date | string) =>
        new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        }).format(new Date(date));

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "delivered": return "bg-green-100 text-green-700";
            case "processing": return "bg-blue-100 text-blue-700";
            case "shipped": return "bg-orange-100 text-orange-700";
            case "cancelled": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "delivered": return <CheckCircle2 className="h-3 w-3 mr-1 inline" />;
            case "processing": return <Clock className="h-3 w-3 mr-1 inline" />;
            case "shipped": return <Truck className="h-3 w-3 mr-1 inline" />;
            case "cancelled": return <AlertCircle className="h-3 w-3 mr-1 inline" />;
            default: return <Clock className="h-3 w-3 mr-1 inline" />;
        }
    };

    return (
        <div className="bg-muted/30 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <Link
                    href="/account"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-accent mb-6 transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Account
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-primary">My Orders</h1>
                        <p className="text-muted-foreground mt-1">
                            Check the status of your recent purchases.
                            {orders.length > 0 && (
                                <span className="ml-2 text-accent font-bold">{orders.length} order{orders.length !== 1 ? "s" : ""}</span>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search orders..." className="pl-10 shadow-sm border-none" />
                        </div>
                        <button className={cn(buttonVariants({ variant: "outline" }), "shrink-0 shadow-sm border-none bg-white h-10 w-10 p-0 flex items-center justify-center")}>
                            <Filter className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {orders.length > 0 ? (
                        orders.map((order) => (
                            <Card key={order.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                                {/* Order Header */}
                                <CardHeader className="bg-white border-b pb-4">
                                    <div className="flex flex-wrap justify-between items-center gap-4">
                                        <div className="flex items-center gap-6">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Order Placed</p>
                                                <p className="text-sm font-semibold">{formatDate(order.createdAt)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Amount</p>
                                                <p className="text-sm font-bold text-primary">KES {order.total.toLocaleString()}</p>
                                            </div>
                                            <div className="hidden sm:block">
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Order ID</p>
                                                <p className="text-sm font-mono text-accent">#{order.orderNumber}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={cn(
                                                "border-none uppercase text-[10px] font-bold px-3 py-1",
                                                getStatusStyle(order.status)
                                            )}>
                                                {getStatusIcon(order.status)}
                                                {order.status}
                                            </Badge>
                                            {/* Details button — links to order detail page */}
                                            <Link
                                                href={`/order-success?id=${order.id}`}
                                                className={cn(
                                                    buttonVariants({ variant: "ghost", size: "sm" }),
                                                    "text-accent hover:text-accent group-hover:bg-accent/5"
                                                )}
                                            >
                                                Details <ChevronRight className="h-4 w-4 ml-1" />
                                            </Link>
                                            {/* Delete order button */}
                                            <DeleteOrderButton orderId={order.id} />
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* Order Items */}
                                <CardContent className="p-0">
                                    <div className="divide-y divide-muted/50">
                                        {order.items.map((item) => {
                                            const productImage = item.product.images?.[0]?.url;
                                            const productUrl = `/products/${item.product.slug}`;
                                            return (
                                                <div key={item.id} className="p-6 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        {/* Product Image */}
                                                        <div className="h-20 w-20 rounded-2xl bg-muted overflow-hidden border border-muted/20 shadow-sm relative flex-shrink-0 group-hover:scale-105 transition-transform">
                                                            {productImage ? (
                                                                <Image
                                                                    src={productImage}
                                                                    alt={item.product.name}
                                                                    fill
                                                                    sizes="80px"
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                                                                    <Package className="h-8 w-8 opacity-20" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            {/* Product name links to product page */}
                                                            <Link href={productUrl}>
                                                                <h4 className="font-bold text-base text-primary leading-tight mb-1 hover:text-accent transition-colors truncate">
                                                                    {item.product.name}
                                                                </h4>
                                                            </Link>
                                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                            <p className="text-xs font-bold text-accent mt-1">
                                                                KES {(item.unitPrice * item.quantity).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {/* Action buttons */}
                                                    <div className="flex gap-2 flex-shrink-0">
                                                        {/* Buy Again → product page */}
                                                        <Link
                                                            href={productUrl}
                                                            className={cn(
                                                                buttonVariants({ variant: "outline", size: "sm" }),
                                                                "rounded-xl border-muted text-xs font-bold flex items-center gap-1"
                                                            )}
                                                        >
                                                            <RefreshCw className="h-3 w-3" />
                                                            Buy Again
                                                        </Link>
                                                        {/* Product Link → product page (external style) */}
                                                        <Link
                                                            href={productUrl}
                                                            className={cn(
                                                                buttonVariants({ variant: "ghost", size: "sm" }),
                                                                "rounded-xl text-xs font-bold hidden sm:flex items-center gap-1"
                                                            )}
                                                        >
                                                            Product Link <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>

                                {/* Mobile: Track button */}
                                <div className="bg-muted/10 p-4 border-t flex justify-end gap-3 sm:hidden">
                                    <Link
                                        href={`/order-success?id=${order.id}`}
                                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full text-xs font-bold flex items-center justify-center gap-2")}
                                    >
                                        <Truck className="h-3 w-3" /> Track Shipment
                                    </Link>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="border-none shadow-sm p-12 text-center">
                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShoppingBag className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                            <h3 className="text-xl font-bold text-primary">No orders yet</h3>
                            <p className="text-muted-foreground mt-2 mb-6">
                                Looks like you haven&apos;t made any purchases yet.
                            </p>
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
