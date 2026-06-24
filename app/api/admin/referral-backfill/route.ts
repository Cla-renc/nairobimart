import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { addLoyaltyPoints } from "@/lib/loyalty";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find all users with referrals
    const users = await prisma.user.findMany({
      select: { id: true, referredUsers: { select: { id: true } } },
    });

    const results: Array<{ userId: string; referredCount: number; awarded: number }> = [];

    for (const u of users) {
      const referredCount = (u.referredUsers?.length ?? 0);
      if (referredCount === 0) continue;

      // Sum existing referral points recorded in PointsEntry (reason = 'referral')
      const agg = await prisma.pointsEntry.aggregate({
        where: { userId: u.id, reason: "referral" },
        _sum: { points: true },
      });
      const existingReferralPoints = agg._sum.points ?? 0;
      const expectedReferralPoints = referredCount * 100;
      const delta = expectedReferralPoints - existingReferralPoints;
      if (delta > 0) {
        // Award missing referral points and record history
        await addLoyaltyPoints(u.id, delta, "referral", undefined, `Backfill referral points`);
      }

      results.push({ userId: u.id, referredCount, awarded: Math.max(0, delta) });
    }

    return NextResponse.json({ success: true, results });
  } catch (e) {
    console.error("Backfill error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
