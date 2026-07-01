import HeroBanner from "@/components/store/HeroBanner";
import ProductCard from "@/components/store/ProductCard";
import FlashSaleCountdown from "@/components/store/FlashSaleCountdown";
import RecommendedProducts from "@/components/store/RecommendedProducts";

export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
    Smartphone,
    Watch,
    Laptop,
    Shirt,
    Home,
    Gift,
    ArrowRight,
    ShoppingBag,
    Package,
    LucideIcon,
    Clock,
    Monitor,
    ChefHat,
    ShieldCheck,
    Car,
    Sparkles,
    BedDouble
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
    'Electronics': Smartphone,
    'Accessories': Watch,
    'Laptops': Laptop,
    'Fashion': Shirt,
    'Home': Home,
    'Gifts': Gift,
    'Electronics & Phone Accessories': Smartphone,
    'Computer & Office': Monitor,
    'Kitchen Gadgets': ChefHat,
    'Smart Home & Security': ShieldCheck,
    'Automotive Accessories': Car,
    'Fashion & Clothing': Shirt,
    'Beauty & Skincare': Sparkles,
    'Bedroom Essentials': BedDouble,
};

const COLOR_MAP: Record<string, string> = {
    'Electronics': "bg-blue-100 text-blue-600",
    'Accessories': "bg-purple-100 text-purple-600",
    'Laptops': "bg-orange-100 text-orange-600",
    'Fashion': "bg-pink-100 text-pink-600",
    'Home': "bg-green-100 text-green-600",
    'Gifts': "bg-yellow-100 text-yellow-600",
    'Electronics & Phone Accessories': "bg-blue-100 text-blue-600",
    'Computer & Office': "bg-indigo-100 text-indigo-600",
    'Kitchen Gadgets': "bg-orange-100 text-orange-600",
    'Smart Home & Security': "bg-green-100 text-green-600",
    'Automotive Accessories': "bg-slate-100 text-slate-600",
    'Fashion & Clothing': "bg-pink-100 text-pink-600",
    'Beauty & Skincare': "bg-rose-100 text-rose-600",
    'Bedroom Essentials': "bg-purple-100 text-purple-600",
};

import prisma from "@/lib/prisma";

