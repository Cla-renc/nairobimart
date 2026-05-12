import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createCJOrder } from "@/lib/cjdropshipping";

export async function POST(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const orderId = params.id;

        // 1. Fetch order with items and product detail (CJ Product ID)
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true,
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.cjOrderId) {
            return NextResponse.json({ error: "Order already submitted to CJ", cjOrderId: order.cjOrderId }, { status: 400 });
        }

        // 2. Prepare Data for CJ API
        const cjOrderData = {
            orderNumber: order.orderNumber,
            shippingName: order.shippingName,
            shippingPhone: order.shippingPhone,
            shippingAddress: order.shippingAddress,
            shippingCity: order.shippingCity,
            shippingProvince: order.shippingCounty || "Kenya",
            items: order.items.map((item) => {
                if (!item.product.cjProductId) {
                    throw new Error(`Product ${item.product.name} is not a CJ product.`);
                }
                return {
                    product: { cjProductId: item.product.cjProductId },
                    quantity: item.quantity,
                    // Note: We are defaulting to product ID for variant ID if no specific variant is linked
                    // This is a common pattern for CJ simplified dropshipping
                };
            })
        };

        // 3. Submit to CJ
        const result = await createCJOrder(cjOrderData);

        if (!result.success) {
            return NextResponse.json({ error: result.error || "Failed to submit to CJ" }, { status: 500 });
        }

        // 4. Update order with CJ Order ID
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                cjOrderId: result.cjOrderId as string,
                status: "processing", // Move to processing if not already
                notes: order.notes ? `${order.notes}\n[CJ-SYNC] Submitted to CJ: ${result.cjOrderId}` : `[CJ-SYNC] Submitted to CJ: ${result.cjOrderId}`
            }
        });

        return NextResponse.json({
            success: true,
            cjOrderId: result.cjOrderId,
            cjOrderNumber: result.cjOrderNumber,
            order: updatedOrder
        });

    } catch (error: any) {
        console.error("Error submitting order to CJ:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
