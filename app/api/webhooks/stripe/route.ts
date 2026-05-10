import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

// Initialize Stripe lazily to avoid errors during build
let stripe: Stripe | null = null;

function getStripe(): Stripe {
    if (!stripe) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY is not configured");
        }
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2026-02-25.clover",
        });
    }
    return stripe;
}

export async function POST(request: NextRequest) {
    try {
        const stripeClient = getStripe();
        const body = await request.text();
        const signature = request.headers.get("stripe-signature");

        if (!signature) {
            return NextResponse.json({ error: "Missing signature" }, { status: 400 });
        }

        let event;
        try {
            event = stripeClient.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET!
            );
        } catch (err) {
            console.error("Stripe webhook verification failed:", err);
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        // Process the webhook event
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const orderId = session.metadata?.orderId;

                if (!orderId) {
                    console.error("No orderId in Stripe session metadata");
                    break;
                }

                // Mark order as paid and update payment status
                await prisma.order.update({
                    where: { id: orderId },
                    data: {
                        paymentStatus: "paid",
                        status: "processing",
                        stripePaymentId: session.payment_intent as string ?? session.id,
                    },
                });

                console.log(`✅ Order ${orderId} marked as paid via Stripe`);
                break;
            }

            case "checkout.session.expired": {
                const session = event.data.object;
                const orderId = session.metadata?.orderId;
                if (orderId) {
                    // Mark payment as failed if session expired
                    await prisma.order.update({
                        where: { id: orderId },
                        data: { paymentStatus: "failed", status: "cancelled" },
                    });
                }
                break;
            }

            default:
                // Unhandled event type — ignore
                break;
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
}
