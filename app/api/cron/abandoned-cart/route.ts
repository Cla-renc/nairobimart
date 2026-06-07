import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendSMS } from '@/lib/sms';
import { createRecoveryCoupon } from '@/lib/coupons';
import { sendMarketingEmail } from '@/lib/email';

// This is to secure the cron route from public access.
// Vercel will send a CRON_SECRET header if configured.
export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (
        process.env.CRON_SECRET &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
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

        for (const data of Object.values(cartsByUser)) {
            const coupon = await createRecoveryCoupon(data.user.id, 7, 7);
            const message = `Hey ${data.user.name || 'there'}, you left ${data.items.length} item(s) in your cart! Use ${coupon.code} for 7% off and complete your purchase at NairobiMart.`;

            if (data.user.phone) {
                await sendSMS(data.user.phone, message);
                results.push({ email: data.user.email, phone: data.user.phone, sent: true, itemsCount: data.items.length, coupon: coupon.code });
                continue;
            }

            if (data.user.email) {
                await sendMarketingEmail(
                    data.user.email,
                    "You left items in your NairobiMart cart",
                    `<p>Hi ${data.user.name || "there"},</p><p>You left ${data.items.length} item(s) in your cart.</p><p>Use <strong>${coupon.code}</strong> for 7% off your next order. Offer expires in 7 days.</p>`
                );
                results.push({ email: data.user.email, phone: data.user.phone, sent: true, itemsCount: data.items.length, coupon: coupon.code });
                continue;
            }

            results.push({ email: data.user.email, phone: data.user.phone, sent: false, itemsCount: data.items.length, coupon: coupon.code });
        }

        return NextResponse.json({
            success: true,
            processedCarts: results.length,
            details: results,
        });
    } catch (error) {
        console.error('Abandoned cart cron error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
