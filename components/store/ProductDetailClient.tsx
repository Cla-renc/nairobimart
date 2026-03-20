"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Star,
    ShoppingCart,
    Heart,
    Truck,
    ShieldCheck,
    RefreshCcw,
    Plus,
    Minus,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCartStore } from "@/store/cartStore";
import ProductCard from "@/components/store/ProductCard";
import { Separator } from "@/components/ui/separator";

// Mock product
const product = {
    id: "1",
    name: "Premium Wireless Noise Cancelling Earbuds",
    slug: "wireless-earbuds-kenya",
    price: 4500,
    comparePrice: 6500,
    images: ["/images/product-1.jpg", "/images/product-1b.jpg", "/images/product-1c.jpg"],
    category: "Electronics",
    rating: 4.8,
    reviewsCount: 124,
    stock: 15,
    description: `
    <p>Experience studio-quality sound with our latest noise-cancelling earbuds. Perfect for the Nairobi commute or focus sessions at work.</p>
    <ul class="list-disc pl-5 mt-4 space-y-2">
      <li>Active Noise Cancellation (ANC) up to 35dB</li>
      <li>Bluetooth 5.3 for seamless connectivity</li>
      <li>30-hour total battery life with charging case</li>
      <li>IPX4 water and sweat resistance</li>
      <li>In-ear detection and touch controls</li>
    </ul>
  `,
    variants: [
        { name: "Color", options: ["Midnight Black", "Arctic White", "Deep Navy"] },
    ],
};

const relatedProducts = [
    {
        id: "4",
        name: "Ultra-Fast Portable SSD 1TB USB 3.2",
        slug: "portable-ssd-1tb",
        price: 8500,
        image: "/images/product-4.jpg",
        category: "Electronics",
        rating: 4.9,
        isFeatured: true,
    },
    {
        id: "8",
        name: "Professional Dual Mic Wireless Lavalier",
        slug: "wireless-lavalier-mic",
        price: 3800,
        image: "/images/product-8.jpg",
        category: "Electronics",
        rating: 4.8,
    },
];

