export const metadata = {
    title: "Privacy Policy - NairobiMart",
    description: "How NairobiMart handles, stores, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
    return (
        <div className="container px-4 py-16 max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight text-primary">Privacy Policy</h1>
                <p className="text-sm text-muted-foreground">Last updated: May 2026</p>
            </div>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                    This Privacy Policy describes how NairobiMart collects, uses, and discloses your Personal Information when you visit or make a purchase from nairobimart.co.ke.
                </p>

                <h2 className="text-2xl font-bold text-primary mt-8 mb-4">1. Collecting Personal Information</h2>
                <p>
                    When you visit the site, we collect certain information about your device, your interaction with the Site, and information necessary to process your purchases. We may also collect additional information if you contact us for customer support.
                </p>

                <h2 className="text-2xl font-bold text-primary mt-8 mb-4">2. Order Information</h2>
                <p>
                    Examples of Personal Information collected: name, billing address, shipping address, payment information (including Visa/Mastercard details and M-Pesa phone numbers), email address, and phone number.
                </p>
                <p>
                    <strong>Purpose of collection:</strong> to provide products or services to you to fulfill our contract, to process your payment information, arrange for shipping from our dropshipping suppliers, and provide you with invoices and/or order confirmations.
                </p>

                <h2 className="text-2xl font-bold text-primary mt-8 mb-4">3. Sharing Personal Information</h2>
                <p>
                    We share your Personal Information with service providers to help us provide our services and fulfill our contracts with you. For example:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>We use MongoDB to securely store your data.</li>
                    <li>We share your shipping address and phone number exclusively with our manufacturing and shipping partners to route packages to you.</li>
                    <li>We use PesaPal to process Visa and Mastercard payments securely. We do not store raw credit card digits on our own servers.</li>
                </ul>

                <h2 className="text-2xl font-bold text-primary mt-8 mb-4">4. Your Rights</h2>
                <p>
                    If you are a resident of Kenya under the Data Protection Act, you have the right to access the Personal Information we hold about you, to port it to a new service, and to ask that your Personal Information be corrected, updated, or erased. Contact us via the contact page to trigger any of these actions.
                </p>
            </div>
        </div>
    );
}
