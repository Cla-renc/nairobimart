"use client";

import Link from "next/link";
import Image from "next/image";
import { type MouseEvent, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/store/cartStore";

interface ProductCardProps {
    product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        comparePrice?: number;
        image: string;
        category: string;
        rating?: number;
        isFeatured?: boolean;
        isSale?: boolean;
    };
}

const ProductCard = ({ product }: ProductCardProps) => {
    const addItem = useCartStore((state) => state.addItem);

    const { data: session } = useSession();
    const { toast } = useToast();
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isSavingWishlist, setIsSavingWishlist] = useState(false);

    const handleAddToCart = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        addItem({
            id: Math.random().toString(36).substr(2, 9),
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1,
        });
    };

    const handleAddToWishlist = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!session) {
            signIn();
            return;
        }

        if (isWishlisted) {
            toast({
                title: "Already saved",
                description: "This product is already in your wishlist.",
            });
            return;
        }

        setIsSavingWishlist(true);

        try {
            const response = await fetch("/api/wishlist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ productId: product.id }),
            });

            if (response.status === 401) {
                signIn();
                return;
            }

            if (response.status === 409) {
                setIsWishlisted(true);
                toast({
                    title: "Already saved",
                    description: "This product is already in your wishlist.",
                });
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to save wishlist item.");
            }

            setIsWishlisted(true);
            toast({
                title: "Added to wishlist",
                description: "This product has been saved to your wishlist.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Wishlist failed",
                description:
                    error instanceof Error
                        ? error.message
                        : "Unable to save the item. Please try again.",
            });
        } finally {
            setIsSavingWishlist(false);
        }
    };

    return (
        <Card className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">
            <div className="relative aspect-square overflow-hidden bg-muted">
                <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10" />
                <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 left-2 flex flex-col gap-2">
                    {product.isSale && (
                        <Badge className="bg-accent text-accent-foreground font-bold">SALE</Badge>
                    )}
                    {product.isFeatured && (
                        <Badge variant="secondary" className="font-bold">HOT</Badge>
                    )}
                </div>
                <button
                    type="button"
                    className={`absolute top-2 right-2 z-20 p-2 rounded-full bg-white/80 text-primary hover:bg-white hover:text-accent transition-opacity duration-300 ${isWishlisted ? "text-accent bg-accent/10" : ""} opacity-100 md:opacity-0 group-hover:opacity-100`}
                    onClick={handleAddToWishlist}
                    aria-pressed={isWishlisted}
                    disabled={isSavingWishlist}
                >
                    <Heart className="h-4 w-4" />
                </button>
            </div>
            <Link href={`/products/${product.slug}`} className="block">
                <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        {product.category}
                    </p>
                    <h3 className="font-semibold text-primary line-clamp-1 group-hover:text-accent transition-colors">
                        {product.name}
                    </h3>
                    <div className="flex items-center mt-1 space-x-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                                key={i}
                                className={`h-3 w-3 ${i < Math.floor(product.rating || 0)
                                    ? "fill-accent text-accent"
                                    : "fill-muted text-muted"
                                    }`}
                            />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">
                            ({product.rating || 0})
                        </span>
                    </div>
                    <div className="flex items-center mt-2 space-x-2">
                        <span className="text-lg font-bold text-primary">
                            KES {product.price.toLocaleString()}
                        </span>
                        {product.comparePrice && (
                            <span className="text-sm text-muted-foreground line-through">
                                KES {product.comparePrice.toLocaleString()}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Link>
            <CardFooter className="p-4 pt-0">
                <Button
                    onClick={handleAddToCart}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                </Button>
            </CardFooter>
        </Card>
    );
};

export default ProductCard;
