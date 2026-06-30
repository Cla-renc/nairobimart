/**
 * /api/bot/trigger-payment
 * Called by the WhatsApp bot after order creation to trigger the payment.
 * - Kenya → PayHero M-Pesa STK Push
 * - Uganda/Tanzania → Pesapal payment link
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

import { initiatePayHeroStkPush } from '@/lib/payhero';

async function triggerPayheroSTK(phone: string, amount: number, orderId: string, orderNumber: string) {
    try {
        const result = await initiatePayHeroStkPush(amount, phone, orderNumber, "NairobiMart WhatsApp User");
        return result;
    } catch (error: any) {
        return { success: false, error: error.message || 'PayHero STK push failed' };
    }
}

async function triggerPesapalLink(amount: number, orderId: string, orderNumber: string, customerName: string, customerEmail: string, customerPhone: string) {
    // Get Pesapal token
    const tokenRes = await fetch('https://pay.pesapal.com/v3/api/Auth/RequestToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
            consumer_key: process.env.PESAPAL_CONSUMER_KEY,
            consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
        }),
    });

    const tokenData = await tokenRes.json();
    const token = tokenData?.token;
    if (!token) return { success: false, error: 'Could not authenticate with Pesapal' };

    // Submit order
    const orderPayload = {
        id: orderNumber,
        currency: 'USD',
        amount: Math.round(amount / 130), // Convert KES to USD
        description: `NairobiMart WhatsApp Order ${orderNumber}`,
        callback_url: `${process.env.NEXT_PUBLIC_URL}/api/webhook/pesapal`,
        notification_id: process.env.PESAPAL_IPN_ID || '',
        billing_address: {
            email_address: customerEmail,
            phone_number: customerPhone,
            first_name: customerName.split(' ')[0],
            last_name: customerName.split(' ').slice(1).join(' ') || customerName,
        }
    };

    const submitRes = await fetch('https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
    });

    const submitData = await submitRes.json();
    if (submitData?.redirect_url) {
        return { success: true, paymentUrl: submitData.redirect_url };
    }

    return { success: false, error: submitData?.error?.message || 'Pesapal order submission failed' };
}

export async function POST(request: Request) {
    try {
        const { orderId, orderNumber, paymentMethod, amount, customerPhone, customerName, customerEmail, country } = await request.json();

        if (!orderId || !paymentMethod || !amount) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        if (paymentMethod === 'payhero') {
            const result = await triggerPayheroSTK(customerPhone, amount, orderId, orderNumber);
            if (result.success) {
                const ref = (result as any).reference;
                await prisma.order.update({
                    where: { id: orderId },
                    data: { notes: { set: `WhatsApp Order | payhero_ref: ${ref}` } }
                });
            }
            return NextResponse.json(result);
        }

        if (paymentMethod === 'pesapal') {
            const result = await triggerPesapalLink(amount, orderId, orderNumber, customerName, customerEmail, customerPhone);
            return NextResponse.json(result);
        }

        return NextResponse.json({ success: false, error: 'Unknown payment method' }, { status: 400 });

    } catch (error: any) {
        console.error('Bot payment trigger error:', error);
        return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
    }
}
