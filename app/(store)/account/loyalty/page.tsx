import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getLoyaltyTierInfo, getNextLoyaltyTier, LOYALTY_TIERS } from "@/lib/loyalty";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buttonVariants } from "@/lib/button-variants";
import Link from "next/link";
import RedeemPointsButton from "@/components/loyalty/RedeemPointsButton";
import { cn } from "@/lib/utils";

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
  createdAt?: Date | string;
}

type LoyaltyUser = {
  totalSpent: number;
  loyaltyPoints: number;
  pointsHistory: {
    id: string;
    createdAt: Date;
    reason: string;
    points: number;
    details?: string | null;
  }[];
};

export default async function LoyaltyPage() {
  const session = await auth();
  const user = session?.user as ExtendedUser | undefined;

  if (!user) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold">Please log in to view your loyalty dashboard.</h1>
        <Link href="/login" className={cn(buttonVariants(), "mt-4")}>
          Login
        </Link>
      </div>
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    select: {
      totalSpent: true,
      loyaltyPoints: true,
      pointsHistory: {
        orderBy: { createdAt: "desc" },
        take: 12,
      },
    },
  }) as LoyaltyUser | null;

  if (!dbUser) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold">User not found.</h1>
      </div>
    );
  }

  const tierInfo = getLoyaltyTierInfo(dbUser.totalSpent ?? 0);
  const nextTier = getNextLoyaltyTier(dbUser.totalSpent ?? 0);
  const nextThreshold = nextTier?.threshold ?? tierInfo.threshold;
  const progress = nextTier
    ? Math.min(((dbUser.totalSpent ?? 0) - tierInfo.threshold) / (nextThreshold - tierInfo.threshold), 1)
    : 1;

  return (
    <div className="bg-muted/30 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-primary">Loyalty Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your tier, points, rewards, and redemption history.</p>
          </div>
          <Link href="/account" className={cn(buttonVariants({ variant: "outline" }), "flex items-center gap-2")}>Back to account</Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-8">
          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Current Tier</CardTitle>
                <CardDescription>Where you stand in our loyalty program.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-3xl border border-primary/10 bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Tier</p>
                    <p className="mt-4 text-3xl font-extrabold text-primary capitalize">{tierInfo.label}</p>
                    <Badge className="mt-3 bg-accent/10 text-accent border-none">{tierInfo.bonusDescription}</Badge>
                  </div>
                  <div className="rounded-3xl border border-primary/10 bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Loyalty Points</p>
                    <p className="mt-4 text-3xl font-extrabold text-accent">{dbUser.loyaltyPoints.toLocaleString()}</p>
                    <p className="mt-2 text-sm text-muted-foreground">You can redeem 100 points for KES 10.</p>
                  </div>
                  <div className="rounded-3xl border border-primary/10 bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Total Spent</p>
                    <p className="mt-4 text-3xl font-extrabold text-primary">KES {(dbUser.totalSpent ?? 0).toLocaleString()}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Your progress toward the next tier.</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-primary/10 bg-slate-50 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold">{nextTier ? `Next Tier: ${nextTier.label}` : "Top tier reached"}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {nextTier
                          ? `Spend KES ${Math.max(nextThreshold - (dbUser.totalSpent ?? 0), 0).toLocaleString()} more to reach ${nextTier.label}.`
                          : "You are in the highest tier"}
                      </p>
                    </div>
                    <div className={cn("h-3 rounded-full w-full overflow-hidden bg-muted sm:w-64", tierInfo.colorClass)}>
                      <div style={{ width: `${progress * 100}%` }} className="h-full rounded-full bg-accent" />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-primary/10 bg-white p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold">Redeem Points</p>
                      <p className="text-sm text-muted-foreground mt-1">Convert loyalty points to wallet credit instantly.</p>
                    </div>
                    <div className="w-full sm:w-auto">
                      <RedeemPointsButton points={dbUser.loyaltyPoints} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Points History</CardTitle>
                <CardDescription>Recent loyalty activity and rewards.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dbUser.pointsHistory.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-primary/30 bg-muted p-8 text-center text-sm text-muted-foreground">
                      No loyalty activity yet. Earn points by shopping, checking in daily, or reviewing products.
                    </div>
                  ) : (
                    dbUser.pointsHistory.map((entry) => (
                      <div key={entry.id} className="rounded-3xl border border-primary/10 bg-white p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-sm capitalize">{entry.reason.replace("_", " ")}</p>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(entry.createdAt).toLocaleDateString()}</p>
                          </div>
                          <p className={`text-sm font-bold ${entry.points >= 0 ? "text-green-700" : "text-red-700"}`}>
                            {entry.points >= 0 ? "+" : ""}{entry.points} pts
                          </p>
                        </div>
                        {entry.details ? <p className="mt-2 text-sm text-muted-foreground">{entry.details}</p> : null}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Tier Benefits</CardTitle>
                <CardDescription>What you unlock at each loyalty level.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {LOYALTY_TIERS.map((tier) => (
                  <div key={tier.tier} className="rounded-3xl border border-primary/10 bg-white p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">{tier.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">Spend KES {tier.threshold.toLocaleString()}+</p>
                      </div>
                      <Badge className="bg-primary/5 text-primary border-none">{tier.label}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{tier.bonusDescription}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent>
                <h2 className="text-lg font-semibold">How points are earned</h2>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <li>• 1 point per KES 10 spent on paid orders.</li>
                  <li>• 10 points for daily check-in.</li>
                  <li>• 50 points for verified product reviews.</li>
                  <li>• Redeem 100 points for KES 10 wallet credit.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
