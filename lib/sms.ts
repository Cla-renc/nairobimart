import * as Sentry from "@sentry/nextjs";

export const sendSMS = async (to: string, message: string) => {
    const username = process.env.AFRICASTALKING_USERNAME;
    const apiKey = process.env.AFRICASTALKING_API_KEY;

    if (!username || !apiKey) {
        const errorMsg = `SMS not sent to ${to}: Africa's Talking credentials missing.`;
        console.warn(errorMsg);
        if (process.env.NODE_ENV === "production") {
            Sentry.captureMessage(errorMsg, "warning");
        }
        return { success: false, error: "Missing credentials" };
    }

    try {
        // Africa's Talking expects numbers in international format, e.g., +2547...
        // For testing/development without a shortcode, we use the shared one or alphanumeric if registered.
        // If 'to' doesn't have a '+', assume it's a Kenyan number and prepend '+254'
        let formattedTo = to;
        if (formattedTo.startsWith("0")) {
            formattedTo = "+254" + formattedTo.substring(1);
        } else if (!formattedTo.startsWith("+")) {
            formattedTo = "+" + formattedTo;
        }

        const body = new URLSearchParams();
        body.append("username", username);
        body.append("to", formattedTo);
        body.append("message", message);

        const url = username === "sandbox" 
            ? "https://api.sandbox.africastalking.com/version1/messaging"
            : "https://api.africastalking.com/version1/messaging";

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
                "apiKey": apiKey,
            },
            body: body.toString(),
        });

        const data = await response.json();

        if (response.ok) {
            console.log("SMS sent successfully:", data);
            return { success: true, data };
        } else {
            const errMsg = `SMS to ${to} failed: ${JSON.stringify(data)}`;
            console.error(errMsg);
            if (process.env.NODE_ENV === "production") {
                Sentry.captureMessage(errMsg, "error");
            }
            return { success: false, error: data };
        }
    } catch (error) {
        console.error("SMS exception:", error);
        if (process.env.NODE_ENV === "production") {
            Sentry.captureException(error);
        }
        return { success: false, error };
    }
};

/**
 * Sends a WhatsApp order confirmation SMS
 */
export async function sendOrderConfirmationSMS(params: {
    phone: string;
    customerName: string;
    orderNumber: string;
    total: string;
    deliveryAddress: string;
}) {
    const message =
        `NairobiMart: Hi ${params.customerName}! ✅ Order #${params.orderNumber} confirmed. ` +
        `Amount: ${params.total}. Delivery to: ${params.deliveryAddress}. ` +
        `We'll update you when it ships. Thank you! 🛒`;
    return sendSMS(params.phone, message);
}

/**
 * Sends a dispatch notification SMS
 */
export async function sendDispatchSMS(params: {
    phone: string;
    customerName: string;
    orderNumber: string;
    trackingUrl?: string;
}) {
    const message =
        `NairobiMart: Hi ${params.customerName}! 🚚 Order #${params.orderNumber} has been dispatched. ` +
        (params.trackingUrl ? `Track here: ${params.trackingUrl}` : `We'll keep you updated!`);
    return sendSMS(params.phone, message);
}
