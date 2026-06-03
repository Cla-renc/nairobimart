"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/store/ProductCard";
import { Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RecommendedProducts() {
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/user/recently-viewed")
            .then(res => res.json())
            .then(data => {
                if (data.success && data.products) {
                    setProducts(data.products.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        slug: p.slug,
                        price: p.price,
                        comparePrice: p.comparePrice ?? undefined,
                        image: p.images?.[0]?.url || "/images/placeholder.jpg",
                        category: p.category?.name || "Uncategorized",
                        rating: 4.5,
                        isFeatured: p.isFeatured,
                        isSale: !!p.comparePrice
                    })));
                }
            })
            .catch(err => console.error("Failed to fetch recommendations:", err))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <section className="py-16">
                <div className="container px-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-muted-foreground">Loading personalized recommendations...</p>
                </div>
            </section>
        );
    }

    if (products.length === 0) {
        return null; // Don't show the section if no recommendations (e.g. not logged in, or no history)
    }

    return (
        <section className="py-16 bg-muted/20">
            <div className="container px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-extrabold text-primary flex items-center">
                            <Sparkles className="mr-3 h-8 w-8 text-accent" /> Recommended for You
                        </h2>
                        <p className="text-muted-foreground">AI-curated picks based on your recent activity.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
