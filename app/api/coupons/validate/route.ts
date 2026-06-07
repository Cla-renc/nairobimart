import { NextResponse } from "next/server";
import { validateCouponCode } from "@/lib/coupons";

export async function POST(req: Request) {
    try {
        const { code, subtotal } = await req.json();
        const parsedSubtotal = Number(subtotal || 0);

        if (!code) {
            return NextResponse.json({ success: false, message: "Coupon code is required." }, { status: 400 });
        }

        const validation = await validateCouponCode(code, parsedSubtotal);
        if (!validation.valid) {
            return NextResponse.json({ success: false, message: validation.error || "Coupon validation failed." }, { status: 400 });
        }

        return NextResponse.json({ success: true, amount: validation.amount, coupon: { code: validation.coupon.code, type: validation.coupon.type, value: validation.coupon.value } });
    } catch (error) {
        console.error("Coupon validation failed:", error);
        return NextResponse.json({ success: false, message: "Failed to validate coupon." }, { status: 500 });
    }
}
