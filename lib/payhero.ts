export interface PayHeroStkResponse {
    success: boolean;
    message: string;
    status?: string;
    reference?: string;
    checkoutUrl?: string; // Sometimes APIs return a URL or fallback
}

export const initiatePayHeroStkPush = async (
    amount: number,
    phoneNumber: string,
    orderId: string
): Promise<PayHeroStkResponse> => {
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const callbackUrl = `${baseUrl}/api/webhook/payhero`;

    const username = process.env.PAYHERO_API_USERNAME;
    const password = process.env.PAYHERO_API_PASSWORD;
    const channelId = process.env.PAYHERO_CHANNEL_ID;

    if (!username || !password || !channelId) {
        throw new Error("Pay Hero credentials are not configured.");
    }

    // Format phone number to start with 0 (e.g. 0712345678 or 01...) if it has 254
    let formattedPhone = phoneNumber.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+254')) {
        formattedPhone = '254' + formattedPhone.substring(4);
    } else if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
    }

    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    const payload = {
        amount,
        phone_number: formattedPhone,
        channel_id: parseInt(channelId, 10),
        provider: "m-pesa",
        external_reference: orderId,
        callback_url: callbackUrl,
    };

    try {
        const response = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${auth}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Pay Hero API Error:", data);
            throw new Error(`Pay Hero API error: ${JSON.stringify(data)}`);
        }

        console.log("Pay Hero STK Push Initiated:", data);

        return {
            success: true,
            message: data.message || "STK Push initiated successfully",
            status: data.status,
            reference: data.reference,
        };
    } catch (error) {
        console.error("Pay Hero Request Error:", error);
        throw error;
    }
};
