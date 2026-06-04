/**
 * Motorspeed Courier API Integration
 * 
 * To use the real API, add these to your .env file:
 * MOTORSPEED_API_KEY=your_production_key_here
 * MOTORSPEED_API_URL=https://api.motorspeed.com/v1
 */

const MOTORSPEED_API_URL = process.env.MOTORSPEED_API_URL || "https://api.motorspeed.com/v1";
const MOTORSPEED_API_KEY = process.env.MOTORSPEED_API_KEY || "";

export interface ShippingQuoteRequest {
    country: string;
    county: string;
    city: string;
    weightKg?: number;
}

export interface ShippingQuoteResponse {
    success: boolean;
    fee: number;
    estimatedDays: string;
    message?: string;
}

export async function getMotorspeedQuote(request: ShippingQuoteRequest): Promise<ShippingQuoteResponse> {
    try {
        // If API key is not set, throw an error because this is a production environment.
        if (!MOTORSPEED_API_KEY) {
            throw new Error("Motorspeed API key is missing. Please check your .env variables.");
        }

        const response = await fetch(`${MOTORSPEED_API_URL}/quotes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${MOTORSPEED_API_KEY}`
            },
            body: JSON.stringify({
                destination_country: request.country,
                destination_region: request.county,
                destination_city: request.city,
                weight: request.weightKg || 1, // Default 1kg
                service_type: "door_to_door"
            })
        });

        if (!response.ok) {
            throw new Error(`Motorspeed API Error: ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
            success: true,
            fee: data.shipping_fee,
            estimatedDays: data.estimated_delivery_time || "2-4 days"
        };
        console.error("Failed to fetch Motorspeed quote:", error);
        return {
            success: false,
            fee: 0,
            estimatedDays: "",
            message: error instanceof Error ? error.message : "Failed to connect to Motorspeed Courier"
        };
    }
}
