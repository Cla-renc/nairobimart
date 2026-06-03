import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
            // Mock email/WhatsApp sending
            const message = `Hey ${data.user.name || 'there'}, you left ${data.items.length} item(s) in your cart! Complete your purchase now and get 5% off with code CART5.`;
            
            console.log(`[CRON - Abandoned Cart] Sending reminder to ${data.user.email}: ${message}`);
            
            // Here you would integrate Resend (Email) or Africa's Talking / Twilio (SMS/WhatsApp)
            results.push({
                email: data.user.email,
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
