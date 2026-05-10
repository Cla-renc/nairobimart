export const metadata = {
    title: "Frequently Asked Questions - NairobiMart",
    description: "Got questions? We have answers. Find out more about orders, shipping, and shopping at NairobiMart.",
};

export default function FAQPage() {
    return (
        <div className="container px-4 py-16 max-w-3xl mx-auto space-y-12">
            <div className="space-y-4 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-primary">Frequently Asked Questions</h1>
                <p className="text-muted-foreground">Everything you need to know about shopping with us.</p>
            </div>

            <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-bold text-primary mb-2">How does shipping work?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                        We operate a direct-to-customer dropshipping model. When you place an order, our global suppliers package the items and ship them directly to your specified town or doorstep. You will be contacted via the phone number you provided during checkout once the courier arrives.
                    </p>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-primary mb-2">How long will my order take to arrive?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                        Standard international transit time is usually between 15 to 30 business days. We appreciate your patience as we source high-quality products from overseas to deliver them to you at the best possible prices.
                    </p>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-primary mb-2">Can I track my order?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                        Yes! Once your order has been processed and shipped, a tracking number will be provided on your Account Dashboard under &quot;Orders&quot;.
                    </p>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-primary mb-2">Do you have a physical store I can visit?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                        We are a 100% online store, built in Kenya, for Kenya. Not having a physical retail storefront allows us to minimize overhead costs and pass those massive savings directly onto you.
                    </p>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-primary mb-2">What payment methods do you accept?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                        We accept secure local mobile payments via M-Pesa, as well as Visa and Mastercard through PesaPal.
                    </p>
                </div>
            </div>
        </div>
    );
}
