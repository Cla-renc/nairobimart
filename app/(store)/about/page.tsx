"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Globe, ShieldCheck, Heart } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative h-[400px] flex items-center justify-center overflow-hidden bg-primary">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
                </div>
                <div className="container relative z-10 px-4 text-center space-y-4">
                    <Badge className="bg-accent text-accent-foreground px-4 py-1.5 text-sm font-bold tracking-widest uppercase">
                        Our Mission
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">
                        Shop Smart. <span className="text-accent">Shop Kenya.</span>
                    </h1>
                    <p className="max-w-xl mx-auto text-white/80 text-lg leading-relaxed">
                        NairobiMart is Kenya's premier e-commerce platform, bridging the gap between global quality and local convenience.
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-24">
                <div className="container px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <h2 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">
                                Why we built <br /><span className="text-accent">NairobiMart</span>
                            </h2>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                Founded in 2026, NairobiMart was born from a simple observation: Kenyan shoppers deserve access to the world's best products without the complexity of international shipping, taxes, and hidden fees.
                            </p>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                We've built a robust supply chain that connects you directly to global fulfillment centers, ensuring every item we sell is authentic, high-quality, and delivered right to your doorstep in Nairobi and across Kenya.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-8 bg-muted/30 rounded-3xl border border-white shadow-sm space-y-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-accent">
                                    <ShoppingBag className="h-6 w-6" />
                                </div>
                                <h3 className="font-bold text-primary">Curated Catalog</h3>
                                <p className="text-xs text-muted-foreground">Every product is handpicked for quality and value.</p>
                            </div>
                            <div className="p-8 bg-muted/30 rounded-3xl border border-white shadow-sm space-y-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-accent">
                                    <Globe className="h-6 w-6" />
                                </div>
                                <h3 className="font-bold text-primary">Global Reach</h3>
                                <p className="text-xs text-muted-foreground">Connecting Kenyan shoppers to global trends.</p>
                            </div>
                            <div className="p-8 bg-muted/30 rounded-3xl border border-white shadow-sm space-y-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-accent">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <h3 className="font-bold text-primary">Secure Payments</h3>
                                <p className="text-xs text-muted-foreground">Safe transactions via M-Pesa and card.</p>
                            </div>
                            <div className="p-8 bg-muted/30 rounded-3xl border border-white shadow-sm space-y-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-accent">
                                    <Heart className="h-6 w-6" />
                                </div>
                                <h3 className="font-bold text-primary">Local Support</h3>
                                <p className="text-xs text-muted-foreground">Dedicated customer care team based in Nairobi.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team/Values Section */}
            <section className="py-24 bg-primary text-white">
                <div className="container px-4 text-center space-y-12">
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black tracking-tighter uppercase">Our Core Values</h2>
                        <div className="h-1 w-20 bg-accent mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold uppercase text-accent">Transparency</h3>
                            <p className="text-white/70">No hidden fees. Full delivery tracking. Clear pricing in KES.</p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold uppercase text-accent">Quality</h3>
                            <p className="text-white/70">We only partner with top-rated suppliers and fulfillment centers.</p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold uppercase text-accent">Efficiency</h3>
                            <p className="text-white/70">Streamlined logistics to get your orders to you as fast as possible.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
