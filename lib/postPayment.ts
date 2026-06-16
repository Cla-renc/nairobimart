import prisma from "@/lib/prisma";
import { createDhlShipment } from "@/lib/dhl";

export async function processSuccessfulPayment(orderId: string) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true }
        });

        if (!order) {
            console.error(`Post-Payment processing failed: Order ${orderId} not found`);
            return;
        }

        // We only generate a DHL waybill for "door" deliveries 
        // (pickupStationId is null and they paid a shipping fee, or we can check the absence of pickupStation)
        if (!order.pickupStationId && !order.trackingNumber) {
            console.log(`Generating DHL shipment for order: ${order.orderNumber}`);
            
            const shipmentResult = await createDhlShipment({
                orderNumber: order.orderNumber,
                customerName: order.shippingName,
                customerEmail: order.user?.email || undefined,
                customerPhone: order.shippingPhone,
                customerAddress: order.shippingAddress,
                customerCity: order.shippingCity,
                customerCountry: order.shippingCountry,
                weightKg: 1, // Defaulting to 1kg, in a full app we'd sum order.items weight
                description: `Order ${order.orderNumber} from NairobiMart`
            });

            if (shipmentResult.success && shipmentResult.trackingNumber) {
                await prisma.order.update({
                    where: { id: orderId },
                    data: {
                        trackingNumber: shipmentResult.trackingNumber,
                        trackingUrl: shipmentResult.trackingUrl,
                        notes: `DHL Waybill Generated. Tracking: ${shipmentResult.trackingNumber}`
                    }
                });
                console.log(`Successfully generated DHL Waybill. Tracking: ${shipmentResult.trackingNumber}`);
            } else {
                console.error(`Failed to generate DHL shipment: ${shipmentResult.message}`);
                await prisma.order.update({
                    where: { id: orderId },
                    data: {
                        notes: `DHL Shipment generation failed: ${shipmentResult.message}`
                    }
                });
            }
        } else if (order.trackingNumber) {
            console.log(`Order ${order.orderNumber} already has tracking number ${order.trackingNumber}`);
        } else {
            console.log(`Order ${order.orderNumber} is a local pickup. No DHL shipment required.`);
        }

    } catch (error) {
        console.error("Error in processSuccessfulPayment:", error);
    }
}
