let cachedCJToken: { token: string; expiresAt: number } | null = null;

export const getCJAccessToken = async () => {
    const apiKey = process.env.CJ_API_KEY;
    if (!apiKey) {
        console.error("CJ_API_KEY is not set in environment variables.");
        return null;
    }

    if (cachedCJToken && cachedCJToken.expiresAt > Date.now()) {
        return cachedCJToken.token;
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
            const expiresIn = Number(result.data.expiresIn || result.data.expireTime || 600);
            const ttlMs = Number.isFinite(expiresIn) && expiresIn > 30 ? (expiresIn - 30) * 1000 : 9 * 60 * 1000;
            cachedCJToken = {
                token: result.data.accessToken,
                expiresAt: Date.now() + ttlMs
            };
            return cachedCJToken.token;
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

export const fetchCJProductDetail = async (productId: string) => {
    try {
        console.log(`Fetching CJ product detail... ID: ${productId}`);

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

        const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${productId}`, options);
        if (!response.ok) {
            return { success: false, error: "Failed to fetch detail from CJ API" };
        }

        const result = await response.json();

        if (result.code !== 200) {
            console.error("CJ API Detail Error:", result.message);
            return { success: false, error: result.message };
        }

        return {
            success: true,
            data: result.data || null
        };
    } catch (error) {
        console.error("Error fetching CJ product detail:", error);
        return { success: false, error: "Internal Server Error during detail fetch." };
    }
};

export interface CJOrderData {
    orderNumber: string;
    shippingCountry?: string;
    shippingProvince?: string;
    shippingCity: string;
    shippingZip?: string;
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

    // Map country name to ISO code and full name for CJ API
    const countryMap: Record<string, { code: string; name: string }> = {
        kenya:    { code: 'KE', name: 'Kenya' },
        uganda:   { code: 'UG', name: 'Uganda' },
        tanzania: { code: 'TZ', name: 'Tanzania' },
    };
    const countryKey = (orderData.shippingCountry || 'kenya').toLowerCase().trim();
    const countryInfo = countryMap[countryKey] || { code: 'KE', name: 'Kenya' };

    const payload = {
        orderNumber: orderData.orderNumber,
        shippingZip: orderData.shippingZip || '00100',
        shippingCountryCode: countryInfo.code,
        shippingCountry: countryInfo.name,
        shippingProvince: orderData.shippingProvince || orderData.shippingCity,
        shippingCity: orderData.shippingCity,
        shippingAddress: orderData.shippingAddress,
        shippingCustomerName: orderData.shippingName,
        shippingPhone: orderData.shippingPhone,
        remark: 'Dropshipping Order via NairobiMart',
        fromCountryCode: 'CN',
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

export const fetchCJFreight = async (endCountryCode: string, items: { vid: string, quantity: number }[]) => {
    console.log(`Calculating CJ Freight for ${endCountryCode}...`);
    const token = await getCJAccessToken();
    if (!token) return { success: false, error: "No API token could be generated" };

    try {
        const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate`, {
            method: 'POST',
            headers: {
                'CJ-Access-Token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                startCountryCode: "CN", // Assume shipping from China
                endCountryCode,
                products: items
            })
        });

        const result = await response.json();
        if (result.code !== 200 || !result.data || result.data.length === 0) {
            console.error("CJ Freight Error:", result.message);
            return { success: false, error: result.message || "No shipping rates found" };
        }

        // Return the cheapest or standard shipping option from the array
        const cheapestOption = result.data.reduce((prev: any, current: any) => 
            (prev.logisticPrice < current.logisticPrice) ? prev : current
        );

        return {
            success: true,
            feeUsd: cheapestOption.logisticPrice,
            estimatedDays: cheapestOption.logisticTime,
            methodName: cheapestOption.logisticName
        };
    } catch (error) {
        console.error("Error calculating CJ freight:", error);
        return { success: false, error: "Exception calculating freight" };
    }
};
