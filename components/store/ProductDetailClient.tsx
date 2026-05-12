"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Star,
    ShoppingCart,
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

interface ProductImage {
    url: string;
}

interface ProductVariant {
    id: string;
    value: string;
}

interface ProductDetail {
    id: string;
    name: string;
    price: number;
    comparePrice?: number | null;
    description?: string | null;
    attributes?: Record<string, unknown> | Record<string, unknown>[] | null;
    images: ProductImage[];
    variants: ProductVariant[];
    category?: { name: string } | null;
    isFeatured?: boolean;
}

interface RelatedProduct {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number | null;
    images: ProductImage[];
    category?: { name: string } | null;
}

export default function ProductDetailClient({
    product,
    relatedProducts
}: {
    product: ProductDetail,
    relatedProducts: RelatedProduct[]
}) {
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]?.value || "");
    const [quantity, setQuantity] = useState(1);
    const addItem = useCartStore((state) => state.addItem);

    const images = product.images?.length > 0
        ? product.images.map((img) => img.url)
        : ["/images/placeholder.jpg"];

    const handleAddToCart = () => {
        addItem({
            id: `${product.id}-${selectedVariant || 'default'}`,
            productId: product.id,
            variantId: selectedVariant,
            name: product.name,
            price: product.price,
            image: images[0],
            quantity: quantity,
        });
    };

    const savings = product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
    const hasVariants = product.variants?.length > 0;

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
                            src={images[selectedImage]}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            priority
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {images.map((img: string, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedImage(idx)}
                                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? "border-accent shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                                    }`}
                            >
                                <Image src={img} alt={`${product.name} ${idx}`} fill sizes="80px" className="object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Info */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Badge className="bg-primary/10 text-primary border-none">{product.category?.name || "Uncategorized"}</Badge>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">{product.name}</h1>
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < 4 ? "fill-accent text-accent" : "fill-muted text-muted"}`} />
                                ))}
                            </div>
                            <span className="text-sm font-medium">(0 reviews)</span>
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
                    {hasVariants && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-primary flex items-center">
                                Select Variant
                                <span className="ml-2 h-1 w-1 rounded-full bg-accent" />
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {product.variants.map((variant) => (
                                    <button
                                        key={variant.id}
                                        onClick={() => setSelectedVariant(variant.value)}
                                        className={`px-5 py-2.5 rounded-full border-2 text-sm font-bold transition-all ${selectedVariant === variant.value
                                            ? "border-accent bg-accent/5 text-accent shadow-md"
                                            : "border-muted bg-white text-muted-foreground hover:border-accent/50"
                                            }`}
                                    >
                                        {selectedVariant === variant.value && <Check className="inline-block mr-2 h-4 w-4" />}
                                        {variant.value}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

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
                        <Link href="/cart" className="w-full sm:flex-1">
                            <Button
                                className="w-full bg-accent hover:bg-accent/90 text-white h-16 text-xl font-black rounded-full shadow-xl shadow-accent/20 transition-all hover:-translate-y-1 active:scale-95 px-8"
                                onClick={handleAddToCart}
                            >
                                BUY NOW
                            </Button>
                        </Link>
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

            {/* Tabs & Full Description */}
            <div className="mt-20">
                <Tabs defaultValue="description" className="w-full">
                    <TabsList className="w-full flex justify-start gap-8 border-b-2 bg-transparent rounded-none h-auto p-0 mb-8">
                        <TabsTrigger
                            value="description"
                            className="bg-transparent data-[state=active]:bg-transparent border-b-4 border-transparent data-[state=active]:border-accent px-2 pb-4 text-sm md:text-lg font-black uppercase tracking-tight transition-all rounded-none shadow-none text-primary/40 data-[state=active]:text-primary"
                        >
                            Description
                        </TabsTrigger>
                        <TabsTrigger
                            value="specs"
                            className="bg-transparent data-[state=active]:bg-transparent border-b-4 border-transparent data-[state=active]:border-accent px-2 pb-4 text-sm md:text-lg font-black uppercase tracking-tight transition-all rounded-none shadow-none text-primary/40 data-[state=active]:text-primary"
                        >
                            Specifications
                        </TabsTrigger>
                        <TabsTrigger
                            value="reviews"
                            className="bg-transparent data-[state=active]:bg-transparent border-b-4 border-transparent data-[state=active]:border-accent px-2 pb-4 text-sm md:text-lg font-black uppercase tracking-tight transition-all rounded-none shadow-none text-primary/40 data-[state=active]:text-primary"
                        >
                            Reviews (0)
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="description" className="py-12">
                        <div className="flex flex-col lg:flex-row gap-8">
                            <div className="flex-1 bg-white rounded-3xl p-8 md:p-12 border shadow-sm">
                                <h3 className="text-2xl font-black text-primary mb-8 uppercase tracking-tight flex items-center">
                                    Product Detailed Description
                                    <span className="ml-3 h-1.5 w-1.5 rounded-full bg-accent" />
                                </h3>
                                <div
                                    className="cj-description prose prose-lg prose-slate max-w-none text-primary/80 
                                               prose-headings:text-primary prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                                               prose-img:rounded-2xl prose-img:shadow-lg prose-img:border prose-img:my-10
                                               prose-p:leading-relaxed prose-p:mb-6
                                               prose-strong:text-primary prose-strong:font-bold
                                               prose-ul:list-disc prose-li:marker:text-accent"
                                    dangerouslySetInnerHTML={{
                                        __html: product.description || `
                                            <div class="space-y-4">
                                                <p>This premium quality item is sourced directly from our verified global suppliers to ensure you get the best value and performance.</p>
                                                <ul>
                                                    <li>Hand-selected for quality and durability</li>
                                                    <li>Authentic design and craftsmanship</li>
                                                    <li>Perfect for everyday use and professional results</li>
                                                </ul>
                                            </div>
                                        `
                                    }}
                                />
                            </div>

                            {/* Sidebar Quick Info */}
                            <div className="lg:w-80 space-y-6">
                                <div className="bg-primary text-white rounded-3xl p-6 shadow-xl space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <ShieldCheck className="h-6 w-6 text-accent" />
                                        <h4 className="font-black uppercase tracking-tight">Buyer Protection</h4>
                                    </div>
                                    <ul className="text-sm space-y-3 text-primary-foreground/90">
                                        <li className="flex items-start space-x-2">
                                            <Check className="h-4 w-4 mt-0.5 text-accent" />
                                            <span><strong>Full Refund</strong> if you don&apos;t receive your order.</span>
                                        </li>
                                        <li className="flex items-start space-x-2">
                                            <Check className="h-4 w-4 mt-0.5 text-accent" />
                                            <span><strong>7-Day Returns</strong> if item is not as described.</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
                                    <h4 className="font-black uppercase tracking-tight text-primary">Why NairobiMart?</h4>
                                    <div className="space-y-4">
                                        {[
                                            { icon: Truck, title: "Global Sourcing", desc: "Straight from factory" },
                                            { icon: Star, title: "Quality Check", desc: "Verified suppliers only" },
                                            { icon: RefreshCcw, title: "Easy Support", desc: "24/7 Local assistance" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center space-x-3">
                                                <div className="p-2 bg-accent/5 rounded-lg">
                                                    <item.icon className="h-5 w-5 text-accent" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-primary uppercase">{item.title}</p>
                                                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="specs" className="py-12">
                        <div className="bg-white rounded-3xl p-8 md:p-12 border shadow-sm">
                            <h3 className="text-2xl font-black text-primary mb-8 uppercase tracking-tight flex items-center">
                                Technical Specifications
                                <span className="ml-3 h-1.5 w-1.5 rounded-full bg-accent" />
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-muted border rounded-2xl overflow-hidden">
                                {(() => {
                                    const defaultSpecs = [
                                        { label: "Material", value: "Premium Grade Material" },
                                        { label: "Category", value: product.category?.name || "General" },
                                        { label: "Condition", value: "New" },
                                        { label: "Shipping", value: "Global Express" },
                                        { label: "Weight", value: "Standard Weight" },
                                        { label: "Authenticity", value: "100% Genuine" },
                                        { label: "Quality Check", value: "Verified by NairobiMart" },
                                        { label: "Warranty", value: "Standard Warranty Applies" }
                                    ];

                                    let dynamicSpecs: { label: string, value: string }[] = [];
                                    if (product.attributes) {
                                        if (Array.isArray(product.attributes)) {
                                            dynamicSpecs = (product.attributes as Record<string, unknown>[]).map((attr) => ({
                                                label: (attr.name || attr.label || "Feature") as string,
                                                value: (attr.value || attr.text || "Yes") as string
                                            }));
                                        } else if (typeof product.attributes === 'object') {
                                            dynamicSpecs = Object.entries(product.attributes).map(([key, value]) => ({
                                                label: key.replace(/([A-Z])/g, ' $1').trim(),
                                                value: String(value)
                                            }));
                                        }
                                    }

                                    const allSpecs = dynamicSpecs.length > 0 ? dynamicSpecs : defaultSpecs;

                                    return allSpecs.map((spec, i) => (
                                        <div key={i} className="flex items-center justify-between p-6 bg-white hover:bg-muted/5 transition-colors group">
                                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{spec.label}</span>
                                            <span className="text-sm font-black text-primary">{spec.value}</span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="reviews" className="py-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
                            <div className="space-y-4">
                                <h4 className="text-xl font-black text-primary uppercase tracking-tight">Customer Reviews</h4>
                                <div className="flex items-center space-x-4">
                                    <div className="text-5xl font-black text-primary">0.0</div>
                                    <div>
                                        <div className="flex items-center">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className="h-4 w-4 fill-muted text-muted" />
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground font-bold uppercase mt-1">0 Verified reviews</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {[5, 4, 3, 2, 1].map((star) => (
                                    <div key={star} className="flex items-center space-x-3">
                                        <span className="text-xs font-bold w-4">{star}</span>
                                        <Star className="h-3 w-3 fill-muted text-muted" />
                                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-accent w-0" />
                                        </div>
                                        <span className="text-xs text-muted-foreground w-4">0</span>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center space-y-4">
                                <p className="text-sm text-muted-foreground font-medium italic">Have you used this product?</p>
                                <Button className="bg-primary hover:bg-primary/95 text-white font-black px-10 h-14 rounded-full uppercase tracking-widest text-xs shadow-lg shadow-primary/20">Write a Review</Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Related Products */}
            <div className="mt-24 space-y-12">
                <div className="flex items-end justify-between border-b-2 pb-6 border-primary/5">
                    <div>
                        <h2 className="text-4xl font-black text-primary tracking-tighter uppercase">You Might Like</h2>
                        <p className="text-muted-foreground mt-2">Selected items for you</p>
                    </div>
                    <Link href="/products" className="text-accent font-black text-sm uppercase tracking-widest hover:underline flex items-center">
                        View All <Plus className="ml-2 h-4 w-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {relatedProducts.map((p) => (
                        <ProductCard key={p.id} product={{
                            id: p.id,
                            name: p.name,
                            slug: p.slug,
                            price: p.price,
                            comparePrice: p.comparePrice || undefined,
                            image: p.images?.[0]?.url || "/images/placeholder.jpg",
                            category: p.category?.name || "Uncategorized",
                            rating: 4.5
                        }} />
                    ))}
                </div>
            </div>
        </div>
    );
}
