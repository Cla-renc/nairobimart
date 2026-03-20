"use client";

import Link from "next/link";
import { CheckCircle2, ShoppingBag, ArrowRight, Truck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("id") || "ORD-7231";

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
                </div>

                <Card className="border-none shadow-lg bg-white overflow-hidden">
                    <div className="h-2 bg-green-500 w-full" />
                    <CardHeader>
                        <CardTitle className="text-lg">Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b">
                            <span className="text-muted-foreground">Order Number</span>
                            <span className="font-bold text-primary">{orderId}</span>
                        </div>

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
                    Need help? Contact us at support@nairobimart.co.ke
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
