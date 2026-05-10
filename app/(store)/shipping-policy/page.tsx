export const metadata = {
    title: "Shipping Policy - NairobiMart",
    description: "Learn about how NairobiMart ships products globally directly to your doorstep.",
};

export default function ShippingPolicyPage() {
    return (
        <div className="container px-4 py-16 max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight text-primary">Shipping Policy</h1>
                <p className="text-sm text-muted-foreground">Last updated: May 2026</p>
            </div>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                    At NairobiMart, our goal is to offer you the best shipping options, no matter where you live in Kenya. Every day, we deliver to hundreds of customers across the country, ensuring that we provide the very highest levels of responsiveness to you at all times.
                </p>

                <h2 className="text-2xl font-bold text-primary mt-8 mb-4">1. Order Processing Time</h2>
                <p>
                    All orders are sent to our global suppliers for dispatch within 24 hours after the order is placed. The supplier and the logistics provider then process the order, which takes an additional 2–4 days.
                </p>

                <h2 className="text-2xl font-bold text-primary mt-8 mb-4">2. Shipping Time</h2>
                <p>
                    This refers to the time it takes for items to be shipped from our warehouse directly to your destination. Standard international delivery usually takes about <strong>15–30 business days</strong>.
                </p>

                <h2 className="text-2xl font-bold text-primary mt-8 mb-4">3. Local Delivery</h2>
                <p>
                    Because we operate as a direct-to-customer platform, we utilize local couriers to complete the final delivery. Detailed tracking allows you to see when it reaches Kenya. Once it is dispatched to your local region, the courier will call the phone number provided at checkout for personal pickup or delivery coordination.
                </p>

                <h2 className="text-2xl font-bold text-primary mt-8 mb-4">4. Shipping Fees</h2>
                <p>
                    Shipping costs are calculated automatically at checkout based on the weight of the items and your specified location. Any applicable customs taxes are typically covered by us, but in rare outlier scenarios, you will be notified prior to delivery.
                </p>
            </div>
        </div>
    );
}
