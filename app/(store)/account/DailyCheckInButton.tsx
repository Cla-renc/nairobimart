"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Star, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DailyCheckInButton({ hasCheckedIn }: { hasCheckedIn: boolean }) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleCheckIn = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/user/checkin", { method: "POST" });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to check in");
            }

            toast({
                title: "Checked In! 🎉",
                description: data.message,
                className: "bg-green-50 border-green-200 text-green-900"
            });

            router.refresh();
        } catch (error: any) {
            toast({
                title: "Check-in failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (hasCheckedIn) {
        return (
            <Button disabled variant="outline" className="w-full font-bold text-green-600 border-green-200 bg-green-50">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Checked In Today
            </Button>
        );
    }

    return (
        <Button onClick={handleCheckIn} disabled={isLoading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold group">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform text-yellow-300 fill-yellow-300" />}
            Claim Daily 10 Points
        </Button>
    );
}
