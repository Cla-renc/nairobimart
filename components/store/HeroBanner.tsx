"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";

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
        title: "Fast Nairobi delivery, trusted products, secure payments",
        subtitle: "Shop with confidence: verified vendors, M-Pesa and card checkout, plus fast local delivery updates.",
        imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=2070&auto=format&fit=crop",
        linkUrl: "/products",
    },
    {
        id: "2",
        title: "Kenya’s smartest online store for everyday essentials",
        subtitle: "Local delivery you can rely on, clear pricing, and secure checkout for every order.",
        imageUrl: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=2070&auto=format&fit=crop",
        linkUrl: "/categories",
    },
];

const TRUST_BADGES = [
    "Verified vendors",
    "Secure checkout",
    "Pay on delivery",
    "30-day returns",
];

interface HeroBannerProps {
    banners?: Banner[];
    recentPurchasesLastHour?: number;
}

const HeroBanner = ({ banners = [], recentPurchasesLastHour }: HeroBannerProps) => {
    const [current, setCurrent] = useState(0);
    const [flash, setFlash] = useState(false);
    const prevCount = useRef<number | undefined>(undefined);
    const displayBanners = banners.length > 0 ? banners : fallbackBanners;

    useEffect(() => {
        if (displayBanners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev === displayBanners.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(timer);
    }, [displayBanners.length]);

    useEffect(() => {
        if (typeof recentPurchasesLastHour !== 'number') return;
        // trigger a brief color-flash animation when the count changes
        if (prevCount.current === undefined) {
            prevCount.current = recentPurchasesLastHour;
            return;
        }
        if (prevCount.current !== recentPurchasesLastHour) {
            setFlash(true);
            const t = setTimeout(() => setFlash(false), 700);
            prevCount.current = recentPurchasesLastHour;
            return () => clearTimeout(t);
        }
    }, [recentPurchasesLastHour]);

    if (displayBanners.length === 0) return null;

    function BannerSlide({ banner, isActive, index }: { banner: Banner; isActive: boolean; index: number }) {
        const badgeClass = flash ? 'bg-white text-accent' : 'bg-accent text-slate-900';
        const containerClass = isActive ? 'opacity-100 transition-opacity duration-1000 ease-in-out' : 'opacity-0 transition-opacity duration-1000 ease-in-out pointer-events-none';

        return (
            <div key={banner.id} className={`absolute inset-0 ${containerClass}`}>
                <Image
                    src={banner.imageUrl}
                    alt={banner.title || 'Banner'}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority={index === 0}
                />
                <div className="absolute inset-0 bg-black/40" />

                <div className="container relative h-full flex flex-col justify-center px-4 md:px-8 text-white">
                    <div className="max-w-2xl space-y-4 md:space-y-6">
                        {banner.title ? (
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-md">
                                {banner.title}
                            </h1>
                        ) : null}

                        {banner.subtitle ? (
                            <p className="text-lg md:text-xl text-white/90 font-medium drop-shadow-md">
                                {banner.subtitle}
                            </p>
                        ) : null}

                        <div className="pt-4">
                            <Link href={banner.linkUrl || '/products'}>
                                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 font-bold">
                                    Shop Now
                                </Button>
                            </Link>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-2 max-w-xl">
                            {typeof recentPurchasesLastHour === 'number' && recentPurchasesLastHour > 0 ? (
                                <div className="mt-4">
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold transition-colors duration-700 ${badgeClass}`}>
                                        {recentPurchasesLastHour.toLocaleString()} purchases in the last hour
                                    </span>
                                </div>
                            ) : null}

                            <div className="mt-6 grid grid-cols-2 gap-2 max-w-xl">
                                {TRUST_BADGES.map((badge) => (
                                    <span
                                        key={badge}
                                        className="inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90"
                                    >
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full overflow-hidden">
            {displayBanners.map((banner, index) => (
                <BannerSlide banner={banner} isActive={index === current} index={index} key={banner.id} />
            ))}

            {displayBanners.length > 1 ? (
                <>
                    <button
                        onClick={() => setCurrent(current === 0 ? displayBanners.length - 1 : current - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors z-20"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>

                    <button
                        onClick={() => setCurrent(current === displayBanners.length - 1 ? 0 : current + 1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors z-20"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                        {displayBanners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrent(index)}
                                className={index === current ? 'h-2.5 w-2.5 rounded-full bg-accent' : 'h-2.5 w-2.5 rounded-full bg-white/40'}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default HeroBanner;
