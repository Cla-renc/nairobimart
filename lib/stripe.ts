import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-12-18.acacia", // Updated to a recent stable version
});

export const createStripeCheckout = async (items: any[], orderId: string) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: items.map((item) => ({
                price_data: {
                    currency: "kes",
                    product_data: {
                        name: item.name,
                        images: [item.image],
                    },
                    unit_amount: item.price * 100, // Stripe expects amounts in cents
                },
                quantity: item.quantity,
            })),
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_URL}/order-success?id=${orderId}`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout`,
            metadata: {
                orderId,
            },
        });

        return session.url;
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        return null;
    }
};
