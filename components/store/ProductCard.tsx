"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        rating: number;
        isFeatured?: boolean;
        isSale?: boolean;
    };
}

const ProductCard = ({ product }: ProductCardProps) => {
    const addItem = useCartStore((state) => state.addItem);

    const handleAddToCart = (e: React.MouseEvent) => {
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

    return (
        <Card className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">
            <Link href={`/products/${product.slug}`}>
                <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
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
                        className="absolute top-2 right-2 p-2 rounded-full bg-white/80 text-primary hover:bg-white hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={(e) => {
                            e.preventDefault();
                            // Add to wishlist
                        }}
                    >
                        <Heart className="h-4 w-4" />
                    </button>
                </div>
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
                                className={`h-3 w-3 ${i < Math.floor(product.rating)
                                        ? "fill-accent text-accent"
                                        : "fill-muted text-muted"
                                    }`}
                            />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">
                            ({product.rating})
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
