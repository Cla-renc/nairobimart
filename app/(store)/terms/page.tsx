export const metadata = {
    title: "Terms & Conditions - NairobiMart",
    description: "Terms of service and user agreements for shopping at NairobiMart.",
};

export default function TermsPage() {
    return (
        <div className="container px-4 py-16 max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight text-primary">Terms & Conditions</h1>
                <p className="text-sm text-muted-foreground">Last updated: May 2026</p>
            </div>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                    Welcome to NairobiMart. This website is operated by NairobiMart (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). We offer this website, including all information, tools, and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies, and notices stated here.
                </p>

                <h2 className="text-2xl font-bold text-primary mt-8 mb-4">Section 1 - Online Store Terms</h2>
                <p>
                    By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence, or that you are the age of majority in your state or province of residence and you have given us your consent to allow any of your minor dependents to use this site.
                </p>

                <h2 className="text-2xl font-bold text-primary mt-8 mb-4">Section 2 - General Conditions</h2>
                <p>
                    We reserve the right to refuse service to anyone for any reason at any time. You understand that your content (not including credit card information), may be transferred unencrypted and involve transmissions over various networks.
                </p>

                <h2 className="text-2xl font-bold text-primary mt-8 mb-4">Section 3 - Products and Services</h2>
                <p>
                    Certain products or services may be available exclusively online through the website. NairobiMart operates under a direct dropshipping model. We have made every effort to display as accurately as possible the colors and images of our products that appear at the store. Prices for our products are subject to change without notice.
                </p>

                <h2 className="text-2xl font-bold text-primary mt-8 mb-4">Section 4 - Accuracy of Billing and Account Information</h2>
                <p>
                    We reserve the right to refuse any order you place with us. In the event that we make a change to or cancel an order, we may attempt to notify you by contacting the e-mail and/or billing address/phone number provided at the time the order was made.
                </p>
            </div>
        </div>
    );
}
