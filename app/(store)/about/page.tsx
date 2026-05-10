"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Globe, ShieldCheck, Heart } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative h-[400px] flex items-center justify-center overflow-hidden bg-primary">
                <Image
                    src="https://images.unsplash.com/photo-1524629968079-2c4992ff24f7?q=80&w=1600&auto=format&fit=crop"
                    alt="Nairobi marketplace and local shopping"
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority
                />
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
                        NairobiMart is Kenya&apos;s premier e-commerce platform, bridging the gap between global quality and local convenience.
                    </p>
                </div>
            </section>

            {/* Team Image Section */}
            <section className="py-12 bg-muted/10">
                <div className="container px-4">
                    <div className="rounded-[2rem] overflow-hidden shadow-2xl relative h-[420px] md:h-[520px]">
                        <Image
                            src="https://images.unsplash.com/photo-1524499982521-1ffd58dd89ea?q=80&w=1600&auto=format&fit=crop"
                            alt="NairobiMart support team"
                            fill
                            sizes="100vw"
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-black/45" />
                        <div className="absolute bottom-0 left-0 p-8 text-white">
                            <p className="text-sm uppercase tracking-[0.3em] text-accent">Customer care</p>
                            <h2 className="text-3xl md:text-4xl font-black">Here to help, even when your order ships from abroad.</h2>
                            <p className="mt-4 max-w-2xl text-white/80">
                                NairobiMart does not operate from a physical office. We support orders shipped directly from our trusted suppliers to your home and keep you informed from order placement to delivery.
                            </p>
                        </div>
                    </div>
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
                                NairobiMart began because I was frustrated seeing Nairobi shoppers wait weeks for imports, then get hit with hidden costs. I wanted a better way to share product access from trusted suppliers with straightforward pricing.
                            </p>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                We partner with trusted suppliers so orders ship directly to your doorstep, and we provide status updates until delivery is complete.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-8 bg-muted/30 rounded-3xl border border-white shadow-sm space-y-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-accent">
                                    <ShoppingBag className="h-6 w-6" />
                                </div>
                                <h3 className="font-bold text-primary">Curated Catalog</h3>
                                <p className="text-xs text-muted-foreground">Our catalog grew from customer stories in Nairobi — we only list products that arrive quickly, track reliably, and feel worth the wait.</p>
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