export default async function HomePage() {
    const banners = await prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { position: 'asc' }
    });

    const categoriesDb = await prisma.category.findMany({
        where: { isActive: true },
        take: 6,
        orderBy: { position: 'asc' }
    });

    const liveCategories = categoriesDb.map(cat => ({
        name: cat.name,
        href: `/products?category=${encodeURIComponent(cat.slug)}`,
        icon: ICON_MAP[cat.name] || Package,
        color: COLOR_MAP[cat.name] || "bg-gray-100 text-gray-600",
        imageUrl: cat.imageUrl
    }));

    // Fetch featured products first
    let productsInDb = await prisma.product.findMany({
        where: { isFeatured: true, isActive: true },
        take: 4,
        include: {
            images: true,
            category: true,
        },
        orderBy: { createdAt: 'desc' }
    });

    // Fallback to latest products if none are marked featured
    if (productsInDb.length === 0) {
        productsInDb = await prisma.product.findMany({
            where: { isActive: true },
            take: 4,
            include: {
                images: true,
                category: true,
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    const featuredProducts = productsInDb.map(p => ({
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
    }));

    // Fetch flash sale products
    const now = new Date();
    const flashSaleProductsDb = await prisma.product.findMany({
        where: {
            isFlashSale: true,
            isActive: true,
            flashSaleEndsAt: {
                gt: now,
            },
        },
        take: 4,
        include: {
            images: true,
            category: true,
        },
        orderBy: { flashSaleEndsAt: 'asc' }
    });

    const flashSaleProducts = flashSaleProductsDb.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.flashSalePrice ?? p.price,
        comparePrice: p.price,
        image: p.images?.[0]?.url || "/images/placeholder.jpg",
        category: p.category?.name || "Uncategorized",
        rating: 4.5,
        isFeatured: p.isFeatured,
        isSale: true,
        flashSaleEndsAt: p.flashSaleEndsAt?.toISOString()
    }));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const ordersDelivered = await prisma.order.count({
        where: {
            status: "delivered",
            createdAt: { gte: sevenDaysAgo }
        }
    });

    const freeDeliverySetting = await prisma.siteSettings.findUnique({
        where: { key: "free_shipping_min" },
        select: { value: true }
    });

    const freeDeliveryThreshold = freeDeliverySetting ? Number(freeDeliverySetting.value) : 5000;
    const liveFlashDeals = flashSaleProducts.length;


    return (
        <div className="flex flex-col min-h-screen">
            <div className="relative">
                <HeroBanner banners={banners} />
            </div>

            <section className="bg-slate-950 text-white py-10">
                <div className="container px-4">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/20">
                            <p className="text-xs uppercase tracking-[0.24em] text-white/60">Local trust</p>
                            <h3 className="mt-4 text-3xl font-extrabold">{ordersDelivered.toLocaleString()}+ orders</h3>
                            <p className="mt-2 text-sm text-white/75">delivered this week to Nairobi and beyond.</p>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/20">
                            <p className="text-xs uppercase tracking-[0.24em] text-white/60">Fast delivery</p>
                            <h3 className="mt-4 text-3xl font-extrabold">Free over KES {freeDeliveryThreshold.toLocaleString()}</h3>
                            <p className="mt-2 text-sm text-white/75">Enjoy free delivery when you shop smart with NairobiMart.</p>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/20">
                            <p className="text-xs uppercase tracking-[0.24em] text-white/60">Flash sale</p>
                            <h3 className="mt-4 text-3xl font-extrabold">{liveFlashDeals > 0 ? `${liveFlashDeals} live deals` : "New deals daily"}</h3>
                            <p className="mt-2 text-sm text-white/75">{liveFlashDeals > 0 ? "Shop now before these offers end." : "Check back for the latest limited-time offers."}</p>
                        </div>
                    </div>
                    <div className="mt-8 flex flex-wrap items-center gap-3 justify-center text-sm text-white/90">
                        <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">Verified vendors</span>
                        <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">Secure checkout</span>
                        <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">Pay on delivery</span>
                        <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">30-day returns</span>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-12 bg-muted/30">
                <div className="container px-4">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-primary">Shop by Category</h2>
                        <Link href="/categories" className="text-sm font-medium text-accent hover:underline flex items-center">
                            View All <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {liveCategories.map((category) => (
                            <Link
                                key={category.name}
                                href={category.href}
                                className="group flex flex-col items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md hover:bg-muted/50 transition-all duration-300"
                            >
                                <div className={`relative w-20 h-20 rounded-full flex items-center justify-center overflow-hidden ${category.imageUrl ? 'bg-transparent' : category.color} group-hover:scale-110 transition-transform`}>
                                    {category.imageUrl ? (
                                        <Image src={category.imageUrl} alt={category.name} fill className="object-cover" sizes="(max-width: 768px) 80px, 80px" />
                                    ) : (
                                        <category.icon className="h-8 w-8" />
                                    )}
                                </div>
                                <span className="mt-4 font-semibold text-primary text-center leading-tight">{category.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Flash Sales Section */}
            {flashSaleProducts.length > 0 && (
                <section className="py-12 bg-red-50/50">
                    <div className="container px-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-3xl font-extrabold text-red-600 flex items-center">
                                    <Clock className="mr-2 h-8 w-8" /> Flash Sales
                                </h2>
                                {flashSaleProducts[0].flashSaleEndsAt && (
                                    <FlashSaleCountdown endsAt={flashSaleProducts[0].flashSaleEndsAt} />
                                )}
                            </div>
                            <Link href="/products?filter=flash_sale">
                                <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
                                    View All Deals
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {flashSaleProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Featured Products Section */}
            <section className="py-16">
                <div className="container px-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-extrabold text-primary">Featured Products</h2>
                            <p className="text-muted-foreground">I started NairobiMart because Nairobi needed faster, clearer access to the products we actually want.</p>
                        </div>
                        <Link href="/products?filter=featured" className="mt-4 md:mt-0">
                            <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                                Shop the Collection
                            </Button>
                        </Link>
                    </div>
                    <div className={featuredProducts.length > 0 ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" : "flex flex-col items-center justify-center py-12 text-center"}>
                        {featuredProducts.length > 0 ? (
                            featuredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))
                        ) : (
                            <div className="space-y-4">
                                <ShoppingBag className="h-12 w-12 text-muted-foreground opacity-20 mx-auto" />
                                <p className="text-muted-foreground font-medium">No featured products available at the moment.</p>
                                <Button variant="outline" asChild className="border-accent text-accent mt-2">
                                    <Link href="/products">Check All Products</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* AI Recommendations */}
            <RecommendedProducts />

            {/* Promotional Section */}
            <section className="py-12">
                <div className="container px-4">
                    <div className="bg-primary rounded-3xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-transparent opacity-90" />
                        <div className="relative z-10 px-8 py-16 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="max-w-xl text-center md:text-left space-y-4">
                                <Badge className="bg-accent text-accent-foreground font-bold mb-2">LIMITED TIME OFFER</Badge>
                                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Flash Sale is Live!</h2>
                                <p className="text-white/80 text-lg">
                                    Orders ship directly from trusted suppliers and arrive to Nairobi customers with clear delivery updates via WhatsApp and SMS.
                                </p>
                                <div className="pt-4 flex flex-wrap justify-center md:justify-start gap-4">
                                    <Link href="/products?filter=sale">
                                        <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8">
                                            Explore Sale
                                        </Button>
                                    </Link>
                                    <Link href="/about">
                                        <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 font-bold px-8">
                                            Learn More
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            <div className="hidden lg:block relative w-80 h-80 rounded-full overflow-hidden shadow-2xl">
                                <Image
                                    src="https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=1200&auto=format&fit=crop"
                                    alt="Flash sale on electronics"
                                    fill
                                    sizes="(max-width: 1024px) 50vw, 20vw"
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Customer Stories */}
            <section className="py-16 bg-muted/5">
                <div className="container px-4">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10">
                        <div className="max-w-2xl">
                            <p className="text-sm uppercase tracking-[0.35em] text-accent font-bold">Customer Stories</p>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-primary">Real experiences from Nairobi shoppers.</h2>
                        </div>
                        <p className="max-w-xl text-muted-foreground">
                            We built NairobiMart so customers in Nairobi could buy quality imports without the wait. Products ship directly from trusted suppliers, and we provide order updates until your package arrives.
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="rounded-3xl border border-primary/10 bg-white p-8 shadow-sm">
                            <p className="text-lg text-primary font-semibold">
                                “My headphones arrived in 3 days and the team kept me updated the whole way. NairobiMart made it simple.”
                            </p>
                            <p className="mt-6 text-sm text-muted-foreground">Wanjiku M., Westlands</p>
                        </div>
                        <div className="rounded-3xl border border-primary/10 bg-white p-8 shadow-sm">
                            <p className="text-lg text-primary font-semibold">
                                “Ordered Monday, delivered Thursday to Karen. The price was clear and there were no surprise customs charges.”
                            </p>
                            <p className="mt-6 text-sm text-muted-foreground">James K., Karen</p>
                        </div>
                        <div className="rounded-3xl border border-primary/10 bg-white p-8 shadow-sm">
                            <p className="text-lg text-primary font-semibold">
                                “I bought a kitchen gadget and it arrived faster than any other import shop. Support answered every question right away.”
                            </p>
                            <p className="mt-6 text-sm text-muted-foreground">Amina N., Kilimani</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
