import HeroBanner from "@/components/store/HeroBanner";
import ProductCard from "@/components/store/ProductCard";
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
    LucideIcon
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
    'Electronics': Smartphone,
    'Accessories': Watch,
    'Laptops': Laptop,
    'Fashion': Shirt,
    'Home': Home,
    'Gifts': Gift,
};

const COLOR_MAP: Record<string, string> = {
    'Electronics': "bg-blue-100 text-blue-600",
    'Accessories': "bg-purple-100 text-purple-600",
    'Laptops': "bg-orange-100 text-orange-600",
    'Fashion': "bg-pink-100 text-pink-600",
    'Home': "bg-green-100 text-green-600",
    'Gifts': "bg-yellow-100 text-yellow-600",
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
        href: `/products?category=${cat.slug}`,
        icon: ICON_MAP[cat.name] || Package,
        color: COLOR_MAP[cat.name] || "bg-gray-100 text-gray-600"
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

    return (
        <div className="flex flex-col min-h-screen">
            <HeroBanner banners={banners} />

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
                                <div className={`p-4 rounded-full ${category.color} group-hover:scale-110 transition-transform`}>
                                    <category.icon className="h-6 w-6" />
                                </div>
                                <span className="mt-4 font-semibold text-primary">{category.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

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
