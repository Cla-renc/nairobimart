"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight, Truck, Mail, CreditCard, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cartStore";

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("id") || "";
    const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
    const [, setLoading] = useState(true);
    const { clearCart } = useCartStore();

    // Fetch order data from database to get accurate payment method
    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) {
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`/api/orders/${orderId}`);
                if (response.ok) {
                    const order = await response.json();
                    setPaymentMethod(order.paymentMethod);
                    clearCart();
                } else {
                    // Fallback to URL parameter if API fails
                    const urlPayment = searchParams.get("payment");
                    setPaymentMethod(urlPayment);
                }
            } catch (error) {
                console.error("Failed to fetch order:", error);
                // Fallback to URL parameter
                const urlPayment = searchParams.get("payment");
                setPaymentMethod(urlPayment);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId, searchParams, clearCart]);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center space-y-8">
                <div className="flex justify-center">
                    <div className="bg-green-100 p-6 rounded-full animate-bounce">
                        <CheckCircle2 className="h-20 w-20 text-green-600" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-extrabold text-primary tracking-tight">Purchase Successful!</h1>
                    <p className="text-xl text-muted-foreground">
                        Thank you for shopping with <span className="text-accent font-bold">NairobiMart</span>.
                        Your order is being processed.
                    </p>
                    {paymentMethod === "pesapal" ? (
                        <Badge className="bg-blue-100 text-blue-700 border-none text-sm px-4 py-1 font-bold">
                            <CreditCard className="h-4 w-4 mr-2" /> Paid via Card (Visa/Mastercard)
                        </Badge>
                    ) : paymentMethod === "mpesa" ? (
                        <Badge className="bg-green-100 text-green-700 border-none text-sm px-4 py-1 font-bold">
                            <Smartphone className="h-4 w-4 mr-2" /> Paid via M-Pesa
                        </Badge>
                    ) : null}
                </div>

                <Card className="border-none shadow-lg bg-white overflow-hidden">
                    <div className="h-2 bg-green-500 w-full" />
                    <CardHeader>
                        <CardTitle className="text-lg">Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {orderId && (
                            <div className="flex justify-between items-center pb-4 border-b">
                                <span className="text-muted-foreground">Order ID</span>
                                <span className="font-bold text-primary font-mono text-sm">{orderId}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                            <div className="flex items-start space-x-3">
                                <div className="bg-muted p-2 rounded-lg">
                                    <Mail className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">Confirmation Sent</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Check your inbox for the receipt and tracking details.</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="bg-muted p-2 rounded-lg">
                                    <Truck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">International Shipping</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Delivery takes 15-30 business days from our global warehouses.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/"
                        className={cn(buttonVariants({ size: "lg" }), "bg-primary hover:bg-primary/90 text-white min-w-[200px] font-bold")}
                    >
                        Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <Link
                        href="/account/orders"
                        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-accent text-accent hover:bg-accent/10 min-w-[200px] font-bold")}
                    >
                        Track Order <Truck className="ml-2 h-4 w-4" />
                    </Link>
                </div>

                <p className="text-xs text-muted-foreground italic">
                    Need help? Contact us at support@nairobimart.co.ke or call 0759193674
                </p>
            </div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
