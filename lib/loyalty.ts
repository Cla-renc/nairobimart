import prisma from "./prisma";

export type LoyaltyTierName = "bronze" | "silver" | "gold" | "platinum";

export interface LoyaltyTierDefinition {
  tier: LoyaltyTierName;
  label: string;
  threshold: number;
  description: string;
  bonusDescription: string;
  colorClass: string;
}

export const LOYALTY_TIERS: LoyaltyTierDefinition[] = [
  {
    tier: "bronze",
    label: "Bronze",
    threshold: 0,
    description: "Starting tier for every NairobiMart shopper.",
    bonusDescription: "Earn 1 point for every KES 10 spent.",
    colorClass: "bg-slate-100 text-slate-700",
  },
  {
    tier: "silver",
    label: "Silver",
    threshold: 10000,
    description: "Reach Silver with KES 10,000+ spent.",
    bonusDescription: "Receive faster checkout rewards and 5% early access deals.",
    colorClass: "bg-blue-100 text-blue-700",
  },
  {
    tier: "gold",
    label: "Gold",
    threshold: 50000,
    description: "Reach Gold with KES 50,000+ spent.",
    bonusDescription: "Unlock premium offers, faster delivery, and extra points.",
    colorClass: "bg-yellow-100 text-yellow-700",
  },
  {
    tier: "platinum",
    label: "Platinum",
    threshold: 150000,
    description: "Top tier for your most loyal customers.",
    bonusDescription: "Enjoy priority support and exclusive deals.",
    colorClass: "bg-purple-100 text-purple-700",
  },
];

export function getLoyaltyTier(totalSpent: number): LoyaltyTierName {
  const tier = [...LOYALTY_TIERS].reverse().find((tier) => totalSpent >= tier.threshold);
  return tier?.tier ?? "bronze";
}

export function getLoyaltyTierInfo(totalSpent: number): LoyaltyTierDefinition {
  return LOYALTY_TIERS.reduce((current, tier) => {
    return totalSpent >= tier.threshold ? tier : current;
  }, LOYALTY_TIERS[0]);
}

export function getNextLoyaltyTier(totalSpent: number): LoyaltyTierDefinition | null {
  return LOYALTY_TIERS.find((tier) => tier.threshold > totalSpent) ?? null;
}

export async function addLoyaltyPoints(
  userId: string,
  points: number,
  reason: string,
  orderId?: string,
  details?: string
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      loyaltyPoints: { increment: points },
      pointsHistory: {
        create: {
          points,
          reason,
          details,
          orderId: orderId || null,
        },
      },
    },
  });
}

export async function processPurchaseRewards(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order?.userId || !order.user) {
    return null;
  }

  const existingEntry = await prisma.pointsEntry.findFirst({
    where: {
      orderId: order.id,
      reason: "purchase",
    },
  });

  if (existingEntry) {
    return null;
  }

  const earnedPoints = Math.max(Math.floor(order.total / 10), 10);
  const previousTotal = order.user.totalSpent ?? 0;
  const newTotalSpent = previousTotal + order.total;
  const tier = getLoyaltyTier(newTotalSpent);

  return prisma.user.update({
    where: { id: order.userId },
    data: {
      loyaltyPoints: { increment: earnedPoints },
      totalSpent: { increment: order.total },
      loyaltyTier: tier,
      pointsHistory: {
        create: {
          points: earnedPoints,
          reason: "purchase",
          details: `Order ${order.orderNumber}`,
          orderId: order.id,
        },
      },
    },
  });
}

export async function redeemLoyaltyPoints(userId: string, pointsToRedeem = 100) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return { success: false, message: "User not found." };
  }

  if (user.loyaltyPoints < pointsToRedeem) {
    return { success: false, message: "You do not have enough points to redeem." };
  }

  const creditAmount = (pointsToRedeem / 100) * 10; // 100 points = KES 10

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      loyaltyPoints: { decrement: pointsToRedeem },
      walletBalance: { increment: creditAmount },
      pointsHistory: {
        create: {
          points: -pointsToRedeem,
          reason: "redeem",
          details: `Redeemed for KES ${creditAmount.toFixed(2)}`,
        },
      },
      walletTransactions: {
        create: {
          amount: creditAmount,
          type: "CASHBACK",
          status: "COMPLETED",
          reference: `POINTS-REDEEM-${Date.now()}`,
        },
      },
    },
  });

  return {
    success: true,
    pointsLeft: updatedUser.loyaltyPoints,
    creditAmount,
  };
}
