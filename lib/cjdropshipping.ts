export const getCJAccessToken = async () => {
    const apiKey = process.env.CJ_API_KEY;
    if (!apiKey) {
        console.error("CJ_API_KEY is not set in environment variables.");
        return null;
    }

    try {
        const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ apiKey })
        });

        const result = await response.json();
        if (result.code === 200 && result.data && result.data.accessToken) {
            return result.data.accessToken;
        } else {
            console.error("Failed to get CJ Access Token:", result.message);
            return null;
        }
    } catch (error) {
        console.error("Error fetching CJ Access Token:", error);
        return null;
    }
};

export const fetchCJProductList = async (keyword: string, categoryId?: string, page = 1) => {
    try {
        console.log(`Fetching CJ products... Keyword: ${keyword}`);

        const token = await getCJAccessToken();
        if (!token) {
            return { success: false, error: "API Token could not be generated." };
        }

        const options = {
            method: 'GET',
            headers: {
                'CJ-Access-Token': token,
                'Content-Type': 'application/json'
            }
        };

        // Construct Query Params
        let queryParams = `?page=${page}&size=50`;
        if (keyword) queryParams += `&keyWord=${encodeURIComponent(keyword)}`;
        // if (categoryId) queryParams += `&categoryId=${categoryId}`;

        const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/listV2${queryParams}`, options);
        if (!response.ok) {
            return { success: false, error: "Failed to fetch from CJ API" };
        }

        const result = await response.json();

        if (result.code !== 200) {
            console.error("CJ API Error:", result.message);
            return { success: false, error: result.message };
        }

        return {
            success: true,
            data: result.data || []
        };
    } catch (error) {
        console.error("Error fetching CJ product:", error);
        return { success: false, error: "Internal Server Error during fetch." };
    }
};

export interface CJOrderData {
    orderNumber: string;
    shippingProvince?: string;
    shippingCity: string;
    shippingAddress: string;
    shippingName: string;
    shippingPhone: string;
    items: {
        variant?: { cjVariantId: string };
        product: { cjProductId: string };
        quantity: number;
    }[];
}

export const createCJOrder = async (orderData: CJOrderData) => {
    console.log(`Submitting Order to CJ Dropshipping...`);
    const token = await getCJAccessToken();
    if (!token) return { success: false, error: "No API token could be generated" };

    const payload = {
        orderNumber: orderData.orderNumber,
        shippingZip: "90210",
        shippingCountryCode: "US", // Defaulting for now
        shippingCountry: "United States",
        shippingProvince: orderData.shippingProvince || "CA",
        shippingCity: orderData.shippingCity,
        shippingAddress: orderData.shippingAddress,
        shippingCustomerName: orderData.shippingName,
        shippingPhone: orderData.shippingPhone,
        remark: "Dropshipping Order",
        fromCountryCode: "CN",
        products: orderData.items.map((item) => ({
            vid: item.variant?.cjVariantId || item.product.cjProductId,
            quantity: item.quantity
        }))
    };

    try {
        const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV2`, {
            method: 'POST',
            headers: {
                'CJ-Access-Token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.code !== 200) {
            return { success: false, error: result.message || "Failed to create CJ Order" };
        }

        return {
            success: true,
            cjOrderId: result.data.orderId,
            cjOrderNumber: result.data.orderNumber
        };
    } catch (error) {
        console.error("Error creating CJ order:", error);
        return { success: false, error: "Exception creating order" };
    }
};
