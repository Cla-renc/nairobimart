"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DownloadCloud, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SeedButton() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSeed = async () => {
        setIsLoading(true);
        toast({
            title: "Seeding Data...",
            description: "Fetching products from CJ Dropshipping. This may take a minute.",
        });

        try {
            const response = await fetch("/api/admin/seed-cj", { method: "GET" });
            const data = await response.json();

            if (data.success) {
                toast({
                    title: "Success",
                    description: data.message,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error Seeding",
                    description: data.error || data.message || "Failed to seed products.",
                });
            }
        } catch {
            toast({
                variant: "destructive",
                title: "Network Error",
                description: "Failed to communicate with the seeding endpoint.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleSeed}
            disabled={isLoading}
            variant="outline"
            className="flex items-center space-x-2"
        >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
            <span>{isLoading ? "Seeding..." : "Seed CJ Products"}</span>
        </Button>
    );
}
