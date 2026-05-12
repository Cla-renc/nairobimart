"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Package,
    User,
    MapPin,
    CreditCard,
    Truck,
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    Phone,
    Mail,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface OrderItem {
    id: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    product: {
        id: string;
        name: string;
        slug: string;
        images: { url: string }[];
    };
    variant: { name: string; value: string } | null;
}

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    subtotal: number;
    shippingFee: number;
    discount: number;
    total: number;
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    shippingCity: string;
    shippingCounty: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
    notes: string | null;
    mpesaTransactionId: string | null;
    stripePaymentId: string | null;
    cjOrderId: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        phone: string | null;
    } | null;
    items: OrderItem[];
}

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    refunded: "bg-purple-100 text-purple-700",
};

const paymentColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-purple-100 text-purple-700",
};

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submittingToCj, setSubmittingToCj] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState("");
    const [trackingUrl, setTrackingUrl] = useState("");
    const [adminNotes, setAdminNotes] = useState("");

    const fetchOrder = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/orders/${orderId}`);
            if (!res.ok) throw new Error("Order not found");
            const data: Order = await res.json();
            setOrder(data);
            setTrackingNumber(data.trackingNumber || "");
            setTrackingUrl(data.trackingUrl || "");
            setAdminNotes(data.notes || "");
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to load order.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    const updateStatus = async (status: string) => {
        try {
            setSaving(true);
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed");
            toast({ title: "Status updated", description: `Order marked as ${status}` });
            fetchOrder();
        } catch {
            toast({ title: "Error", description: "Could not update status.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const updatePayment = async (paymentStatus: string) => {
        try {
            setSaving(true);
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentStatus }),
            });
            if (!res.ok) throw new Error("Failed");
            toast({ title: "Payment updated", description: `Payment marked as ${paymentStatus}` });
            fetchOrder();
        } catch {
            toast({ title: "Error", description: "Could not update payment.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const saveTracking = async () => {
        try {
            setSaving(true);
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trackingNumber, trackingUrl, notes: adminNotes }),
            });
            if (!res.ok) throw new Error("Failed");
            toast({ title: "Saved", description: "Tracking info and notes saved." });
            fetchOrder();
        } catch {
            toast({ title: "Error", description: "Could not save tracking info.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const submitToCj = async () => {
        try {
            setSubmittingToCj(true);
            const res = await fetch(`/api/admin/orders/${orderId}/submit-cj`, {
                method: "POST",
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed");

            toast({
                title: "Submitted to CJ",
                description: `Successfully created CJ Order: ${data.cjOrderNumber || data.cjOrderId}`
            });
            fetchOrder();
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Submission Failed",
                description: err.message || "Failed to submit order to CJ Dropshipping.",
                variant: "destructive"
            });
        } finally {
            setSubmittingToCj(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-24">
                <h2 className="text-2xl font-bold text-primary">Order not found</h2>
                <Link href="/admin/orders">
                    <Button className="mt-4" variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-primary">{order.orderNumber}</h1>
                        <p className="text-sm text-muted-foreground">
                            Placed on {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn("text-sm font-bold px-3 py-1 border-none uppercase", statusColors[order.status])}>
                        {order.status}
                    </Badge>
                    <Badge className={cn("text-sm font-bold px-3 py-1 border-none uppercase", paymentColors[order.paymentStatus])}>
                        {order.paymentStatus}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Package className="h-4 w-4 text-accent" /> Order Items ({order.items.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.length > 0 ? (
                                    order.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                                            <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                {item.product.images?.[0]?.url ? (
                                                    <Image
                                                        src={item.product.images[0].url}
                                                        alt={item.product.name}
                                                        fill
                                                        sizes="64px"
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <Package className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/admin/products/${item.product.id}`} className="font-semibold text-primary hover:text-accent transition-colors line-clamp-1 flex items-center gap-1">
                                                    {item.product.name}
                                                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                                </Link>
                                                {item.variant && (
                                                    <p className="text-xs text-muted-foreground">{item.variant.name}: {item.variant.value}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground">Qty: {item.quantity} × KES {item.unitPrice.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-bold text-primary">KES {(item.quantity * item.unitPrice).toLocaleString()}</p>
                                                <p className="text-[10px] text-muted-foreground">Cost: KES {(item.quantity * item.costPrice).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-6 text-center bg-muted/20 rounded-xl border border-dashed border-muted-foreground/20">
                                        <Package className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                                        <p className="text-sm font-semibold text-muted-foreground">No item details recorded</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            This order was placed before item tracking was enabled. Order totals are still accurate.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <Separator className="my-4" />

                            {/* Totals */}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>KES {order.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Shipping</span>
                                    <span>KES {order.shippingFee.toLocaleString()}</span>
                                </div>
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>- KES {order.discount.toLocaleString()}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-extrabold text-base text-primary">
                                    <span>Total</span>
                                    <span>KES {order.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tracking Info */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Truck className="h-4 w-4 text-accent" /> Tracking & Fulfillment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {order.cjOrderId && (
                                <div className="text-sm text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg">
                                    CJ Order ID: <span className="font-mono font-bold text-primary">{order.cjOrderId}</span>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs uppercase tracking-widest">Tracking Number</Label>
                                    <Input
                                        placeholder="e.g. KEXPRESS1234"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs uppercase tracking-widest">Tracking URL</Label>
                                    <Input
                                        placeholder="https://..."
                                        value={trackingUrl}
                                        onChange={(e) => setTrackingUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase tracking-widest">Admin Notes</Label>
                                <Textarea
                                    placeholder="Internal notes about this order..."
                                    rows={3}
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button onClick={saveTracking} disabled={saving} className="bg-primary text-white hover:bg-primary/90 flex-1">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Save Changes
                                </Button>

                                {!order.cjOrderId && order.paymentStatus === "paid" && (
                                    <Button
                                        onClick={submitToCj}
                                        disabled={submittingToCj}
                                        className="bg-accent text-white hover:bg-accent/90 flex-1 font-bold"
                                    >
                                        {submittingToCj ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Package className="h-4 w-4 mr-2" />}
                                        Submit to CJ
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <User className="h-4 w-4 text-accent" /> Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <p className="font-bold text-primary">{order.user?.name || order.shippingName || "Guest"}</p>
                            {order.user?.email && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    <a href={`mailto:${order.user.email}`} className="hover:text-accent">{order.user.email}</a>
                                </div>
                            )}
                            {order.user?.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <a href={`tel:${order.user.phone}`} className="hover:text-accent">{order.user.phone}</a>
                                </div>
                            )}
                            {order.user && (
                                <Link href={`/admin/customers/${order.user.id}`}>
                                    <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
                                        View Customer Profile
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MapPin className="h-4 w-4 text-accent" /> Shipping Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                            <p className="font-semibold text-primary">{order.shippingName}</p>
                            <p className="text-muted-foreground">{order.shippingPhone}</p>
                            <p className="text-muted-foreground">{order.shippingAddress}</p>
                            <p className="text-muted-foreground">{order.shippingCity}, {order.shippingCounty}</p>
                        </CardContent>
                    </Card>

                    {/* Payment Info */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CreditCard className="h-4 w-4 text-accent" /> Payment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Method</span>
                                <span className="font-bold uppercase text-primary">{order.paymentMethod}</span>
                            </div>
                            {order.mpesaTransactionId && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">M-Pesa Ref</span>
                                    <span className="font-mono text-xs text-primary">{order.mpesaTransactionId}</span>
                                </div>
                            )}
                            {order.stripePaymentId && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Stripe ID</span>
                                    <span className="font-mono text-xs text-primary">{order.stripePaymentId}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Status</span>
                                <Badge className={cn("text-xs border-none uppercase", paymentColors[order.paymentStatus])}>
                                    {order.paymentStatus}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Actions */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Update Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Select defaultValue={order.status} onValueChange={(value) => value && updateStatus(value)} disabled={saving}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending"><Clock className="h-3 w-3 inline mr-2" />Pending</SelectItem>
                                    <SelectItem value="processing"><Loader2 className="h-3 w-3 inline mr-2" />Processing</SelectItem>
                                    <SelectItem value="shipped"><Truck className="h-3 w-3 inline mr-2" />Shipped</SelectItem>
                                    <SelectItem value="delivered"><CheckCircle2 className="h-3 w-3 inline mr-2" />Delivered</SelectItem>
                                    <SelectItem value="cancelled"><XCircle className="h-3 w-3 inline mr-2" />Cancelled</SelectItem>
                                </SelectContent>
                            </Select>

                            <Separator />

                            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Payment</p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-green-700 border-green-200 hover:bg-green-50"
                                    onClick={() => updatePayment("paid")}
                                    disabled={saving || order.paymentStatus === "paid"}
                                >
                                    Mark Paid
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-purple-700 border-purple-200 hover:bg-purple-50"
                                    onClick={() => updatePayment("refunded")}
                                    disabled={saving}
                                >
                                    Refund
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
