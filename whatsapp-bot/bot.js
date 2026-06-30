/* eslint-disable */
const { makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { PrismaClient } = require('@prisma/client');
const { useMongoDBAuthState } = require('./mongoAuthState');
const { OpenAI } = require('openai');
const pino = require('pino');
const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });


// HTTP server to satisfy Render's port binding requirement and handle API requests
const express = require('express');
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('WhatsApp Bot is running!');
});

// We will inject the sock instance here once it's created
let whatsappSocket = null;

app.post('/api/send-dispatch', async (req, res) => {
    try {
        const { phone, customerName, orderNumber, trackingUrl } = req.body;
        
        if (!phone || !whatsappSocket) {
            return res.status(400).json({ error: "Missing phone or socket not ready" });
        }

        // Format phone number to JID
        let jid = phone.replace(/[^0-9]/g, '');
        if (jid.startsWith('0')) jid = '254' + jid.slice(1);
        jid = jid + '@s.whatsapp.net';

        const message = `🚚 *NairobiMart Dispatch Alert*\n\nHello ${customerName},\n\nYour order *${orderNumber}* has just been dispatched to a rider!\n\nTrack your delivery here: ${trackingUrl}\n\nThank you for shopping with us! ✨`;

        await whatsappSocket.sendMessage(jid, { text: message });
        
        res.json({ success: true, message: "Dispatch notification sent" });
    } catch (error) {
        console.error("Error sending dispatch notification:", error);
        res.status(500).json({ error: "Failed to send notification" });
    }
});

