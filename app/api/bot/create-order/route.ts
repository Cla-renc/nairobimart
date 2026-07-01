/**
 * /api/bot/create-order
 * Called by the WhatsApp bot to create an order from a WhatsApp conversation
 * and trigger the appropriate payment method based on customer country.
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fetchCJFreight } from '@/lib/cjdropshipping';

export const dynamic = 'force-dynamic';

// Country → currency + CJ country code + exchange rate (USD→local)
const COUNTRY_CONFIG: Record<string, { code: string; currency: string; usdRate: number; paymentMethod: 'payhero' | 'pesapal' }> = {
    'kenya':    { code: 'KE', currency: 'KES', usdRate: 130,  paymentMethod: 'payhero' },
    'uganda':   { code: 'UG', currency: 'UGX', usdRate: 3700, paymentMethod: 'pesapal' },
    'tanzania': { code: 'TZ', currency: 'TZS', usdRate: 2600, paymentMethod: 'pesapal' },
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            productId,
            quantity = 1,
            customerName,
            customerPhone,
            customerEmail,
            country,
            deliveryAddress,
            originalProductPriceKes, // The exact product price extracted by the AI
        } = body;

        if (!productId || !customerName || !customerPhone || !country || !deliveryAddress) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const countryKey = country.toLowerCase().trim();
        const config = COUNTRY_CONFIG[countryKey];
        if (!config) {
            return NextResponse.json({
                success: false,
                error: `Unsupported country: ${country}. Supported: Kenya, Uganda, Tanzania.`
            }, { status: 400 });
        }

        // 1. Fetch product from DB
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { images: true, category: true }
        });

        if (!product) {
            return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
        }

        if (product.stock !== null && product.stock < quantity) {
            return NextResponse.json({ success: false, error: `Insufficient stock. Only ${product.stock} left.` }, { status: 400 });
        }

        // 2. Calculate shipping via CJ Freight API
        let shippingFeeLocal = 0;
        let shippingMethodName = 'Standard Shipping';
        let estimatedDays = '15-30';

        if (product.cjProductId) {
            const freight = await fetchCJFreight(config.code, [{ vid: product.cjProductId, quantity }]);
            if (freight.success && freight.feeUsd) {
                shippingFeeLocal = Math.round((freight.feeUsd as number) * config.usdRate);
                shippingMethodName = (freight.methodName as string) || 'Standard Shipping';
                estimatedDays = (freight.estimatedDays as string) || '15-30';
            } else {
                // Fallback flat rates
                shippingFeeLocal = countryKey === 'kenya' ? 500 : countryKey === 'uganda' ? 8000 : 5000;
            }
        } else {
            shippingFeeLocal = countryKey === 'kenya' ? 500 : countryKey === 'uganda' ? 8000 : 5000;
        }

        // 3. Calculate totals
        let productPriceKes = product.price;
        if (product.isFlashSale && product.flashSalePrice) {
            productPriceKes = product.flashSalePrice;
        }
        if (originalProductPriceKes && originalProductPriceKes > 0) {
            productPriceKes = originalProductPriceKes;
        }

        const totalKes = productPriceKes * quantity + (countryKey === 'kenya' ? shippingFeeLocal : 0);
        const totalLocal = countryKey === 'kenya' ? totalKes : Math.round(productPriceKes * quantity * config.usdRate / 130) + shippingFeeLocal;

        // 4. Build order number
        const orderNumber = `WA-${Date.now().toString(36).toUpperCase()}`;

        // 5. Find or create a guest user for this phone
        const guestEmail = customerEmail || `wa.${customerPhone.replace(/\D/g, '')}@nairobimart.co.ke`;
        let user = await prisma.user.findFirst({
            where: { OR: [{ phone: customerPhone }, { email: guestEmail }] }
        });
        if (!user) {
            try {
                user = await prisma.user.create({
                    data: {
                        name: customerName,
                        phone: customerPhone,
                        email: guestEmail,
                    }
                });
            } catch (createErr: any) {
                // Race condition or duplicate — fetch the existing record
                user = await prisma.user.findFirst({
                    where: { OR: [{ phone: customerPhone }, { email: guestEmail }] }
                });
                if (!user) throw createErr;
            }
        } else {
            // Update name/phone if customer has returned
            await prisma.user.update({
                where: { id: user.id },
                data: { name: customerName, phone: customerPhone }
            }).catch(() => {}); // non-critical
        }

        // 6. Create the order in the database
        const order = await prisma.order.create({
            data: {
                orderNumber,
                userId: user.id,
                status: 'pending',
                paymentStatus: 'pending',
                paymentMethod: config.paymentMethod === 'payhero' ? 'mpesa' : 'card',
                total: totalKes,
                subtotal: productPriceKes * quantity,
                shippingFee: countryKey === 'kenya' ? shippingFeeLocal : 0,
                notes: `WhatsApp Order | Source: whatsapp | Country: ${country} | Address: ${deliveryAddress}`,
                shippingAddress: JSON.stringify({
                    name: customerName,
                    phone: customerPhone,
                    address: deliveryAddress,
                    country,
                }),
                items: {
                    create: [{
                        productId: product.id,
                        quantity,
                        unitPrice: productPriceKes,
                        costPrice: product.costPrice ?? 0,
                    }]
                }
            }
        });

        return NextResponse.json({
            success: true,
            orderNumber,
            orderId: order.id,
            productName: product.name,
            productPriceKes,
            shippingFeeLocal,
            shippingMethod: shippingMethodName,
            estimatedDays,
            totalKes,
            totalLocal,
            currency: config.currency,
            paymentMethod: config.paymentMethod,
            customerPhone,
            country: countryKey,
        });

    } catch (error: any) {
        console.error('WhatsApp order creation error:', error);
        return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
    }
}
