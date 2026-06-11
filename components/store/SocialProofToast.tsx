"use client";

import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag } from "lucide-react";

interface PurchaseData {
    name: string;
    location: string;
    product: string;
    timeAgo: string;
}

export default function SocialProofToast() {
    const { toast } = useToast();
    const [purchases, setPurchases] = useState<PurchaseData[]>([]);
    const currentIndex = useRef(0);

    // Fetch actual recent orders from the database
    useEffect(() => {
        const fetchPurchases = async () => {
            try {
                const res = await fetch('/api/recent-purchases');
                if (res.ok) {
                    const data = await res.json();
                    if (data.purchases && data.purchases.length > 0) {
                        setPurchases(data.purchases);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch recent purchases", error);
            }
        };

        fetchPurchases();
    }, []);

    useEffect(() => {
        // Only start the toast intervals if we have data
        if (purchases.length === 0) return;

        const triggerToast = () => {
            const purchase = purchases[currentIndex.current];
            
            toast({
                duration: 5000,
                className: "bg-white border border-primary/10 shadow-xl rounded-2xl p-4 flex gap-4 items-center fixed bottom-24 right-4 md:bottom-8 md:right-8 w-auto max-w-sm z-50 animate-in slide-in-from-bottom-5",
                description: (
                    <div className="flex items-center gap-4">
                        <div className="bg-accent/10 p-3 rounded-full shrink-0">
                            <ShoppingBag className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-primary">
                                {purchase.name} in {purchase.location}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Purchased <span className="font-semibold text-primary/80">{purchase.product}</span> {purchase.timeAgo}
                            </p>
                        </div>
                    </div>
                ),
            });

            // Move to the next purchase for the next popup, looping back to the start if at the end
            currentIndex.current = (currentIndex.current + 1) % purchases.length;
        };

        // Initial delay before first toast (e.g., 10 seconds)
        const initialDelay = setTimeout(() => {
            triggerToast();
        }, 10000);

        // Then set an interval to trigger toasts periodically (e.g., every 45 seconds)
        const interval = setInterval(() => {
            triggerToast();
        }, 45000);

        return () => {
            clearTimeout(initialDelay);
            clearInterval(interval);
        };
    }, [toast, purchases]);

    return null; // This component just mounts the side effects
}
