"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DepositForm() {
    const [amount, setAmount] = useState("");
    const [phone, setPhone] = useState("");
    const [isDepositing, setIsDepositing] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!amount || parseFloat(amount) <= 0) {
            toast({ title: "Invalid amount", description: "Please enter a valid amount.", variant: "destructive" });
            return;
        }

        setIsDepositing(true);

        try {
            const res = await fetch("/api/wallet/deposit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, phone }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Something went wrong");
            }

            toast({
                title: "Deposit Successful",
                description: `KES ${parseFloat(amount).toLocaleString()} has been added to your wallet.`,
            });

            setAmount("");
            router.refresh();
        } catch (error) {
            const err = error as Error;
            toast({
                title: "Deposit Failed",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setIsDepositing(false);
        }
    };

    return (
        <form onSubmit={handleDeposit} className="space-y-4 bg-white/10 p-4 rounded-xl border border-white/20">
            <div>
                <Label className="text-white/80">Amount (KES)</Label>
                <Input 
                    type="number" 
                    placeholder="e.g. 1000" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/40 mt-1"
                    required
                />
            </div>
            <div>
                <Label className="text-white/80">M-Pesa Phone Number</Label>
                <Input 
                    type="tel" 
                    placeholder="e.g. 0712345678" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/40 mt-1"
                />
            </div>
            <Button 
                type="submit" 
                className="w-full bg-white text-primary hover:bg-white/90 font-bold flex items-center justify-center gap-2"
                disabled={isDepositing}
            >
                {isDepositing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Deposit Funds via M-Pesa"}
                {!isDepositing && <ArrowRight className="h-4 w-4" />}
            </Button>
        </form>
    );
}
