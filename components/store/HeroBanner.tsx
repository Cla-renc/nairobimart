"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface Banner {
    id: string;
    title: string | null;
    subtitle: string | null;
    imageUrl: string;
    linkUrl: string | null;
}

const fallbackBanners = [
    {
        id: "1",
        title: "Nairobi’s Best Tech Finds",
        subtitle: "Products ship directly from trusted suppliers to your door with clear pricing and delivery updates.",
        imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=2070&auto=format&fit=crop",
        linkUrl: "/products",
    },
    {
        id: "2",
        title: "Everyday Essentials for Kenyan Homes",
        subtitle: "We source the product and ship it directly to you — no office, no hidden handling fees.",
        imageUrl: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=2070&auto=format&fit=crop",
        linkUrl: "/categories",
    },
];

interface HeroBannerProps {
    banners?: Banner[];
}

const HeroBanner = ({ banners = [] }: HeroBannerProps) => {
    const [current, setCurrent] = useState(0);
    const displayBanners = banners.length > 0 ? banners : fallbackBanners;

    useEffect(() => {
        if (displayBanners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev === displayBanners.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(timer);
    }, [displayBanners.length]);

    if (displayBanners.length === 0) return null;

    return (
        <div className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full overflow-hidden">
            {displayBanners.map((banner, index) => (
                <div
                    key={banner.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? "opacity-100" : "opacity-0"
                        }`}
                >
                    <Image
                        src={banner.imageUrl}
                        alt={banner.title || "Banner"}
                        fill
                        sizes="100vw"
                        className="object-cover"
                        priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-black/40" />

                    <div className="container relative h-full flex flex-col justify-center px-4 md:px-8 text-white">
                        <div className="max-w-2xl space-y-4 md:space-y-6">
                            {banner.title && (
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-md">
                                    {banner.title}
                                </h1>
                            )}
                            {banner.subtitle && (
                                <p className="text-lg md:text-xl text-white/90 font-medium drop-shadow-md">
                                    {banner.subtitle}
                                </p>
                            )}
                            <div className="pt-4">
                                <Link href={banner.linkUrl || "/products"}>
                                    <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 font-bold">
                                        Shop Now
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {displayBanners.length > 1 && (
                <>
                    {/* Navigation Arrows */}
                    <button
                        onClick={() => setCurrent(current === 0 ? displayBanners.length - 1 : current - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors z-20"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={() => setCurrent(current === displayBanners.length - 1 ? 0 : current + 1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors z-20"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                        {displayBanners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrent(index)}
                                className={`h-2.5 w-2.5 rounded-full transition-colors ${index === current ? "bg-accent" : "bg-white/40"
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default HeroBanner;
