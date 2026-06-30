"use client";

import { useState, useEffect } from "react";
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
    Check,
    Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import ProductCard from "@/components/store/ProductCard";
import { Separator } from "@/components/ui/separator";
import WriteReviewButton from "@/components/store/WriteReviewButton";
import { useCurrency } from "@/hooks/useCurrency";

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
    slug: string;
    price: number;
    comparePrice?: number | null;
    description?: string | null;
    attributes?: Record<string, unknown> | Record<string, unknown>[] | null;
    images: ProductImage[];
    variants: ProductVariant[];
    category?: { name: string } | null;
    isFeatured?: boolean;
}

interface Review {
    id: string;
    rating: number;
    title: string | null;
    body: string;
    videoUrl: string | null;
    createdAt: string;
    user: {
        name: string | null;
        image: string | null;
    };
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
    relatedProducts,
    frequentlyBought = [],
    reviews = []
}: {
    product: ProductDetail,
    relatedProducts: RelatedProduct[],
    frequentlyBought?: RelatedProduct[],
    reviews?: Review[]
}) {
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.id || "");
    const [quantity, setQuantity] = useState(1);
    const [liveViewers, setLiveViewers] = useState(0);
    const { formatPrice } = useCurrency();
    const addItem = useCartStore((state) => state.addItem);

    useEffect(() => {
        // Generate random live viewers to build urgency
        setLiveViewers(Math.floor(Math.random() * 34) + 12);
    }, []);

    useEffect(() => {
        if (!product?.id) return;
        // Fire and forget
        fetch('/api/user/recently-viewed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product.id })
        }).catch(err => console.error("Failed to log product view", err));
    }, [product?.id]);

    const images = product.images?.length > 0
        ? product.images.map((img) => img.url)
        : ["/images/placeholder.jpg"];

    const handleAddToCart = () => {
        addItem({
            id: `${product.id}-${selectedVariantId || 'default'}`,
            productId: product.id,
            variantId: selectedVariantId || undefined,
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
                        {liveViewers > 0 && (
                            <div className="flex items-center space-x-2 text-red-600 bg-red-50 w-fit px-3 py-1.5 rounded-full animate-pulse border border-red-100 mt-2">
                                <Flame className="h-4 w-4" />
                                <span className="text-xs font-bold">{liveViewers} people are looking at this right now</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-baseline space-x-3 flex-wrap gap-y-2">
                        <span className="text-4xl font-bold text-primary">{formatPrice(product.price)}</span>
                        {product.comparePrice && (
                            <>
                                <span className="text-xl text-muted-foreground line-through">{formatPrice(product.comparePrice)}</span>
                                <Badge className="bg-red-500 text-white border-none font-bold italic">SAVE {savings}%</Badge>
                            </>
                        )}
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-auto">
                            Lipa Mdogo Mdogo Available
                        </Badge>
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
                                        onClick={() => setSelectedVariantId(variant.id)}
                                        className={`px-5 py-2.5 rounded-full border-2 text-sm font-bold transition-all ${selectedVariantId === variant.id
                                            ? "border-accent bg-accent/5 text-accent shadow-md"
                                            : "border-muted bg-white text-muted-foreground hover:border-accent/50"
                                            }`}
                                    >
                                        {selectedVariantId === variant.id && <Check className="inline-block mr-2 h-4 w-4" />}
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

                    {/* WhatsApp Order Button */}
                    <a
                        href={`https://wa.me/254741206995?text=${encodeURIComponent(
                            `🛒 *ORDER REQUEST*\nProduct: ${product.name}\nProduct ID: ${product.id}\nVariant: ${selectedVariantId || 'Standard'}\nPrice: KES ${product.price.toLocaleString()}\nQuantity: ${quantity}\nFlash Sale: ${false}\n\nProduct Link: ${(process.env.NEXT_PUBLIC_URL || 'https://nairobimart-gwna.vercel.app')}/products/${product.slug}?ref=wa2\n\nI am interested in ordering this item via WhatsApp.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#1ebe57] text-white h-14 text-base font-black rounded-full shadow-lg shadow-green-500/20 transition-all hover:-translate-y-1 active:scale-95 px-8"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 flex-shrink-0">
                            <path d="M12.031 0C5.385 0 0 5.388 0 12.033c0 2.126.554 4.195 1.61 6.01L.224 23.4l5.495-1.442a12.012 12.012 0 0 0 6.312 1.782h.005c6.645 0 12.032-5.388 12.032-12.032C24.067 5.388 18.675 0 12.031 0zm.005 21.722h-.003a10.026 10.026 0 0 1-5.111-1.393l-.367-.217-3.799.997 1.018-3.702-.238-.378a9.988 9.988 0 0 1-1.528-5.26C1.984 6.273 6.471 1.788 12.036 1.788c5.566 0 10.05 4.484 10.05 10.052s-4.484 10.052-10.05 10.052zm5.518-7.534c-.302-.152-1.792-.885-2.07-.988-.278-.103-.48-.152-.682.152-.202.304-.783.988-.96 1.19-.177.202-.353.228-.656.076-.303-.152-1.28-.472-2.439-1.506-.902-.806-1.51-1.802-1.687-2.106-.177-.304-.019-.468.132-.619.136-.136.303-.354.455-.53.152-.178.202-.304.303-.507.101-.202.05-.38-.025-.531-.076-.152-.682-1.644-.934-2.253-.245-.591-.495-.51-.682-.519-.177-.008-.38-.01-.582-.01-.202 0-.53.076-.808.38-.278.303-1.06 1.037-1.06 2.53s1.086 2.934 1.237 3.136c.152.202 2.137 3.262 5.176 4.57 1.666.719 2.532.793 3.393.754.67-.03 2.07-.846 2.361-1.664.29-.818.29-1.519.202-1.665-.088-.147-.302-.236-.604-.388z"/>
                        </svg>
                        ORDER VIA WHATSAPP
                    </a>

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

            {/* Accordion Style Details */}
            <div className="mt-20 space-y-4">
                <details className="group border rounded-2xl bg-white shadow-sm overflow-hidden" open>
                    <summary className="flex cursor-pointer items-center justify-between p-6 bg-muted/40 font-black uppercase tracking-widest text-primary hover:bg-muted/60 transition-colors list-none [&::-webkit-details-marker]:hidden">
                        Description
                        <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="p-8 md:p-12 border-t">
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
                                        __html: (product.description && product.description.length > 50) ? product.description : `
                                            <div class="space-y-6">
                                                <div class="p-6 bg-accent/5 rounded-2xl border border-accent/10">
                                                    <p class="font-bold text-accent uppercase tracking-widest text-xs mb-2">Premium Product Note</p>
                                                    <p class="text-sm">This high-quality item is sourced directly from our verified global fulfillment centers to ensure you receive the best value and craftsmanship available on the market.</p>
                                                </div>
                                                <p>Experience superior performance and design with this carefully selected product. Whether you're looking for durability, style, or functionality, this item is engineered to exceed expectations.</p>
                                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                                    <div class="flex items-center space-x-3 p-4 bg-muted/20 rounded-xl">
                                                        <div class="h-2 w-2 rounded-full bg-accent"></div>
                                                        <span class="text-sm font-bold">Factory Direct Quality</span>
                                                    </div>
                                                    <div class="flex items-center space-x-3 p-4 bg-muted/20 rounded-xl">
                                                        <div class="h-2 w-2 rounded-full bg-accent"></div>
                                                        <span class="text-sm font-bold">Global Safety Standards</span>
                                                    </div>
                                                    <div class="flex items-center space-x-3 p-4 bg-muted/20 rounded-xl">
                                                        <div class="h-2 w-2 rounded-full bg-accent"></div>
                                                        <span class="text-sm font-bold">Eco-Friendly Materials</span>
                                                    </div>
                                                    <div class="flex items-center space-x-3 p-4 bg-muted/20 rounded-xl">
                                                        <div class="h-2 w-2 rounded-full bg-accent"></div>
                                                        <span class="text-sm font-bold">Precision Engineered</span>
                                                    </div>
                                                </div>
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
                    </div>
                </details>

                <details className="group border rounded-2xl bg-white shadow-sm overflow-hidden">
                    <summary className="flex cursor-pointer items-center justify-between p-6 bg-muted/40 font-black uppercase tracking-widest text-primary hover:bg-muted/60 transition-colors list-none [&::-webkit-details-marker]:hidden">
                        Specifications
                        <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="p-8 md:p-12 border-t">
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
                    </div>
                </details>

                <details className="group border rounded-2xl bg-white shadow-sm overflow-hidden">
                    <summary className="flex cursor-pointer items-center justify-between p-6 bg-muted/40 font-black uppercase tracking-widest text-primary hover:bg-muted/60 transition-colors list-none [&::-webkit-details-marker]:hidden">
                        Reviews ({reviews.length})
                        <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="p-8 md:p-12 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
                            <div className="space-y-4 sticky top-24">
                                <h4 className="text-xl font-black text-primary uppercase tracking-tight">Customer Reviews</h4>
                                <div className="flex items-center space-x-4">
                                    <div className="text-5xl font-black text-primary">
                                        {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0"}
                                    </div>
                                    <div>
                                        <div className="flex items-center">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={`h-4 w-4 ${i < (reviews.length > 0 ? Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0) ? "fill-accent text-accent" : "fill-muted text-muted"}`} />
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground font-bold uppercase mt-1">{reviews.length} Verified reviews</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 pt-4">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = reviews.filter(r => r.rating === star).length;
                                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                                        return (
                                            <div key={star} className="flex items-center space-x-3">
                                                <span className="text-xs font-bold w-4">{star}</span>
                                                <Star className="h-3 w-3 fill-accent text-accent" />
                                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div className={`h-full bg-accent`} style={{ width: `${percentage}%` }} />
                                                </div>
                                                <span className="text-xs text-muted-foreground w-4">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="pt-6 space-y-4">
                                    <p className="text-sm text-muted-foreground font-medium italic">Have you used this product?</p>
                                    <WriteReviewButton productId={product.id} productName={product.name} />
                                </div>
                            </div>
                            
                            <div className="md:col-span-2 space-y-8">
                                {reviews.length === 0 ? (
                                    <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed">
                                        <p className="text-muted-foreground font-medium">No reviews yet. Be the first to share your experience!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Video Reviews Feed */}
                                        {reviews.some(r => r.videoUrl) && (
                                            <div className="mb-8">
                                                <h5 className="font-bold text-primary mb-4 flex items-center">
                                                    <span className="h-2 w-2 rounded-full bg-red-500 mr-2 animate-pulse" />
                                                    Video Reviews
                                                </h5>
                                                <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
                                                    {reviews.filter(r => r.videoUrl).map((review) => (
                                                        <div key={`video-${review.id}`} className="min-w-[200px] w-[200px] aspect-[9/16] bg-black rounded-xl overflow-hidden relative snap-center shadow-md">
                                                            <video 
                                                                src={review.videoUrl!} 
                                                                className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                                                                controls
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Text Reviews */}
                                        {reviews.map((review) => (
                                            <div key={review.id} className="bg-white p-6 rounded-2xl border shadow-sm">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                            {review.user?.name?.charAt(0) || "U"}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm">{review.user?.name || "Verified Customer"}</p>
                                                            <div className="flex items-center mt-1">
                                                                {Array.from({ length: 5 }).map((_, i) => (
                                                                    <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-accent text-accent" : "fill-muted text-muted"}`} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                {review.title && <h5 className="font-bold text-primary mb-2">{review.title}</h5>}
                                                <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>
                                                {review.videoUrl && (
                                                    <div className="mt-4">
                                                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Includes Video</Badge>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </details>
            </div>

            {/* Frequently Bought Together */}
            {frequentlyBought.length > 0 && (
                <div className="mt-16 space-y-8 bg-muted/20 p-8 rounded-3xl border">
                    <div>
                        <h2 className="text-3xl font-black text-primary tracking-tighter uppercase">Frequently Bought Together</h2>
                        <p className="text-muted-foreground mt-2">Customers usually buy these items together</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {frequentlyBought.map((p) => (
                            <ProductCard key={p.id} product={{
                                id: p.id,
                                name: p.name,
                                slug: p.slug,
                                price: p.price,
                                comparePrice: p.comparePrice || undefined,
                                image: p.images?.[0]?.url || "/images/placeholder.jpg",
                                category: p.category?.name || "Uncategorized",
                                rating: 4.8
                            }} />
                        ))}
                    </div>
                </div>
            )}

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
