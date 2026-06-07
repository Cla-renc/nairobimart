import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/button-variants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import ReferralShareCard from "@/components/referral/ReferralShareCard";

export const dynamic = "force-dynamic";

export default async function ReferralPage() {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold">Please log in to view your referral dashboard.</h1>
        <Link href="/login" className={cn(buttonVariants(), "mt-4")}>Login</Link>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      referralCode: true,
      referredUsers: { select: { id: true } },
    },
  });

  if (!user) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold">Referral data unavailable.</h1>
        <p className="text-muted-foreground mt-2">Please try again later.</p>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  const referralLink = user.referralCode
    ? `${baseUrl}/register?ref=${encodeURIComponent(user.referralCode)}`
    : "/register";

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-primary">Referral Dashboard</h1>
          <p className="text-muted-foreground mt-2">Track your referral performance and share your invite code.</p>
        </div>
        <Link href="/account" className={cn(buttonVariants({ variant: "outline" }), "h-11")}>Back to Account</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>Share your referral code with friends and earn rewards when they register.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="font-semibold">1. Share your referral link</p>
              <p className="text-sm text-muted-foreground mt-1">Send the link or code to friends so they can sign up with your referral.</p>
            </div>
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="font-semibold">2. They register and complete sign-up</p>
              <p className="text-sm text-muted-foreground mt-1">The referral is tracked automatically during registration.</p>
            </div>
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="font-semibold">3. Earn reward points</p>
              <p className="text-sm text-muted-foreground mt-1">You receive loyalty points when referrals complete registration.</p>
            </div>
          </CardContent>
        </Card>

        <ReferralShareCard
          referralCode={user.referralCode ?? "N/A"}
          referralLink={referralLink}
          referredCount={user.referredUsers?.length ?? 0}
        />
      </div>
    </div>
  );
}
