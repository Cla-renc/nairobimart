"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function NewsletterForm() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes("@")) {
            toast({
                variant: "destructive",
                title: "Invalid Email",
                description: "Please enter a valid email address.",
            });
            return;
        }

        setIsLoading(true);

        // Simulate network API request for newsletter subscription
        await new Promise((resolve) => setTimeout(resolve, 1000));

        toast({
            title: "Successfully Subscribed!",
            description: "Thank you for joining the NairobiMart newsletter.",
        });

        setEmail("");
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 h-9"
            />
            <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
            </Button>
        </form>
    );
}
