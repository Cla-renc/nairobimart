"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useCartStore } from "@/store/cartStore";
import { useState, useEffect } from "react";

const CartDrawer = ({ children }: { children: React.ReactElement }) => {
    const [isMounted, setIsMounted] = useState(false);
    const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCartStore();
    const totalPrice = getTotalPrice();
    const totalItems = getTotalItems();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <Sheet>
            <SheetTrigger render={children} />
            <SheetContent className="flex flex-col w-full sm:max-w-md p-0">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle className="flex items-center space-x-2">
                        <ShoppingBag className="h-5 w-5 text-accent" />
                        <span>Your Cart ({totalItems})</span>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {!isMounted ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 text-center text-muted-foreground">
                            Loading cart...
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                            <div className="bg-muted rounded-full p-8">
                                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-primary">Your cart is empty</h3>
                            <p className="text-muted-foreground">Looks like you haven&apos;t added anything yet.</p>
                            <Button asChild className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                                <Link href="/products">Start Shopping</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {items.map((item) => (
                                <div key={`${item.productId}-${item.variantId}`} className="flex space-x-4">
                                    <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            sizes="96px"
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-semibold text-primary line-clamp-1">{item.name}</h4>
                                            {item.variantId && (
                                                <p className="text-xs text-muted-foreground mt-0.5">Variant: {item.variantId}</p>
                                            )}
                                            <p className="font-bold text-primary mt-1">KES {item.price.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center border rounded-full px-2 py-1 space-x-3">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="p-1 hover:text-accent"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="p-1 hover:text-accent"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-muted-foreground hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isMounted && items.length > 0 && (
                    <SheetFooter className="p-6 border-t bg-muted/20 flex-col sm:flex-col space-y-4">
                        <div className="w-full space-y-2">
                            <div className="flex justify-between text-base">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">KES {totalPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold">
                                <span className="text-primary">Total</span>
                                <span className="text-primary">KES {totalPrice.toLocaleString()}</span>
                            </div>
                            <p className="text-[11px] text-center text-muted-foreground pt-2">
                                Shipping and taxes calculated at checkout.
                            </p>
                        </div>
                        <Button asChild className="w-full bg-primary text-white h-12 text-lg hover:bg-primary/90" size="lg">
                            <Link href="/checkout">Proceed to Checkout</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full h-12" size="lg">
                            <Link href="/cart">View Shopping Cart</Link>
                        </Button>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default CartDrawer;
