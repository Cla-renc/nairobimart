"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag } from "lucide-react";

const NAMES = ["James", "Wanjiku", "Kamau", "Amina", "Brian", "Faith", "Kevin", "Mercy", "John", "Sarah", "Ian", "Joy"];
const LOCATIONS = ["Westlands", "Kilimani", "Karen", "Roysambu", "Syokimau", "Ruaka", "Kileleshwa", "Lavington", "South B", "Thika", "Ngong", "Rongai"];
const TIMES = ["2 mins ago", "5 mins ago", "12 mins ago", "just now", "18 mins ago", "22 mins ago", "half an hour ago"];
const PRODUCTS = [
    "Wireless Noise-Cancelling Headphones",
    "Smart Fitness Watch",
    "Portable Power Bank 20000mAh",
    "Ergonomic Laptop Stand",
    "Bluetooth Speaker",
    "Mens Casual Sneakers",
    "Ceramic Coffee Mug Set",
    "LED Desk Lamp",
    "Leather Wallet"
];

export default function SocialProofToast() {
    const { toast } = useToast();

    useEffect(() => {
        // Initial delay before first toast (e.g., 10 seconds)
        const initialDelay = setTimeout(() => {
            triggerRandomToast();
        }, 10000);

        // Then set an interval to trigger toasts periodically (e.g., every 45 seconds)
        const interval = setInterval(() => {
            triggerRandomToast();
        }, 45000);

        return () => {
            clearTimeout(initialDelay);
            clearInterval(interval);
        };
    }, [toast]);

    const triggerRandomToast = () => {
        const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
        const randomLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
        const randomTime = TIMES[Math.floor(Math.random() * TIMES.length)];
        const randomProduct = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];

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
                            {randomName} in {randomLocation}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Purchased <span className="font-semibold text-primary/80">{randomProduct}</span> {randomTime}
                        </p>
                    </div>
                </div>
            ),
        });
    };

    return null; // This component just mounts the side effects
}
