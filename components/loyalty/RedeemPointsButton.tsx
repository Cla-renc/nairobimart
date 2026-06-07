"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RedeemPointsButtonProps {
  points: number;
}

export default function RedeemPointsButton({ points }: RedeemPointsButtonProps) {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { toast } = useToast();
  const canRedeem = points >= 100;

  const handleRedeem = async () => {
    if (!canRedeem) {
      toast({ title: "Not enough points", description: "Earn 100 points to redeem KES 10.", variant: "destructive" });
      return;
    }

    setIsRedeeming(true);

    try {
      const response = await fetch("/api/user/redeem-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to redeem points.");
      }

      toast({
        title: "Points redeemed",
        description: `Converted ${100} points into KES ${data.creditAmount.toFixed(2)} wallet credit.`,
      });
      window.location.reload();
    } catch (error) {
      console.error("Redeem error:", error);
      toast({
        title: "Redeem failed",
        description: error instanceof Error ? error.message : "Unable to redeem points.",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <Button onClick={handleRedeem} disabled={!canRedeem || isRedeeming} className="w-full">
      {isRedeeming ? "Redeeming..." : `Redeem 100 points for KES 10`}
    </Button>
  );
}
