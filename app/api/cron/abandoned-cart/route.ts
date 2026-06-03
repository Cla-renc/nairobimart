import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendSMS } from '@/lib/sms';

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
        // Find users with cart items older than 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const abandonedCarts = await prisma.cartItem.findMany({
            where: {
                updatedAt: {
                    lte: oneDayAgo,
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

        // Group by user
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
        }, {} as Record<string, { user: any; items: any[] }>);

        // Process each abandoned cart
        const results = [];
        for (const [userId, data] of Object.entries(cartsByUser)) {
            const message = `Hey ${data.user.name || 'there'}, you left ${data.items.length} item(s) in your cart! Complete your purchase at NairobiMart and get 5% off with code CART5.`;
            
            if (data.user.phone) {
                await sendSMS(data.user.phone, message);
            } else {
                console.log(`[MOCK EMAIL to ${data.user.email}]: ${message}`);
            }
            
            results.push({
                email: data.user.email,
                phone: data.user.phone,
                sent: true,
                itemsCount: data.items.length
            });
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
