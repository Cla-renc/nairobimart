import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendSMS } from '@/lib/sms';
import { createRecoveryCoupon } from '@/lib/coupons';
import { sendMarketingEmail } from '@/lib/email';

// Secure the cron route from public access using CRON_SECRET header.
export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (
        process.env.CRON_SECRET &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const abandonedCarts = await prisma.cartItem.findMany({
            where: {
                updatedAt: {
                    lte: oneDayAgo,
                },
                user: {
                    OR: [
                        { lastAbandonedCartNotificationAt: null },
                        { lastAbandonedCartNotificationAt: { lte: oneDayAgo } },
                    ],
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                product: {
                    select: {
                        name: true,
                        price: true,
                    },
                },
            },
        });

        const cartsByUser = abandonedCarts.reduce((acc, item) => {
            const userId = item.userId;
            if (!acc[userId]) {
                acc[userId] = {
                    user: item.user,
                    items: [],
                };
            }
            acc[userId].items.push({
                productName: item.product.name,
                quantity: item.quantity,
                price: item.product.price,
            });
            return acc;
        }, {} as Record<string, { user: { id: string; name: string | null; email: string | null; phone: string | null }; items: { productName: string; quantity: number; price: number }[] }>);

        const results: { email: string | null; phone: string | null; sent: boolean; itemsCount: number; coupon: string | null }[] = [];
        let emailsSent = 0;
        let smsSent = 0;
        let couponsCreated = 0;
        let usersUpdated = 0;

        for (const data of Object.values(cartsByUser)) {
            const coupon = await createRecoveryCoupon(data.user.id, 5, 7);
            couponsCreated++;
            const message = `Hey ${data.user.name || 'there'}, you left ${data.items.length} item(s) in your cart! Use ${coupon.code} for 5% off and complete your purchase at NairobiMart.`;

            let sent = false;
            if (data.user.phone) {
                await sendSMS(data.user.phone, message);
                smsSent++;
                sent = true;
            } else if (data.user.email) {
                await sendMarketingEmail(
                    data.user.email,
                    "You left items in your NairobiMart cart",
                    `<p>Hi ${data.user.name || "there"},</p><p>You left ${data.items.length} item(s) in your cart.</p><p>Use <strong>${coupon.code}</strong> for 5% off your next order. Offer expires in 7 days.</p>`
                );
                emailsSent++;
                sent = true;
            }

            // Update user's last notification timestamp so we don't resend too frequently
            try {
                await prisma.user.update({ where: { id: data.user.id }, data: { lastAbandonedCartNotificationAt: now } });
                usersUpdated++;
            } catch (e) {
                console.error(`Failed to update lastAbandonedCartNotificationAt for user ${data.user.id}:`, e);
            }

            results.push({ email: data.user.email, phone: data.user.phone, sent, itemsCount: data.items.length, coupon: coupon.code });
        }

        const summary = {
            success: true,
            processedCarts: results.length,
            couponsCreated,
            emailsSent,
            smsSent,
            usersUpdated,
            details: results,
        };

        console.log('Abandoned cart cron summary:', summary);

        return NextResponse.json(summary);
    } catch (error) {
        console.error('Abandoned cart cron error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
