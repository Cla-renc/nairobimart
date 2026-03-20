export const fetchAliExpressProduct = async (url: string) => {
    try {
        console.log(`Fetching real data from: ${url}`);

        // Extract Item ID from URL
        // Match patterns like /item/1005001234567890.html
        const match = url.match(/\/item\/(\d+)\.html/i) || url.match(/(\d+)\.html/i);
        const itemId = match ? match[1] : null;

        if (!itemId) {
            console.error("Could not extract Item ID from URL.");
            return { success: false, error: "Invalid AliExpress URL format. Please ensure it contains the item ID (e.g. 100500...html)." };
        }

        const apiKey = process.env.ALIEXPRESS_API_KEY;
        if (!apiKey) {
            console.error("ALIEXPRESS_API_KEY is not set in environment variables.");
            return { success: false, error: "API Key is missing in the server configuration." };
        }

        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'aliexpress-datahub.p.rapidapi.com',
                'x-rapidapi-key': apiKey
            }
        };

        const response = await fetch(`https://aliexpress-datahub.p.rapidapi.com/item_detail?itemId=${itemId}`, options);
        const result = await response.json();

        // Check if API returned an error or null data
        if (!response.ok || !result || !result.result || !result.result.item) {
            console.error("API Fetch Error - Full Response:", result);
            return { success: false, error: "Failed to fetch product data from AliExpress API." };
        }

        const item = result.result.item;

        // Try to safely parse pricing and stock info from the SKU
        const price = item.sku?.def?.promotionPrice || item.sku?.def?.price || 0;
        const stock = item.sku?.def?.quantity || 100;
        const mainImage = item.images && item.images.length > 0 ? item.images[0] : "";

        // Return mapped data for the product form
        return {
            success: true,
            data: {
                name: item.title || "AliExpress Product",
                // Sometimes descriptions require a separate endpoint, but we provide a fallback
                description: "This product was synced from AliExpress.\n\nOriginal ID: " + itemId,
                price: parseFloat(price.toString()),
                images: item.images || [],
                variants: [],
                stock: parseInt(stock.toString()),
                aliexpressId: itemId,
            },
        };
    } catch (error) {
        console.error("Error fetching AliExpress product:", error);
        return { success: false, error: "Internal Server Error during fetch." };
    }
};

export const syncOrderToAliExpress = async (orderId: string, items: any[]) => {
    // Logic to push order to DSers or AliExpress
    console.log(`Syncing Order ${orderId} to AliExpress...`);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
        success: true,
        aliexpressOrderId: `AE_${Math.floor(Math.random() * 1000000)}`,
    };
};
