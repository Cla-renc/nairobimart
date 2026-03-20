export const generateMpesaToken = async () => {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    try {
        const response = await fetch(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            }
        );
        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("M-Pesa Token Error:", error);
        return null;
    }
};

export const initiateStkPush = async (phone: string, amount: number, orderId: string) => {
    const token = await generateMpesaToken();
    if (!token) return { success: false, message: "Could not generate token" };

    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    const shortCode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

    const body = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: shortCode,
        PhoneNumber: phone,
        CallBackURL: `${process.env.NEXT_PUBLIC_URL}/api/webhook/mpesa`,
        AccountReference: orderId,
        TransactionDesc: `Payment for Order ${orderId}`,
    };

    try {
        const response = await fetch(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", // Sandbox endpoint
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            }
        );
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error("STK Push Error:", error);
        return { success: false, error };
    }
};
