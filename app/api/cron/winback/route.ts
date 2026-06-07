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
        const now = new Date();
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
        let emailsSent = 0;
        let smsSent = 0;
        let couponsCreated = 0;
        let usersUpdated = 0;

        for (const user of users) {
            const coupon = await createWinBackCoupon(user.id, 10, 14);
            couponsCreated++;
            const message = `Hi ${user.name || "there"}, we miss you! Enjoy 10% off your next NairobiMart order with code ${coupon.code}. Valid for 14 days.`;

            let sent = false;
            if (user.phone) {
                await sendSMS(user.phone, message);
                smsSent++;
                sent = true;
            } else if (user.email) {
                await sendMarketingEmail(
                    user.email,
                    "We miss you at NairobiMart",
                    `<p>Hi ${user.name || "there"},</p><p>We haven’t seen you in a while. Use <strong>${coupon.code}</strong> for 10% off your next order. Offer expires in 14 days.</p>`
                );
                emailsSent++;
                sent = true;
            }

            // Update last win-back sent timestamp
            try {
                await prisma.user.update({ where: { id: user.id }, data: { lastWinBackSentAt: now } });
                usersUpdated++;
            } catch (e) {
                console.error(`Failed to update lastWinBackSentAt for user ${user.id}:`, e);
            }

            results.push({ email: user.email, phone: user.phone, sent, couponCode: coupon.code });
        }

        const summary = {
            success: true,
            processed: results.length,
            couponsCreated,
            emailsSent,
            smsSent,
            usersUpdated,
            details: results,
        };

        console.log('Win-back cron summary:', summary);

        return NextResponse.json(summary);
    } catch (error) {
        console.error("Win-back cron error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
