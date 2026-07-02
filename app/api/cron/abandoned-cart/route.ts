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

        // Group cart items by user
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

        const results: { email: string | null; phone: string | null; emailSent: boolean; smsSent: boolean; whatsappSent: boolean; itemsCount: number; coupon: string | null }[] = [];
        let emailsSent = 0;
        let smsSent = 0;
        let whatsappSent = 0;
        let couponsCreated = 0;

        for (const data of Object.values(cartsByUser)) {
            // Create a unique recovery coupon per user (10% off, valid 7 days)
            const coupon = await createRecoveryCoupon(data.user.id, 10, 7);
            couponsCreated++;
            const couponCode = coupon.code;
            const userName = data.user.name || 'there';
            const itemCount = data.items.length;
            const firstItem = data.items[0]?.productName || 'your items';
            const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://nairobimart-gwna.vercel.app';

            let emailResult = false;
            let smsResult = false;
            let waResult = false;

            // 1. EMAIL
            if (data.user.email) {
                try {
                    const itemListHtml = data.items
                        .map(i => `<li><strong>${i.productName}</strong> × ${i.quantity} — KES ${i.price.toLocaleString()}</li>`)
                        .join('');

                    await sendMarketingEmail(
                        data.user.email,
                        `Hey ${userName}, you left something behind! 🛒`,
                        `<h2>Hi ${userName}, you forgot something!</h2>
                        <p>You left <strong>${itemCount} item(s)</strong> in your NairobiMart cart. They're still waiting for you!</p>
                        <ul style="padding-left:20px; line-height:1.8;">${itemListHtml}</ul>
                        <p>To make it easier, here's a <strong>10% discount</strong> just for you:</p>
                        <div style="text-align:center; margin: 24px 0;">
                          <span style="background:#F4A522; color:#0D1B2A; font-size:24px; font-weight:bold; padding:12px 28px; border-radius:8px; letter-spacing:2px;">${couponCode}</span>
                        </div>
                        <p>This code is valid for <strong>7 days</strong> and is for your exclusive use.</p>
                        <p style="text-align:center;">
                          <a href="${siteUrl}/cart" style="background:#0D1B2A; color:#F4A522; padding:14px 28px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:16px;">Complete My Purchase →</a>
                        </p>`
                    );
                    emailResult = true;
                    emailsSent++;
                } catch (e) {
                    console.error(`Failed to send abandoned cart email to ${data.user.email}:`, e);
                }
            }

            // 2. SMS
            if (data.user.phone) {
                try {
                    const smsMsg = `NairobiMart: Hi ${userName}! 🛒 You left ${itemCount} item(s) in your cart (${firstItem}${itemCount > 1 ? ' + more' : ''}). Use code ${couponCode} for 10% OFF to complete your purchase! Valid 7 days: ${siteUrl}/cart`;
                    await sendSMS(data.user.phone, smsMsg);
                    smsResult = true;
                    smsSent++;
                } catch (e) {
                    console.error(`Failed to send abandoned cart SMS to ${data.user.phone}:`, e);
                }
            }

            // 3. WHATSAPP
            if (data.user.phone && process.env.BOT_SERVER_URL) {
                try {
                    const waPhone = data.user.phone.replace(/\D/g, '').replace(/^0/, '254');
                    const itemListWa = data.items
                        .map(i => `• ${i.productName} × ${i.quantity}`)
                        .join('\n');
                    const waMsg = `🛒 *Hey ${userName}, you left something behind!*\n\nYour NairobiMart cart is still waiting for you:\n\n${itemListWa}\n\nWe don't want you to miss out, so here's a special *10% discount* just for you:\n\n🏷️ *Coupon Code:* \`${couponCode}\`\n\nValid for *7 days* — single use only.\n\n👉 Complete your purchase now:\n${siteUrl}/cart\n\n_NairobiMart – Fast delivery across Nairobi_ 🚀`;
                    const waRes = await fetch(`${process.env.BOT_SERVER_URL}/api/send-message`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: waPhone, message: waMsg }),
                    });
                    if (waRes.ok) {
                        waResult = true;
                        whatsappSent++;
                    } else {
                        console.error(`WhatsApp send failed for ${waPhone}: ${waRes.status}`);
                    }
                } catch (e) {
                    console.error(`Failed to send abandoned cart WhatsApp to ${data.user.phone}:`, e);
                }
            }

            // Mark user as notified so we don't spam them every hour
            try {
                await prisma.user.update({
                    where: { id: data.user.id },
                    data: { lastAbandonedCartNotificationAt: now },
                });
            } catch (e) {
                console.error(`Failed to update lastAbandonedCartNotificationAt for user ${data.user.id}:`, e);
            }

            results.push({
                email: data.user.email,
                phone: data.user.phone,
                emailSent: emailResult,
                smsSent: smsResult,
                whatsappSent: waResult,
                itemsCount: itemCount,
                coupon: couponCode,
            });
        }

        const summary = {
            success: true,
            processedCarts: results.length,
            couponsCreated,
            emailsSent,
            smsSent,
            whatsappSent,
            details: results,
        };

        console.log('Abandoned cart cron summary:', summary);
        return NextResponse.json(summary);

    } catch (error) {
        console.error('Abandoned cart cron error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
