export const sendSMS = async (to: string, message: string) => {
    const username = process.env.AFRICASTALKING_USERNAME;
    const apiKey = process.env.AFRICASTALKING_API_KEY;

    if (!username || !apiKey) {
        console.warn("Africa's Talking credentials missing. SMS not sent.");
        console.log(`[MOCK SMS to ${to}]: ${message}`);
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
            console.error("Failed to send SMS:", data);
            return { success: false, error: data };
        }
    } catch (error) {
        console.error("SMS exception:", error);
        return { success: false, error };
    }
};
