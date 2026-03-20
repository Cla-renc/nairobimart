"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

const banners = [
    {
        id: 1,
        title: "Modern Gadgets for Your Lifestyle",
        subtitle: "Up to 40% off on the latest tech accessories. Exclusive to NairobiMart.",
        image: "https://ae01.alicdn.com/kf/S92153d4a0c9842dd8781284199638c183.jpg",
        buttonText: "Shop Now",
        buttonLink: "/products",
        accent: "bg-accent",
    },
    {
        id: 2,
        title: "Fashion That Empowers You",
        subtitle: "Discover curated styles for the vibrant Kenyan spirit.",
        image: "https://ae01.alicdn.com/kf/S14b53d4a0c9842dd8781284199638c183.jpg",
        buttonText: "Explore Collection",
        buttonLink: "/categories",
        accent: "bg-primary",
    },
];

const HeroBanner = () => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full overflow-hidden">
            {banners.map((banner, index) => (
                <div
                    key={banner.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? "opacity-100" : "opacity-0"
                        }`}
                >
                    {/* Fallback pattern if image is missing */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/40" />

                    <div className="container relative h-full flex flex-col justify-center px-4 md:px-8 text-white">
                        <div className="max-w-2xl space-y-4 md:space-y-6">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
                                {banner.title}
                            </h1>
                            <p className="text-lg md:text-xl text-white/90 font-medium">
                                {banner.subtitle}
                            </p>
                            <div className="pt-4">
                                <Link href={banner.buttonLink}>
                                    <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8">
                                        {banner.buttonText}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Navigation Arrows */}
            <button
                onClick={() => setCurrent(current === 0 ? banners.length - 1 : current - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
            >
                <ChevronLeft className="h-6 w-6" />
            </button>
            <button
                onClick={() => setCurrent(current === banners.length - 1 ? 0 : current + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
            >
                <ChevronRight className="h-6 w-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrent(index)}
                        className={`h-2.5 w-2.5 rounded-full transition-colors ${index === current ? "bg-accent" : "bg-white/40"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroBanner;
