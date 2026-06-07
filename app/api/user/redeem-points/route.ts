import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { redeemLoyaltyPoints } from "@/lib/loyalty";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const result = await redeemLoyaltyPoints(session.user.id);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, creditAmount: result.creditAmount, pointsLeft: result.pointsLeft });
  } catch (error) {
    console.error("Redeem points error:", error);
    return NextResponse.json({ success: false, message: "Unable to redeem points." }, { status: 500 });
  }
}
