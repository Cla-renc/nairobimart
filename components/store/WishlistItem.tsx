"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/lib/button-variants";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface WishlistItemProps {
    item: {
        id: string;
        product: {
            id: string;
            name: string;
            slug: string;
            price: number;
            images: Array<{ url: string }>;
        };
    };
}

export default function WishlistItem({ item }: WishlistItemProps) {
    const router = useRouter();
    const addItem = useCartStore((state) => state.addItem);
    const { toast } = useToast();
    const [isWorking, setIsWorking] = useState(false);

    const handleAddToCart = () => {
        addItem({
            id: Math.random().toString(36).substr(2, 9),
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            image: item.product.images[0]?.url ?? "",
            quantity: 1,
        });

        toast({
            title: "Added to cart",
            description: `${item.product.name} has been added to your cart.`,
        });
    };

    const handleRemove = async () => {
        setIsWorking(true);

        try {
            const response = await fetch("/api/wishlist", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ productId: item.product.id }),
            });

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || "Could not remove wishlist item.");
            }

            toast({
                title: "Removed from wishlist",
                description: `${item.product.name} has been removed from your wishlist.`,
            });
            router.refresh();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Remove failed",
                description: error instanceof Error ? error.message : "Unable to remove the item.",
            });
        } finally {
            setIsWorking(false);
        }
    };

    return (
        <Card className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <CardContent className="p-0 flex">
                <div className="relative h-40 w-40 flex-shrink-0 bg-muted">
                    {item.product.images[0]?.url ? (
                        <Image
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            fill
                            sizes="160px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                    )}
                </div>
                <div className="p-6 flex flex-col justify-between flex-1">
                    <div>
                        <div className="flex justify-between items-start gap-2">
                            <Link href={`/products/${item.product.slug}`} className="font-bold text-lg hover:text-accent transition-colors line-clamp-1">
                                {item.product.name}
                            </Link>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive h-8 w-8"
                                onClick={handleRemove}
                                disabled={isWorking}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xl font-black text-primary mt-2">KES {item.product.price.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Link href={`/products/${item.product.slug}`} className={cn(buttonVariants({ variant: "outline" }), "flex-1 h-9 text-xs")}> 
                            View Details
                        </Link>
                        <Button
                            type="button"
                            className="flex-1 h-9 text-xs bg-accent hover:bg-accent/90"
                            onClick={handleAddToCart}
                        >
                            Add to Cart
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
