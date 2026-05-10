import Stripe from "stripe";

export interface StripeLineItem {
    name: string;
    image?: string;
    price: number;
    quantity: number;
}

export const createStripeCheckout = async (
    items: StripeLineItem[],
    orderId: string,
    shippingFee: number = 500
) => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Stripe secret key is not configured. Please set STRIPE_SECRET_KEY.");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2026-02-25.clover",
    });

    try {
        const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

        // Build line items from cart
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
            price_data: {
                currency: "kes",
                product_data: {
                    name: item.name,
                    ...(item.image && { images: [item.image] }),
                },
                unit_amount: Math.round(item.price * 100), // Convert to cents
            },
            quantity: item.quantity,
        }));

        // Add shipping as a separate line item
        lineItems.push({
            price_data: {
                currency: "kes",
                product_data: { name: "Shipping & Handling" },
                unit_amount: shippingFee * 100,
            },
            quantity: 1,
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${baseUrl}/order-success?id=${orderId}&payment=stripe`,
            cancel_url: `${baseUrl}/checkout?cancelled=true`,
            metadata: { orderId },
            billing_address_collection: "auto",
            phone_number_collection: { enabled: false },
        });

        return session.url;
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        throw error;
    }
};
