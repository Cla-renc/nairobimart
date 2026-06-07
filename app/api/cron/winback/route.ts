import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";
import { sendMarketingEmail } from "@/lib/email";
import { createWinBackCoupon } from "@/lib/coupons";

export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const users = await prisma.user.findMany({
            where: {
                orders: {
                    some: {
                        createdAt: {
                            lt: sixtyDaysAgo,
                        },
                    },
                },
                OR: [
                    { lastWinBackSentAt: null },
                    { lastWinBackSentAt: { lt: thirtyDaysAgo } },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
            },
        });

        const results: Array<{ email: string | null; phone: string | null; sent: boolean; couponCode: string }> = [];

        for (const user of users) {
            const coupon = await createWinBackCoupon(user.id, 10, 14);
            const message = `Hi ${user.name || "there"}, we miss you! Enjoy 10% off your next NairobiMart order with code ${coupon.code}. Valid for 14 days.`;

            if (user.phone) {
                await sendSMS(user.phone, message);
                results.push({ email: user.email, phone: user.phone, sent: true, couponCode: coupon.code });
                continue;
            }

            if (user.email) {
                await sendMarketingEmail(
                    user.email,
                    "We miss you at NairobiMart",
                    `<p>Hi ${user.name || "there"},</p><p>We haven’t seen you in a while. Use <strong>${coupon.code}</strong> for 10% off your next order. Offer expires in 14 days.</p>`
                );
                console.log(`[WIN-BACK EMAIL to ${user.email}]: ${message}`);
                results.push({ email: user.email, phone: user.phone, sent: true, couponCode: coupon.code });
                continue;
            }

            results.push({ email: user.email, phone: user.phone, sent: false, couponCode: coupon.code });
        }

        return NextResponse.json({ success: true, processed: results.length, details: results });
    } catch (error) {
        console.error("Win-back cron error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
