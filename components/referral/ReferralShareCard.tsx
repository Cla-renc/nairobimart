"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ReferralShareCardProps {
  referralCode: string;
  referralLink: string;
  referredCount: number;
}

export default function ReferralShareCard({ referralCode, referralLink, referredCount }: ReferralShareCardProps) {
  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({ title: "Copied to clipboard", description: "Your referral link is ready to share." });
    } catch {
      toast({ title: "Copy failed", description: "Unable to copy referral link.", variant: "destructive" });
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-primary/10 bg-primary/5 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground font-bold">Referral Code</p>
        <p className="mt-2 text-2xl font-extrabold text-primary break-all">{referralCode}</p>
        <p className="text-sm text-muted-foreground mt-2">Share this code with friends and earn rewards when they register.</p>
      </div>
      <div className="rounded-3xl border border-primary/10 bg-background p-6 space-y-3">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground font-bold">Referral Link</p>
        <div className="rounded-2xl border border-muted p-3 bg-muted/10 break-words text-sm">{referralLink}</div>
        <Button onClick={handleCopy} disabled={isCopying} className="w-full">
          {isCopying ? "Copying..." : "Copy referral link"}
        </Button>
      </div>
      <div className="rounded-3xl border border-primary/10 bg-primary/5 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground font-bold">Referred Customers</p>
        <p className="mt-2 text-3xl font-extrabold text-accent">{referredCount}</p>
        <p className="text-sm text-muted-foreground mt-2">Customers signed up using your referral code.</p>
      </div>
    </div>
  );
}
