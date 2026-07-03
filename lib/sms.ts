import * as Sentry from "@sentry/nextjs";

export const sendSMS = async (to: string, message: string) => {
    const token = process.env.TALKSASA_TOKEN;
    const senderId = process.env.TALKSASA_SENDER_ID || "TalkSasa";

    if (!token) {
        const errorMsg = `SMS not sent to ${to}: TalkSasa Token missing.`;
        console.warn(errorMsg);
        if (process.env.NODE_ENV === "production") {
            Sentry.captureMessage(errorMsg, "warning");
        }
        return { success: false, error: "Missing TalkSasa Token" };
    }

    try {
        // Format number to international format e.g. +2547...
        let formattedTo = to;
        if (formattedTo.startsWith("0")) {
            formattedTo = "+254" + formattedTo.substring(1);
        } else if (!formattedTo.startsWith("+")) {
            formattedTo = "+" + formattedTo;
        }

        const response = await fetch("https://bulksms.talksasa.com/api/v3/sms/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
                recipient: formattedTo,
                sender_id: senderId,
                type: "plain",
                message: message,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            console.log("TalkSasa SMS sent successfully:", data);
            return { success: true, data };
        } else {
            const errMsg = `TalkSasa SMS to ${to} failed: ${JSON.stringify(data)}`;
            console.error(errMsg);
            if (process.env.NODE_ENV === "production") {
                Sentry.captureMessage(errMsg, "error");
            }
            return { success: false, error: data };
        }
    } catch (error) {
        console.error("TalkSasa SMS exception:", error);
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
