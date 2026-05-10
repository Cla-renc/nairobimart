export interface PesaPalLineItem {
    name: string;
    image?: string;
    price: number;
    quantity: number;
}

const getApiUrl = () => {
    const pesapalEnv = process.env.PESAPAL_ENV || "sandbox";
    return pesapalEnv === "production"
        ? "https://pay.pesapal.com/v3"
        : "https://cybqa.pesapal.com/pesapalv3";
};

export const getPesaPalToken = async () => {
    const apiUrl = getApiUrl();
    const pesapalEnv = process.env.PESAPAL_ENV || "sandbox";

    try {
        console.log(`Getting PesaPal token from (${pesapalEnv}):`, `${apiUrl}/api/Auth/RequestToken`);

        const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
        const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

        if (!consumerKey || !consumerSecret) {
            throw new Error(`PesaPal credentials missing. Environment: ${pesapalEnv}. Please check PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET in Vercel.`);
        }

        const response = await fetch(`${apiUrl}/api/Auth/RequestToken`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                consumer_key: consumerKey,
                consumer_secret: consumerSecret,
            }),
        });

        if (!response.ok) {
            let error;
            try { error = await response.json(); } catch { error = await response.text(); }
            throw new Error(`Failed to get PesaPal token (${response.status}): ${JSON.stringify(error)}`);
        }

        const data = await response.json();

        // PesaPal sometimes returns HTTP 200 OK but with an error object inside
        if (data.error || data.status === "500" || !data.token) {
            throw new Error(`PesaPal API returned an embedded error during Auth: ${JSON.stringify(data)}`);
        }

        return data.token;
    } catch (error) {
        console.error("PesaPal Token Error:", error);
        throw error;
    }
};

const getOrRegisterIPN = async (token: string, apiUrl: string, baseUrl: string) => {
    try {
        const ipnUrl = `${baseUrl}/api/webhook/pesapal`;
        const listRes = await fetch(`${apiUrl}/api/URLSetup/GetIpnList`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
        });

        if (listRes.ok) {
            // First clone the response since we might need to read it again in fallback
            const clonedListRes = listRes.clone();
            const listData = await clonedListRes.json();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ipnList = Array.isArray(listData) ? listData : (listData as any)?.ipn_list || [];

            // 1. Try exact match
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const existing = ipnList.find((ipn: any) => ipn.url === ipnUrl);
            if (existing) {
                console.log("Found existing IPN:", existing.ipn_id);
                return existing.ipn_id;
            }

            // 2. Fallback to any existing IPN (PesaPal often only allows 1 IPN)
            if (ipnList.length > 0) {
                console.log("Using existing alternative IPN:", ipnList[0].ipn_id);
                return ipnList[0].ipn_id;
            }
        }

        console.log("Registering new IPN url:", ipnUrl);
        const regRes = await fetch(`${apiUrl}/api/URLSetup/RegisterIPN`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                url: ipnUrl,
                ipn_notification_type: "POST"
            }),
        });

        if (regRes.ok) {
            const regData = await regRes.json();
            console.log("Registered new IPN:", regData.ipn_id);
            return regData.ipn_id;
        } else {
            console.error("IPN Registration failed with status:", regRes.status);
            // Fallback to first available IPN from list if registration fails
            const listData = await listRes.json().catch(() => ([]));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ipnList = Array.isArray(listData) ? listData : (listData as any)?.ipn_list || [];
            if (ipnList.length > 0) return ipnList[0].ipn_id;
        }
    } catch (e) {
        console.error("Failed IPN registration", e);
    }

    // For V3 it is typically mandatory, returning empty might fail the checkout. 
    // We try to return dummy if not found to prevent complete breakage if RegisterIPN fails.
    return "dummy-ipn-id";
};

export const createPesaPalCheckout = async (
    items: PesaPalLineItem[],
    orderId: string,
    customerEmail: string,
    customerPhone: string,
    shippingFee: number = 500,
    totalAmount: number
) => {
    if (process.env.PESAPAL_TEST_MODE === "true") {
        console.log("⚠️  PESAPAL TEST MODE ENABLED - Not calling actual API");
        const mockCheckoutUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/order-success?id=${orderId}&payment=pesapal&test=true`;
        return { checkoutUrl: mockCheckoutUrl, orderTrackingId: `TEST_${orderId}` };
    }

    if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
        throw new Error("PesaPal credentials are not configured.");
    }

    try {
        const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
        const apiUrl = getApiUrl();

        // Get token first
        const token = await getPesaPalToken();
        console.log("Got PesaPal token successfully");

        const notification_id = await getOrRegisterIPN(token, apiUrl, baseUrl);

        // Request body for PesaPal V3 SubmitOrderRequest
        const requestBody = {
            id: orderId,
            currency: "KES",
            amount: totalAmount + shippingFee,
            description: `NairobiMart Order #${orderId}`,
            callback_url: `${baseUrl}/order-success?id=${orderId}&payment=pesapal`,
            notification_id: notification_id,
            billing_address: {
                email_address: customerEmail || "customer@nairobimart.com",
                phone_number: customerPhone || "0000000000",
                country_code: "KE",
                first_name: "Customer",
                middle_name: "",
                last_name: "Order",
                line_1: "N/A",
                line_2: "",
                city: "Nairobi",
                state: "Nairobi",
                postal_code: "00100",
                zip_code: "00100"
            }
        };

        const response = await fetch(`${apiUrl}/api/Transactions/SubmitOrderRequest`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            let error;
            try { error = await response.json(); } catch { error = await response.text(); }
            console.error("PesaPal API Error:", error);
            throw new Error(`PesaPal API error (${response.status}): ${JSON.stringify(error)}`);
        }

        const data = await response.json();

        // Throw if PesaPal responded with embedded error
        if (data.error || data.status === "500" || !data.redirect_url) {
            throw new Error(`PesaPal API returned an embedded error during checkout: ${JSON.stringify(data)}`);
        }

        return {
            checkoutUrl: data.redirect_url,
            orderTrackingId: data.order_tracking_id,
        };
    } catch (error) {
        console.error("PesaPal Checkout Error:", error);
        throw error;
    }
};
