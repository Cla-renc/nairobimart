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
import { useCurrency } from "@/hooks/useCurrency";

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
    const { formatPrice } = useCurrency();
    const addItem = useCartStore((state) => state.addItem);

    const { data: session } = useSession();
    const { toast } = useToast();
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isSavingWishlist, setIsSavingWishlist] = useState(false);

    const handleAddToCart = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        addItem({
            id: product.id,
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
                <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10">
                    <span className="sr-only">View {product.name}</span>
                </Link>
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
            <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {product.category}
                </p>
                <Link href={`/products/${product.slug}`}>
                    <h3 className="font-semibold text-primary line-clamp-1 group-hover:text-accent transition-colors hover:underline">
                        {product.name}
                    </h3>
                </Link>
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
                        {formatPrice(product.price)}
                    </span>
                    {product.comparePrice && (
                        <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.comparePrice)}
                        </span>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                <Button
                    onClick={handleAddToCart}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                </Button>
                <a
                    href={`https://wa.me/254741206995?text=${encodeURIComponent(
                        `🛒 *ORDER REQUEST*\nProduct: ${product.name}\nProduct ID: ${product.id}\nPrice: KES ${product.price}\nQuantity: 1\nFlash Sale: ${product.isSale ? 'true' : 'false'}\n\nProduct Link: ${(process.env.NEXT_PUBLIC_URL || 'https://nairobimart-gwna.vercel.app')}/products/${product.slug}?ref=wa3\n\nI am interested in ordering this item via WhatsApp.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe57] text-white h-10 text-sm font-semibold rounded-md shadow-sm shadow-green-500/20 transition-all hover:-translate-y-0.5 active:scale-95 px-4"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 flex-shrink-0">
                        <path d="M12.031 0C5.385 0 0 5.388 0 12.033c0 2.126.554 4.195 1.61 6.01L.224 23.4l5.495-1.442a12.012 12.012 0 0 0 6.312 1.782h.005c6.645 0 12.032-5.388 12.032-12.032C24.067 5.388 18.675 0 12.031 0zm.005 21.722h-.003a10.026 10.026 0 0 1-5.111-1.393l-.367-.217-3.799.997 1.018-3.702-.238-.378a9.988 9.988 0 0 1-1.528-5.26C1.984 6.273 6.471 1.788 12.036 1.788c5.566 0 10.05 4.484 10.05 10.052s-4.484 10.052-10.05 10.052zm5.518-7.534c-.302-.152-1.792-.885-2.07-.988-.278-.103-.48-.152-.682.152-.202.304-.783.988-.96 1.19-.177.202-.353.228-.656.076-.303-.152-1.28-.472-2.439-1.506-.902-.806-1.51-1.802-1.687-2.106-.177-.304-.019-.468.132-.619.136-.136.303-.354.455-.53.152-.178.202-.304.303-.507.101-.202.05-.38-.025-.531-.076-.152-.682-1.644-.934-2.253-.245-.591-.495-.51-.682-.519-.177-.008-.38-.01-.582-.01-.202 0-.53.076-.808.38-.278.303-1.06 1.037-1.06 2.53s1.086 2.934 1.237 3.136c.152.202 2.137 3.262 5.176 4.57 1.666.719 2.532.793 3.393.754.67-.03 2.07-.846 2.361-1.664.29-.818.29-1.519.202-1.665-.088-.147-.302-.236-.604-.388z"/>
                    </svg>
                    Order via WhatsApp
                </a>
            </CardFooter>
        </Card>
    );
};

export default ProductCard;
