import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
        }

        // Mock Sendy/Little API Call Delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Update Order Status to "shipped" indicating it has been dispatched
        const order = await prisma.order.update({
            where: { id: orderId },
            data: { 
                status: 'shipped',
                trackingNumber: `SNDY-${Math.floor(Math.random() * 1000000)}`,
                trackingUrl: `https://track.sendyit.com/${Math.floor(Math.random() * 1000000)}`
            },
            include: {
                user: true
            }
        });

        // Trigger WhatsApp Notification
        // We do this via HTTP POST to the Baileys server
        try {
            const botUrl = process.env.WHATSAPP_BOT_URL || 'http://localhost:3000';
            const phone = order.shippingPhone || order.user?.phone;
            
            if (phone) {
                await fetch(`${botUrl}/api/send-dispatch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone,
                        customerName: order.shippingName || order.user?.name || "Customer",
                        orderNumber: order.orderNumber,
                        trackingUrl: order.trackingUrl
                    })
                });
                console.log(`Triggered WhatsApp dispatch notification for ${order.orderNumber}`);
            }
        } catch (botError) {
            console.error("Failed to trigger WhatsApp bot:", botError);
            // We don't fail the dispatch if the bot fails
        }

        return NextResponse.json({ 
            success: true, 
            trackingUrl: order.trackingUrl,
            message: "Rider dispatched successfully" 
        });

    } catch (error) {
        console.error("Dispatch API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
