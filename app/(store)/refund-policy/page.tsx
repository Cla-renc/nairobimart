export const metadata = {
    title: "Refund Policy - NairobiMart",
    description: "Our comprehensive return and refund policy.",
};

export default function RefundPolicyPage() {
    return (
        <div className="container px-4 py-16 max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight text-primary">Refund Policy</h1>
                <p className="text-sm text-muted-foreground">Last updated: May 2026</p>
            </div>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                    We want you to be completely satisfied with your purchase from NairobiMart. If you receive a damaged, defective, or incorrect item, please review our policy below for instructions on how to request a refund or replacement.
                </p>

                <h2 className="text-2xl font-bold text-primary mt-8 mb-4">1. Eligibility for Refunds</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Items that arrive damaged heavily during transit.</li>
                    <li>Items that are fundamentally fundamentally defective out of the box.</li>
                    <li>You received the completely wrong item (incorrect variant or product).</li>
                </ul>

                <h2 className="text-2xl font-bold text-primary mt-8 mb-4">2. Non-Refundable Situations</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Delayed delivery within the normal 15-30 business day transit window.</li>
                    <li>Items that have been worn, used, or damaged by misusage after delivery.</li>
                    <li>Change of mind. Because items are shipped internationally on-demand, we cannot process &quot;buyer&apos;s remorse&quot; returns easily.</li>
                </ul>

                <h2 className="text-2xl font-bold text-primary mt-8 mb-4">3. Requesting a Refund</h2>
                <p>
                    To start a refund request, you must email support@nairobimart.co.ke within <strong>7 days</strong> of the delivery date. Please include:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Your Order Number.</li>
                    <li>Clear photo or video evidence of the defective/damaged item.</li>
                </ul>
                <p>
                    Our team will review your evidence within 48 hours. If approved, depending on the situation, we will either dispatch a free replacement directly from our suppliers or issue a refund back to your original payment method (M-Pesa or Visa/Mastercard).
                </p>
            </div>
        </div>
    );
}
