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

    const authToken = process.env.PAYHERO_AUTH_TOKEN;
    const username = process.env.PAYHERO_API_USERNAME;
    const password = process.env.PAYHERO_API_PASSWORD;
    const channelId = process.env.PAYHERO_CHANNEL_ID;

    if (!channelId) {
        throw new Error("Pay Hero channel ID is not configured.");
    }

    let authHeader: string;
    if (username && password) {
        authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
        console.log("Pay Hero auth method: username/password");
    } else if (authToken) {
        authHeader = authToken.startsWith("Basic ") ? authToken : `Basic ${authToken}`;
        console.log("Pay Hero auth method: auth token fallback");
    } else {
        throw new Error("Pay Hero credentials are not configured. Set PAYHERO_API_USERNAME and PAYHERO_API_PASSWORD.");
    }

    // PayHero API often expects 07... format and does the 254 conversion internally
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, "");
    if (formattedPhone.startsWith("254")) {
        formattedPhone = "0" + formattedPhone.slice(3);
    } else if (formattedPhone.startsWith("7") || formattedPhone.startsWith("1")) {
        formattedPhone = "0" + formattedPhone;
    }

    type PayHeroPaymentPayload = {
        amount: number;
        phone_number: string;
        channel_id: number;
        provider: string;
        external_reference: string;
        callback_url: string;
    };

    const channelIdNumber = Number(channelId);
    if (Number.isNaN(channelIdNumber)) {
        throw new Error("Pay Hero channel ID is invalid.");
    }

    const payload: PayHeroPaymentPayload = {
        amount,
        phone_number: formattedPhone,
        channel_id: channelIdNumber,
        provider: "m-pesa",
        external_reference: orderId,
        callback_url: callbackUrl,
    };

    try {
        console.log("Pay Hero Request:", {
            amount: payload.amount,
            phone_number: payload.phone_number,
            channel_id: payload.channel_id,
            provider: payload.provider,
            external_reference: payload.external_reference,
            callback_url: payload.callback_url,
        });

        const response = await fetch("https://backend.payhero.co.ke/api/v2/payments/initiate-stk-push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        let data: unknown;

        try {
            data = responseText ? JSON.parse(responseText) : null;
        } catch {
            data = responseText;
        }

        if (!response.ok) {
            console.error("Pay Hero API Error:", {
                status: response.status,
                statusText: response.statusText,
                body: data,
            });
            const errorBody = typeof data === "string" ? data : JSON.stringify(data);
            throw new Error(`Pay Hero API error (${response.status}): ${errorBody}`);
        }

        console.log("Pay Hero STK Push Initiated:", data);

        const responseData = data as Record<string, unknown>;
        return {
            success: true,
            message: (responseData?.message as string) || "STK Push initiated successfully",
            status: (responseData?.status as string) || undefined,
            reference: (responseData?.reference as string) || undefined,
        };
    } catch (error) {
        console.error("Pay Hero Request Error:", error instanceof Error ? error.message : error);
        throw new Error(error instanceof Error ? error.message : "Pay Hero request failed.");
    }
};
