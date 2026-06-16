/**
 * DHL Express (MyDHL) API Integration
 * 
 * To use the real API, add these to your .env file:
 * DHL_API_KEY=your_production_key_here
 * DHL_API_SECRET=your_production_secret_here
 * DHL_ACCOUNT_NUMBER=your_dhl_account_number
 * DHL_API_URL=https://express.api.dhl.com/mydhlapi/rates
 */

const DHL_API_URL = process.env.DHL_API_URL || "https://api-mock.dhl.com/mydhlapi/rates";
const DHL_API_KEY = process.env.DHL_API_KEY || "";
const DHL_API_SECRET = process.env.DHL_API_SECRET || "";
const DHL_ACCOUNT_NUMBER = process.env.DHL_ACCOUNT_NUMBER || "";

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

export async function getDhlQuote(request: ShippingQuoteRequest): Promise<ShippingQuoteResponse> {
    try {
        if (!DHL_API_KEY || !DHL_API_SECRET || !DHL_ACCOUNT_NUMBER) {
            console.warn("DHL API credentials are missing. Simulating DHL quote for development.");
            // Return a simulated quote if keys are missing so the checkout doesn't break during dev
            return {
                success: true,
                fee: 850, // Standard simulated DHL fee
                estimatedDays: "2-3 days",
            };
        }

        const authHeader = `Basic ${Buffer.from(`${DHL_API_KEY}:${DHL_API_SECRET}`).toString('base64')}`;
        
        // DHL API requires timestamps in specific format
        const plannedShippingDate = new Date();
        plannedShippingDate.setDate(plannedShippingDate.getDate() + 1); // Tomorrow
        const dateStr = plannedShippingDate.toISOString().split('.')[0] + "GMT+03:00"; // Assuming Kenya timezone offset

        // Get origin from env or default to Nairobi, Kenya
        const originCountryCode = process.env.STORE_COUNTRY_CODE || "KE";
        const originCityName = process.env.STORE_CITY || "Nairobi";

        // Map standard country names to ISO 2-character codes if needed
        // Here we do a basic check, but a full integration might need a robust mapper
        let destCountryCode = "KE";
        if (request.country.toLowerCase() === "uganda") destCountryCode = "UG";
        if (request.country.toLowerCase() === "tanzania") destCountryCode = "TZ";

        // Build the URL with query parameters for DHL Rating API
        const queryParams = new URLSearchParams({
            accountNumber: DHL_ACCOUNT_NUMBER,
            originCountryCode: originCountryCode,
            originCityName: originCityName,
            destinationCountryCode: destCountryCode,
            destinationCityName: request.city,
            weight: (request.weightKg || 1).toString(),
            length: "10",
            width: "10",
            height: "10",
            plannedShippingDateAndTime: dateStr,
            isCustomsDeclarable: "false",
            unitOfMeasurement: "metric"
        });

        const response = await fetch(`${DHL_API_URL}?${queryParams.toString()}`, {
            method: "GET",
            headers: {
                "Authorization": authHeader,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DHL API Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        // Find the best or cheapest product returned by DHL
        if (data && data.products && data.products.length > 0) {
            // Defaulting to the first available product (usually the standard express option)
            const product = data.products[0];
            const priceInfo = product.totalPrice ? product.totalPrice[0] : null;
            
            return {
                success: true,
                fee: priceInfo ? parseFloat(priceInfo.price) : 850,
                estimatedDays: product.deliveryCapabilities?.estimatedDeliveryDateAndTime 
                    ? new Date(product.deliveryCapabilities.estimatedDeliveryDateAndTime).toLocaleDateString()
                    : "2-4 days"
            };
        } else {
            throw new Error("DHL returned no available products for this route.");
        }

    } catch (error) {
        console.error("Failed to fetch DHL Express quote:", error);
        return {
            success: false,
            fee: 0,
            estimatedDays: "",
            message: error instanceof Error ? error.message : "Failed to connect to DHL Express"
        };
    }
}

export interface ShipmentRequest {
    orderNumber: string;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    customerAddress: string;
    customerCity: string;
    customerCountry: string;
    weightKg: number;
    description: string;
}

export async function createDhlShipment(request: ShipmentRequest) {
    try {
        if (!DHL_API_KEY || !DHL_API_SECRET || !DHL_ACCOUNT_NUMBER) {
            console.warn("DHL API credentials missing. Simulating shipment creation.");
            return {
                success: true,
                trackingNumber: `MOCK-DHL-${request.orderNumber}`,
                trackingUrl: `https://www.dhl.com/track?trackingNumber=MOCK-DHL-${request.orderNumber}`
            };
        }

        const DHL_SHIPMENT_API_URL = process.env.DHL_API_URL 
            ? process.env.DHL_API_URL.replace("/rates", "/shipments") 
            : "https://api-mock.dhl.com/mydhlapi/shipments";

        const authHeader = `Basic ${Buffer.from(`${DHL_API_KEY}:${DHL_API_SECRET}`).toString('base64')}`;

        const plannedShippingDate = new Date();
        plannedShippingDate.setDate(plannedShippingDate.getDate() + 1); // Tomorrow
        const dateStr = plannedShippingDate.toISOString().split('.')[0] + "GMT+03:00";

        // Mapped ISO country codes
        let destCountryCode = "KE";
        if (request.customerCountry.toLowerCase() === "uganda") destCountryCode = "UG";
        if (request.customerCountry.toLowerCase() === "tanzania") destCountryCode = "TZ";

        const payload = {
            plannedShippingDateAndTime: dateStr,
            pickup: {
                isRequested: false
            },
            productCode: "P", // Standard Express Worldwide
            accounts: [
                {
                    typeCode: "shipper",
                    number: DHL_ACCOUNT_NUMBER
                }
            ],
            customerDetails: {
                shipperDetails: {
                    postalAddress: {
                        postalCode: "00100",
                        cityName: process.env.STORE_CITY || "Nairobi",
                        countryCode: process.env.STORE_COUNTRY_CODE || "KE",
                        addressLine1: process.env.STORE_ADDRESS || "Nairobi West, Apartment 4B"
                    },
                    contactInformation: {
                        email: process.env.STORE_EMAIL || "support@nairobimart.com",
                        phone: process.env.STORE_PHONE || "+254700000000",
                        companyName: "NairobiMart",
                        fullName: "NairobiMart Dispatch"
                    }
                },
                receiverDetails: {
                    postalAddress: {
                        cityName: request.customerCity,
                        countryCode: destCountryCode,
                        addressLine1: request.customerAddress
                    },
                    contactInformation: {
                        email: request.customerEmail || "customer@example.com",
                        phone: request.customerPhone,
                        companyName: request.customerName,
                        fullName: request.customerName
                    }
                }
            },
            content: {
                packages: [
                    {
                        weight: request.weightKg || 1,
                        dimensions: {
                            length: 10,
                            width: 10,
                            height: 10
                        }
                    }
                ],
                isCustomsDeclarable: false,
                description: request.description || "NairobiMart Order",
                incoterm: "DAP",
                unitOfMeasurement: "metric"
            }
        };

        const response = await fetch(DHL_SHIPMENT_API_URL, {
            method: "POST",
            headers: {
                "Authorization": authHeader,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DHL Shipment API Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        return {
            success: true,
            trackingNumber: data.shipmentTrackingNumber,
            trackingUrl: `https://www.dhl.com/track?trackingNumber=${data.shipmentTrackingNumber}`,
            documents: data.documents
        };

    } catch (error) {
        console.error("Failed to create DHL shipment:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to create DHL shipment"
        };
    }
}