// Generic send-message endpoint — used by webhooks to send any message to a customer
app.post('/api/send-message', async (req, res) => {
    try {
        const { phone, message } = req.body;
        if (!phone || !message || !whatsappSocket) {
            return res.status(400).json({ error: "Missing phone/message or socket not ready" });
        }
        let jid = phone.replace(/[^0-9]/g, '');
        if (jid.startsWith('0')) jid = '254' + jid.slice(1);
        jid = jid + '@s.whatsapp.net';
        await whatsappSocket.sendMessage(jid, { text: message });
        res.json({ success: true, message: "Message sent" });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
});

// Admin endpoint to clear WhatsApp session from MongoDB and force fresh pairing
app.post('/clear-session', async (req, res) => {
    try {
        await prisma.whatsAppSession.deleteMany({});
        res.json({ success: true, message: '✅ Session cleared. Restart the Render service to get a fresh pairing code.' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Express HTTP Server listening on port ${PORT}`);
});

const prisma = new PrismaClient();

// Ensure Groq API key exists
if (!process.env.GROQ_API_KEY) {
    console.error("❌ CRITICAL ERROR: GROQ_API_KEY is missing from environment variables.");
    process.exit(1);
}

// Initialize Groq client via OpenAI SDK (fully compatible)
const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

// In-memory conversation history removed. State is now persisted to MongoDB via Prisma.
const WEBSITE_URL = process.env.NEXT_PUBLIC_URL || 'https://nairobimart-gwna.vercel.app';
const ORDER_PREFIX = '*ORDER REQUEST*'; // Magic prefix from the WhatsApp Order button (omitting emoji for robustness)

async function getProductCatalog() {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            select: { name: true, price: true, costPrice: true, stock: true, category: { select: { name: true } } },
            take: 25,
            orderBy: { createdAt: 'desc' }
        });
        return products;
    } catch (error) {
        console.error('Error fetching catalog:', error);
        return [];
    }
}

async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true, parentId: null },
            select: { name: true },
            orderBy: { position: 'asc' }
        });
        return categories.map(c => c.name);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

async function searchProductsInDB(query) {
    try {
        const results = await prisma.product.findMany({
            where: {
                isActive: true,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                ]
            },
            select: { name: true, price: true, stock: true, category: { select: { name: true } } },
            take: 8
        });
        return results;
    } catch (error) {
        console.error('Error searching products:', error);
        return [];
    }
}

async function getProductById(productId) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                id: true, name: true, price: true, costPrice: true, comparePrice: true,
                stock: true, isFlashSale: true, flashSalePrice: true, flashSaleEndsAt: true,
                category: { select: { name: true } }
            }
        });
        return product;
    } catch (error) {
        console.error('Error fetching product by id:', error);
        return null;
    }
}

// Calls the Next.js backend to create a WhatsApp order in the DB
async function callBotCreateOrder(params) {
    try {
        const res = await fetch(`${WEBSITE_URL}/api/bot/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        return await res.json();
    } catch (e) {
        console.error('callBotCreateOrder error:', e);
        return { success: false, error: e.message };
    }
}

// Calls the Next.js backend to trigger PayHero or Pesapal payment
async function callBotTriggerPayment(params) {
    try {
        const res = await fetch(`${WEBSITE_URL}/api/bot/trigger-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        return await res.json();
    } catch (e) {
        console.error('callBotTriggerPayment error:', e);
        return { success: false, error: e.message };
    }
}


async function startBot() {
    console.log("Starting NairobiMart AI WhatsApp Bot...");

    const { state, saveCreds } = await useMongoDBAuthState(prisma);
    console.log('✅ Loaded auth state from MongoDB.');
    
    // Fetch the latest WhatsApp Web version to prevent 405 connection errors
    const { fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using WhatsApp v${version.join('.')}, isLatest: ${isLatest}`);

    const logger = pino({ level: "silent" });
    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        printQRInTerminal: !process.env.BOT_PHONE_NUMBER,
        logger,
        // macOS Chrome is required for pairing code flow to work correctly
        browser: Browsers.macOS('Chrome'),
        markOnlineOnConnect: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        getMessage: async (key) => {
            return { conversation: 'hello' };
        }
    });

    whatsappSocket = sock; // Expose socket to Express for dispatch notifications

    // Debugging info for Render
    console.log(`[DEBUG] BOT_PHONE_NUMBER from env:`, process.env.BOT_PHONE_NUMBER);
    console.log(`[DEBUG] Is registered?`, sock.authState.creds.registered);

    // We will request pairing code only when the socket tells us it's ready (via the qr event)

    sock.ev.on('creds.update', saveCreds);

    let pairingCodeRequested = false;

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr && !sock.authState.creds.registered) {
            if (process.env.BOT_PHONE_NUMBER) {
                if (!pairingCodeRequested) {
                    pairingCodeRequested = true;
                    console.log(`[DEBUG] Socket ready! Requesting pairing code...`);
                    // Short delay to ensure crypto is ready
                    setTimeout(async () => {
                    try {
                        const rawNumber = process.env.BOT_PHONE_NUMBER || '';
                        const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
                        console.log(`[PAIRING] Raw BOT_PHONE_NUMBER: "${rawNumber}"`);
                        console.log(`[PAIRING] Cleaned number being used: "${cleanNumber}"`);
                        console.log(`[PAIRING] Make sure this EXACTLY matches the WhatsApp Business number on your phone!`);
                        const code = await sock.requestPairingCode(cleanNumber);
                        console.log(`\n╔══════════════════════════════════════════════╗`);
                        console.log(`║   🚀 YOUR PAIRING CODE IS: ${code.padEnd(16)}║`);
                        console.log(`╚══════════════════════════════════════════════╝\n`);
                        console.log(`STEPS: Open WhatsApp Business on your phone`);
                        console.log(`→ Tap (⋮) Menu → Linked Devices → Link a Device`);
                        console.log(`→ Tap 'Link with phone number instead'`);
                        console.log(`→ Enter the code above. You have 60 seconds!`);
                        console.log(`→ The linked number must match: ${cleanNumber}`);
                    } catch (error) {
                        console.error("Failed to request pairing code:", error.message);
                        pairingCodeRequested = false;
                    }
                }, 3000);
                }
            } else {
                console.log("\nSCAN THIS QR CODE IN YOUR WHATSAPP TO LOG IN:\n");
                qrcode.generate(qr, { small: true });
                console.log("\n🚨 IF THE QR CODE ABOVE IS DISTORTED BY LOG PREFIXES, CLICK THIS LINK INSTEAD:");
                console.log(`👉 https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qr)} \n`);
            }
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const reason = lastDisconnect?.error?.data?.reason;
            console.log(`connection closed. Status: ${statusCode}, Reason: ${reason}`);

            // 401 = WhatsApp rejected our session (corrupted/expired login)
            if (statusCode === 401 || reason === '401') {
                console.log('⚠️  Session rejected by WhatsApp (401). Clearing MongoDB session and restarting...');
                // Clear the session from MongoDB
                try {
                    await prisma.whatsAppSession.deleteMany({});
                    console.log('🗑️  MongoDB session cleared. Restarting bot...');
                } catch(e) {
                    console.error('Failed to clear MongoDB session:', e.message);
                }
                setTimeout(startBot, 3000);
            } else if (statusCode !== DisconnectReason.loggedOut) {
                console.log('Reconnecting...');
                setTimeout(startBot, 5000);
            } else {
                console.log('Logged out. Please restart the service to get a new pairing code.');
            }
        } else if (connection === 'open') {
            console.log('✅ Bot successfully connected to WhatsApp!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            console.log('\n[DEBUG] Incoming message event:', JSON.stringify(msg.message ? Object.keys(msg.message) : 'No message object'));
            console.log('[DEBUG] Is from me?', msg.key.fromMe);

            if (!msg.message || msg.key.fromMe) return;

            const remoteJid = msg.key.remoteJid;
            if (remoteJid.includes('@g.us') || remoteJid === 'status@broadcast') return;

            const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
            if (!textMessage) {
                console.log('[DEBUG] Could not extract text. Types:', Object.keys(msg.message));
                return;
            }

            console.log(`✅ Received from ${remoteJid}: ${textMessage}`);

            // ─── LOAD CHAT HISTORY FIRST ─────────────────────────────
            let conversationRecord = await prisma.whatsAppConversation.findUnique({ where: { remoteJid } });
            let chatHistory = conversationRecord ? conversationRecord.messages : [];
            chatHistory.push({ role: 'user', content: textMessage });
            if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);

            // ─── DETECT MODE ──────────────────────────────────────────
            // If the current message, OR any message in the recent history, is an order request, we stay in Order Mode.
            const isOrderMode = chatHistory.some(msg => 
                msg.role === 'user' && msg.content.includes(ORDER_PREFIX)
            );

            // ─── BUILD SYSTEM PROMPT ─────────────────────────────────
            let systemPrompt;

            if (isOrderMode) {
                systemPrompt = `You are NairobiMart's AI Sales Agent. A customer has clicked the "Order via WhatsApp" button on our website.
You are in SALES & CHECKOUT MODE. Your job is to guide them through the full purchase.

PRODUCT INFO is included in their opening message (name, productId, price, quantity, flash sale status).

RULES:
1. Use get_product_details tool with the productId from the message to get live stock and pricing.
2. If OUT OF STOCK, apologize and do not proceed.
3. Quote the price breakdown clearly:
   - Product: KES [price]
   - Shipping: KES [amount] (use calculate_shipping tool)
   - TOTAL: KES [grand total]
4. FLASH SALE products: Apply the flashSalePrice automatically. Tell the customer it's on flash sale 🔥
5. NEGOTIATION: Only if the product has a comparePrice (discount already applied):
   - You may offer a small additional discount.
   - NEVER go below costPrice × 1.15. If they push below that, politely decline.
   - If product has NO comparePrice (full price), do NOT negotiate.
6. Once price agreed, collect in order:
   a. Full Name
   b. Country (Kenya / Uganda / Tanzania)
   c. Town & Delivery Address
   d. Phone Number (for M-Pesa payment)
   e. Email (optional, for receipt)
7. Once you have ALL details (a-d required), call the create_order tool. The system will automatically send the M-Pesa prompt to their phone.
8. After calling create_order, tell the customer to wait for an M-Pesa prompt on their phone. Say: "Please check your phone for the M-Pesa prompt and enter your PIN."
9. NEVER send them back to the website to pay — complete the sale here in WhatsApp.
10. YOU MUST CALL the create_order tool. Do NOT invent order IDs. Do NOT tell them to pay on the website!

Be warm, friendly, use Kenyan energy! Emojis encouraged: 🛒✨🔥🚚💳`;
            } else {
                // Standard support mode (unchanged)
                const [catalog, categoryNames] = await Promise.all([getProductCatalog(), getCategories()]);
                const categoriesString = categoryNames.join(', ');
                systemPrompt = `You are a NairobiMart sales agent in Kenya. Be friendly, brief, and use Kenyan warmth.

OUR PRODUCT CATEGORIES:
${categoriesString}

IMPORTANT: We stock items across ALL the categories listed above. If a customer asks about a product, you should use the search_catalog tool to find it.

RULES:
1. Use the search_catalog tool to look up product prices and stock before answering.
2. If stock is OUT, say it's sold out and suggest alternatives.
3. If stock < 5, create urgency: "Only a few left!"
4. To buy: direct them to ${process.env.NEXT_PUBLIC_URL || 'https://nairobimart-gwna.vercel.app'} (M-Pesa & card accepted).
5. Only discuss NairobiMart products. Decline off-topic requests politely.
6. Keep replies short and mobile-friendly. Use emojis (🛒✨🔥🚚).`;
            }

            // ─── DEFINE TOOLS ─────────────────────────────────────────
            const commonTools = [
                {
                    type: 'function',
                    function: {
                        name: 'search_catalog',
                        description: 'Search the product catalog for specific items by keyword.',
                        parameters: { type: 'object', properties: { query: { type: 'string', description: 'Search keyword' } }, required: ['query'] }
                    }
                }
            ];

            const salesTools = [
                {
                    type: 'function',
                    function: {
                        name: 'get_product_details',
                        description: 'Get full product details including costPrice, flashSalePrice, stock, and comparePrice.',
                        parameters: { type: 'object', properties: { productId: { type: 'string' } }, required: ['productId'] }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'calculate_shipping',
                        description: 'Calculate shipping cost for a product to a country.',
                        parameters: {
                            type: 'object',
                            properties: {
                                productId: { type: 'string' },
                                quantity: { type: 'number' },
                                country: { type: 'string', description: 'kenya, uganda, or tanzania' }
                            },
                            required: ['productId', 'quantity', 'country']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'create_order',
                        description: 'Create a WhatsApp order in the database after collecting all customer details.',
                        parameters: {
                            type: 'object',
                            properties: {
                                productId: { type: 'string' },
                                quantity: { type: 'number' },
                                agreedPriceKes: { type: 'number' },
                                customerName: { type: 'string' },
                                customerPhone: { type: 'string' },
                                customerEmail: { type: 'string' },
                                country: { type: 'string' },
                                deliveryAddress: { type: 'string' }
                            },
                            required: ['productId', 'quantity', 'agreedPriceKes', 'customerName', 'customerPhone', 'country', 'deliveryAddress']
                        }
                    }
                },
            ];
            // NOTE: trigger_payment is intentionally NOT an AI tool.
            // The bot code triggers payment automatically after create_order succeeds.

            const tools = isOrderMode ? [...salesTools, ...commonTools] : commonTools;

            // ─── FIRST AI CALL ────────────────────────────────────────
            console.log('[DEBUG] Calling Groq AI...');
            let completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'system', content: systemPrompt }, ...chatHistory],
                tools,
                tool_choice: 'auto',
                max_tokens: 600,
            });

            let responseMessage = completion.choices[0].message;
            let replyText = responseMessage.content;

            // ─── TOOL CALL HANDLING ───────────────────────────────────
            const maxToolRounds = 4;
            let toolRound = 0;

            while (responseMessage.tool_calls && toolRound < maxToolRounds) {
                toolRound++;
                console.log('[DEBUG] Tool call round', toolRound);
                chatHistory.push(responseMessage);

                for (const toolCall of responseMessage.tool_calls) {
                    const args = JSON.parse(toolCall.function.arguments);
                    let toolResult = '';

                    if (toolCall.function.name === 'search_catalog') {
                        const results = await searchProductsInDB(args.query);
                        toolResult = results.length > 0
                            ? results.map(p => `${p.name} | KES ${p.price} | Stock: ${p.stock > 0 ? p.stock : 'OUT OF STOCK'} | Category: ${p.category?.name || 'N/A'}`).join('\n')
                            : 'No products found for that query.';

                    } else if (toolCall.function.name === 'get_product_details') {
                        const product = await getProductById(args.productId);
                        if (!product) {
                            toolResult = 'Product not found.';
                        } else {
                            const isFlash = product.isFlashSale && product.flashSalePrice;
                            const MIN_FLOOR = Math.round((product.costPrice || product.price * 0.7) * 1.15);
                            toolResult = JSON.stringify({
                                name: product.name,
                                price: isFlash ? product.flashSalePrice : product.price,
                                originalPrice: product.price,
                                costPrice: product.costPrice,
                                minFloor: MIN_FLOOR,
                                comparePrice: product.comparePrice,
                                canNegotiate: !!product.comparePrice,
                                isFlashSale: isFlash,
                                flashSaleEndsAt: product.flashSaleEndsAt,
                                stock: product.stock,
                                category: product.category?.name
                            });
                        }

                    } else if (toolCall.function.name === 'calculate_shipping') {
                        const orderResult = await callBotCreateOrder({
                            productId: args.productId,
                            quantity: args.quantity || 1,
                            country: args.country,
                            deliveryAddress: 'estimate',
                            customerName: 'estimate',
                            customerPhone: '0700000000',
                            agreedPriceKes: 0,
                        });
                        if (orderResult.success) {
                            toolResult = `Shipping to ${args.country}: ${orderResult.currency} ${orderResult.shippingFeeLocal} via ${orderResult.shippingMethod}. Estimated delivery: ${orderResult.estimatedDays} days.`;
                        } else {
                            toolResult = `Could not calculate shipping: ${orderResult.error}`;
                        }

                    } else if (toolCall.function.name === 'create_order') {
                        const orderResult = await callBotCreateOrder(args);

                        // ── AUTO TRIGGER PAYMENT after successful order creation ──
                        // This is done in CODE, not by the AI, to guarantee it always happens.
                        if (orderResult.success) {
                            console.log(`[DEBUG] Order created: ${orderResult.orderNumber}. Auto-triggering payment...`);
                            console.log(`[DEBUG] Payment method: ${orderResult.paymentMethod}, Amount: ${orderResult.totalKes}, Phone: ${orderResult.customerPhone}`);

                            const payResult = await callBotTriggerPayment({
                                orderId: orderResult.orderId,
                                orderNumber: orderResult.orderNumber,
                                paymentMethod: orderResult.paymentMethod,
                                amount: orderResult.totalKes,
                                customerPhone: orderResult.customerPhone || args.customerPhone,
                                customerName: args.customerName,
                                customerEmail: args.customerEmail || '',
                                country: orderResult.country,
                            });

                            console.log(`[DEBUG] Payment trigger result:`, JSON.stringify(payResult));

                            if (payResult.success) {
                                // Kenya M-Pesa: tell them to check phone for prompt
                                const pendingMsg = `✅ *Order created!* Now let's get you paid 📱

I've sent an *M-Pesa STK Push* to *${args.customerPhone}*.

👉 *Check your phone now* and *enter your M-Pesa PIN* to pay *KES ${orderResult.totalKes?.toLocaleString()}*.

Your *Order Number* and receipt will be sent here the moment payment is confirmed! 🎉

_Didn't get the prompt? Make sure your phone number is correct, then reply "retry"._`;

                                chatHistory.push({ role: 'assistant', content: pendingMsg });
                                await prisma.whatsAppConversation.upsert({
                                    where: { remoteJid },
                                    update: { messages: chatHistory },
                                    create: { remoteJid, messages: chatHistory }
                                });
                                await sock.sendMessage(remoteJid, { text: pendingMsg });
                                console.log(`✅ M-Pesa STK push sent successfully for order ${orderResult.orderNumber}`);
                                return; // Done — webhook will send order confirmation after payment
                            } else {
                                // Payment trigger failed — tell the AI so it can handle gracefully
                                toolResult = JSON.stringify({ ...orderResult, paymentError: payResult.error || 'Payment trigger failed' });
                            }
                        } else {
                            toolResult = JSON.stringify(orderResult);
                        }

                    chatHistory.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: toolResult
                    });
                }

                // Follow-up AI call with tool results
                completion = await groq.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'system', content: systemPrompt }, ...chatHistory],
                    tools,
                    tool_choice: 'auto',
                    max_tokens: 600,
                });
                responseMessage = completion.choices[0].message;
                replyText = responseMessage.content;
            }

            console.log('[DEBUG] Final reply:', replyText);

            // ─── SAVE HISTORY & REPLY ─────────────────────────────────
            chatHistory.push({ role: 'assistant', content: replyText });
            await prisma.whatsAppConversation.upsert({
                where: { remoteJid },
                update: { messages: chatHistory },
                create: { remoteJid, messages: chatHistory }
            });

            await sock.sendMessage(remoteJid, { text: replyText });
            console.log(`✅ Replied to ${remoteJid}!`);

        } catch (error) {
            console.error('❌ Error processing message:', error);
        }
    });
}

startBot();
