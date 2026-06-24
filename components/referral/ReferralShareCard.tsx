"use client";

import { useState, useEffect } from "react";
import { Instagram, Facebook, Twitter, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ReferralShareCardProps {
  referralCode: string;
  referralLink: string;
  referredCount: number;
  referralPoints?: number;
  pointsPerReferral?: number;
}

export default function ReferralShareCard({
  referralCode,
  referralLink,
  referredCount,
  referralPoints = 0,
  pointsPerReferral = 100,
}: ReferralShareCardProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [displayLink, setDisplayLink] = useState(referralLink);

  useEffect(() => {
    if (referralLink.startsWith("/")) {
      setDisplayLink(`${window.location.origin}${referralLink}`);
    } else {
      setDisplayLink(referralLink);
    }
  }, [referralLink]);

  const shareText = `Join NairobiMart and save! Use my referral code ${referralCode} or sign up here: ${displayLink}`;

  const handleCopy = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(displayLink);
      toast({ title: "Copied to clipboard", description: "Your referral link is ready to share." });
    } catch {
      toast({ title: "Copy failed", description: "Unable to copy referral link.", variant: "destructive" });
    } finally {
      setIsCopying(false);
    }
  };

  const openShareWindow = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleWhatsAppShare = () => {
    openShareWindow(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
  };

  const handleFacebookShare = () => {
    openShareWindow(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(displayLink)}&quote=${encodeURIComponent(
        `Use my referral code ${referralCode} to join NairobiMart!`
      )}`
    );
  };

  const handleTwitterShare = () => {
    openShareWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`);
  };

  const handleInstagramShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join NairobiMart", text: shareText, url: displayLink });
      } catch (error) {
        console.error("Instagram share fallback failed", error);
        handleCopy();
      }
      return;
    }

    handleCopy();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-primary/10 bg-primary/5 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground font-bold">Referral Code</p>
        <p className="mt-2 text-2xl font-extrabold text-primary break-all">{referralCode}</p>
        <p className="text-sm text-muted-foreground mt-2">Share this code with friends and earn rewards when they register.</p>
      </div>
      <div className="rounded-3xl border border-primary/10 bg-background p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground font-bold">Referral Link</p>
          <div className="rounded-2xl border border-muted p-3 bg-muted/10 break-words text-sm">{displayLink}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" size="sm" onClick={handleWhatsAppShare} className="gap-2">
            <MessageSquare className="h-4 w-4" /> WhatsApp
          </Button>
          <Button variant="secondary" size="sm" onClick={handleFacebookShare} className="gap-2">
            <Facebook className="h-4 w-4" /> Facebook
          </Button>
          <Button variant="secondary" size="sm" onClick={handleTwitterShare} className="gap-2">
            <Twitter className="h-4 w-4" /> Twitter
          </Button>
          <Button variant="secondary" size="sm" onClick={handleInstagramShare} className="gap-2">
            <Instagram className="h-4 w-4" /> Instagram
          </Button>
        </div>
        <Button onClick={handleCopy} disabled={isCopying} className="w-full">
          {isCopying ? "Copying..." : "Copy referral link"}
        </Button>
      </div>
      <div className="rounded-3xl border border-primary/10 bg-primary/5 p-6 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground font-bold">Referred Customers</p>
          <p className="mt-2 text-3xl font-extrabold text-accent">{referredCount}</p>
          <p className="text-sm text-muted-foreground mt-2">Customers signed up using your referral code.</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground font-bold">Referral Rewards</p>
          <p className="mt-2 text-2xl font-extrabold text-primary">{referralPoints} points</p>
          <p className="text-sm text-muted-foreground mt-2">Earned from referrals, plus {pointsPerReferral} points per successful sign-up.</p>
        </div>
      </div>
    </div>
  );
}
