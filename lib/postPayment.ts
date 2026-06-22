import prisma from "@/lib/prisma";
import { createCJOrder } from "@/lib/cjdropshipping";

export async function processSuccessfulPayment(orderId: string) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true, items: { include: { product: true } } }
        });

        if (!order) {
            console.error(`Post-Payment processing failed: Order ${orderId} not found`);
            return;
        }

        if (!order.cjOrderId) {
            console.log(`Automatically generating CJ Order for: ${order.orderNumber}`);
            
            // Map the items to CJ Order format
            const cjItems = order.items.map(item => ({
                product: { cjProductId: item.product.cjProductId || "" },
                variant: item.variantId ? { cjVariantId: item.variantId } : undefined,
                quantity: item.quantity
            })).filter(item => item.product.cjProductId); // Only include items that have a CJ ID
            
            if (cjItems.length === 0) {
                console.log(`Order ${order.orderNumber} contains no CJ Dropshipping items. Skipping CJ auto-submit.`);
                return;
            }

            const cjOrderData = {
                orderNumber: order.orderNumber,
                shippingCity: order.shippingCity || "",
                shippingProvince: order.shippingCounty || "",
                shippingAddress: order.shippingAddress || "",
                shippingName: order.shippingName || "Customer",
                shippingPhone: order.shippingPhone || "",
                items: cjItems
            };

            const result = await createCJOrder(cjOrderData);

            if (result.success && result.cjOrderId) {
                await prisma.order.update({
                    where: { id: orderId },
                    data: {
                        cjOrderId: result.cjOrderId,
                        notes: `CJ Order Auto-Submitted. CJ Order ID: ${result.cjOrderId}`
                    }
                });
                
                try {
                    await prisma.notification.create({
                        data: {
                            type: "cj_order",
                            title: "CJ Dropshipping Order Submitted",
                            message: `Order ${order.orderNumber} was successfully submitted to CJ Dropshipping. CJ Order ID: ${result.cjOrderId}`,
                            link: `/admin/orders/${order.id}`,
                        }
                    });
                } catch (notifErr) {
                    console.error("Failed to create CJ notification:", notifErr);
                }
                
                console.log(`Successfully generated CJ Order: ${result.cjOrderId}`);
            } else {
                console.error(`Failed to auto-generate CJ shipment: ${result.error}`);
                await prisma.order.update({
                    where: { id: orderId },
                    data: {
                        notes: `CJ Auto-Submit failed: ${result.error}`
                    }
                });
                
                try {
                    await prisma.notification.create({
                        data: {
                            type: "cj_error",
                            title: "CJ Dropshipping Submit Failed",
                            message: `Order ${order.orderNumber} failed to submit to CJ Dropshipping. Error: ${result.error}`,
                            link: `/admin/orders/${order.id}`,
                        }
                    });
                } catch (notifErr) {
                    console.error("Failed to create CJ error notification:", notifErr);
                }
            }
        } else {
            console.log(`Order ${order.orderNumber} already has CJ Order ID ${order.cjOrderId}`);
        }

    } catch (error) {
        console.error("Error in processSuccessfulPayment:", error);
    }
}