export default function ProductDetailClient({ slug }: { slug: string }) {
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState(product.variants[0].options[0]);
    const [quantity, setQuantity] = useState(1);
    const addItem = useCartStore((state) => state.addItem);

    const handleAddToCart = () => {
        addItem({
            id: Math.random().toString(36).substr(2, 9),
            productId: product.id,
            variantId: selectedVariant,
            name: product.name,
            price: product.price,
            image: product.images[0],
            quantity: quantity,
        });
    };

    const savings = product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;

    return (
        <div className="container px-4 py-8">
            {/* Breadcrumbs */}
            <nav className="flex mb-8 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-accent">Home</Link>
                <span className="mx-2">/</span>
                <Link href="/products" className="hover:text-accent">Products</Link>
                <span className="mx-2">/</span>
                <span className="text-primary font-medium truncate">{product.name}</span>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Gallery */}
                <div className="space-y-4">
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted border group">
                        <Image
                            src={product.images[selectedImage]}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            priority
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {product.images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedImage(idx)}
                                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? "border-accent shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                                    }`}
                            >
                                <Image src={img} alt={`${product.name} ${idx}`} fill className="object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Info */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Badge className="bg-primary/10 text-primary border-none">{product.category}</Badge>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">{product.name}</h1>
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < 4 ? "fill-accent text-accent" : "fill-muted text-muted"}`} />
                                ))}
                            </div>
                            <span className="text-sm font-medium">({product.reviewsCount} reviews)</span>
                        </div>
                    </div>

                    <div className="flex items-baseline space-x-3">
                        <span className="text-4xl font-bold text-primary">KES {product.price.toLocaleString()}</span>
                        {product.comparePrice && (
                            <>
                                <span className="text-xl text-muted-foreground line-through">KES {product.comparePrice.toLocaleString()}</span>
                                <Badge className="bg-red-500 text-white border-none font-bold italic">SAVE {savings}%</Badge>
                            </>
                        )}
                    </div>

                    <div className="p-5 rounded-2xl bg-orange-50 border border-orange-100 text-orange-900 shadow-sm">
                        <div className="flex items-center space-x-2 font-black uppercase text-xs tracking-widest mb-2">
                            <Truck className="h-4 w-4" />
                            <span>Global Shipping disclosure</span>
                        </div>
                        <p className="text-sm leading-relaxed">
                            This product is shipped from our overseas fulfillment center. Delivery to Kenya takes <strong>15-30 business days</strong>. Tracking number will be sent via SMS/Email.
                        </p>
                    </div>

                    <Separator />

                    {/* Variants */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-primary flex items-center">
                            Select {product.variants[0].name}
                            <span className="ml-2 h-1 w-1 rounded-full bg-accent" />
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {product.variants[0].options.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setSelectedVariant(opt)}
                                    className={`px-5 py-2.5 rounded-full border-2 text-sm font-bold transition-all ${selectedVariant === opt
                                            ? "border-accent bg-accent/5 text-accent shadow-md"
                                            : "border-muted bg-white text-muted-foreground hover:border-accent/50"
                                        }`}
                                >
                                    {selectedVariant === opt && <Check className="inline-block mr-2 h-4 w-4" />}
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity & Add to Cart */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                        <div className="flex items-center border-2 border-primary/10 rounded-full px-6 py-3 space-x-8 bg-white shadow-sm">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="text-primary hover:text-accent transition-colors"
                            >
                                <Minus className="h-5 w-5" />
                            </button>
                            <span className="font-black text-lg w-4 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="text-primary hover:text-accent transition-colors"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>
                        <Button
                            className="w-full sm:flex-1 bg-primary hover:bg-primary/95 text-white h-16 text-xl font-black rounded-full shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 active:scale-95"
                            onClick={handleAddToCart}
                        >
                            <ShoppingCart className="mr-3 h-6 w-6" />
                            ADD TO BAG
                        </Button>
                    </div>

                    {/* Perks */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                        <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-2xl border border-white">
                            <ShieldCheck className="h-5 w-5 text-accent" />
                            <span className="text-xs font-bold uppercase tracking-tighter text-primary">100% Authentic</span>
                        </div>
                        <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-2xl border border-white">
                            <RefreshCcw className="h-5 w-5 text-accent" />
                            <span className="text-xs font-bold uppercase tracking-tighter text-primary">7-Day Return</span>
                        </div>
                        <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-2xl border border-white">
                            <Truck className="h-5 w-5 text-accent" />
                            <span className="text-xs font-bold uppercase tracking-tighter text-primary">Safe Transit</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-20">
                <Tabs defaultValue="description" className="w-full">
                    <TabsList className="w-full justify-start border-b-2 bg-transparent rounded-none h-auto p-0 space-x-12">
                        <TabsTrigger
                            value="description"
                            className="rounded-none border-b-4 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-0 pb-6 text-xl font-black uppercase tracking-tighter transition-all"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="reviews"
                            className="rounded-none border-b-4 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-0 pb-6 text-xl font-black uppercase tracking-tighter transition-all"
                        >
                            Feedback ({product.reviewsCount})
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="description" className="py-12 prose prose-slate max-w-none">
                        <div
                            className="text-muted-foreground leading-relaxed text-lg"
                            dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                    </TabsContent>
                    <TabsContent value="reviews" className="py-12">
                        <div className="bg-muted/20 rounded-3xl p-12 text-center space-y-4 border-2 border-dashed border-muted">
                            <div className="flex justify-center">
                                <Star className="h-12 w-12 text-muted fill-muted opacity-50" />
                            </div>
                            <h3 className="text-2xl font-bold text-primary">No feedback yet</h3>
                            <p className="text-muted-foreground">Be the first to share your experience with this item.</p>
                            <Button variant="outline" className="mt-4 border-accent text-accent font-bold">Write a Review</Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Related Products */}
            <div className="mt-24 space-y-12">
                <div className="flex items-end justify-between border-b-2 pb-6 border-primary/5">
                    <div>
                        <h2 className="text-4xl font-black text-primary tracking-tighter uppercase">You Might Like</h2>
                        <p className="text-muted-foreground mt-2">Selected electronics for you</p>
                    </div>
                    <Link href="/products" className="text-accent font-black text-sm uppercase tracking-widest hover:underline flex items-center">
                        View All <Plus className="ml-2 h-4 w-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {relatedProducts.map((p) => (
                        <ProductCard key={p.id} product={p as any} />
                    ))}
                </div>
            </div>
        </div>
    );
}
