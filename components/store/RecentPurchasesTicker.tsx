"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";

interface RecentPurchase {
    name: string;
    location: string;
    product: string;
    timeAgo: string;
}

const apiUrl = "/api/recent-purchases";

export default function RecentPurchasesTicker() {
    const [purchases, setPurchases] = useState<RecentPurchase[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const mounted = useRef(false);

    useEffect(() => {
        const fetchPurchases = async () => {
            try {
                const res = await fetch(apiUrl);
                if (!res.ok) return;
                const data = await res.json();
                if (data?.purchases?.length) {
                    setPurchases(data.purchases);
                }
            } catch (error) {
                console.error("Failed to fetch recent purchases", error);
            }
        };

        fetchPurchases();
    }, []);

    useEffect(() => {
        if (purchases.length === 0) return;
        if (!mounted.current) {
            mounted.current = true;
            return;
        }

        const interval = window.setInterval(() => {
            setCurrentIndex((prev) => (purchases.length === 0 ? 0 : (prev + 1) % purchases.length));
        }, 6000);

        return () => window.clearInterval(interval);
    }, [purchases]);

    const currentPurchase = useMemo(() => {
        if (purchases.length === 0) return null;
        return purchases[currentIndex % purchases.length];
    }, [currentIndex, purchases]);

    if (!currentPurchase) {
        return null;
    }

    return (
        <div className="relative mx-auto mt-6 w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/95 px-5 py-4 shadow-2xl shadow-slate-950/20 backdrop-blur-xl sm:px-6 lg:mt-8">
            <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-accent to-sky-500 opacity-80" />
            <div className="relative grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex items-center gap-4 text-sm text-slate-100 sm:text-base">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-white/10 text-accent shadow-lg shadow-accent/10">
                        <ShoppingBag className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 space-y-1">
                        <p className="truncate text-base font-semibold text-white sm:text-lg">
                            <span className="text-accent">{currentPurchase.name}</span> in {currentPurchase.location} just bought <span className="font-semibold text-white">{currentPurchase.product}</span>
                        </p>
                        <p className="truncate text-xs text-slate-400">{currentPurchase.timeAgo}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 sm:text-sm">
                        Live sales <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-slate-950">{purchases.length}</span>
                    </span>
                    <a href="/products" className="inline-flex items-center gap-1 text-sm font-semibold text-white transition hover:text-accent">
                        Shop trending <ArrowRight className="h-4 w-4" />
                    </a>
                </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.22em] text-slate-300 sm:text-sm">
                <div className="animate-marquee whitespace-nowrap text-slate-100">
                    {purchases.map((purchase, index) => (
                        <span key={`${purchase.name}-${index}`} className="mr-8 inline-block">
                            {purchase.name} in {purchase.location} • {purchase.product} • {purchase.timeAgo}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
