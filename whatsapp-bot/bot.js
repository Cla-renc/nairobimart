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


// HTTP server to satisfy Render's port binding requirement for Web Services
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WhatsApp Bot is running!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`HTTP Server listening on port ${PORT}`);
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

async function getProductCatalog() {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            select: { name: true, price: true, costPrice: true, stock: true, category: { select: { name: true } } },
            take: 25, // Limit to 25 products to stay within AI token limits
            orderBy: { createdAt: 'desc' }
        });
        return products;
    } catch (error) {
        console.error("Error fetching catalog:", error);
        return [];
    }
}

async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true, parentId: null }, // Top-level categories only
            select: { name: true },
            orderBy: { position: 'asc' }
        });
        return categories.map(c => c.name);
    } catch (error) {
        console.error("Error fetching categories:", error);
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
        console.error("Error searching products:", error);
        return [];
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
        version, // Pass the dynamically fetched version
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        printQRInTerminal: !process.env.BOT_PHONE_NUMBER, // Only print QR if no phone number is provided
        logger, 
        browser: Browsers.ubuntu('Chrome'),
        markOnlineOnConnect: false, // Prevents suspicious constant online status
        syncFullHistory: false, // Prevents memory crashes on reconnect
        generateHighQualityLinkPreview: false,
        getMessage: async (key) => {
            return { conversation: 'hello' }; // Dummy return to prevent crash on missing message
        }
    });

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
                        const cleanNumber = process.env.BOT_PHONE_NUMBER.replace(/[^0-9]/g, '');
                        const code = await sock.requestPairingCode(cleanNumber);
                        console.log(`\n╔══════════════════════════════════════════════╗`);
                        console.log(`║   🚀 YOUR PAIRING CODE IS: ${code.padEnd(16)}║`);
                        console.log(`╚══════════════════════════════════════════════╝\n`);
                        console.log(`STEPS: Open WhatsApp on your host phone`);
                        console.log(`→ Tap (⋮) Menu → Linked Devices → Link a Device`);
                        console.log(`→ Tap 'Link with phone number instead'`);
                        console.log(`→ Enter the code above. You have 60 seconds!`);
                        console.log(`→ If it expires, restart this service on Render.`);
                    } catch (error) {
                        console.error("Failed to request pairing code:", error.message);
                        pairingCodeRequested = false; // allow retry if it failed
                    }
                }, 3000);
                }
            } else {
                console.log("\nSCAN THIS QR CODE IN YOUR WHATSAPP TO LOG IN:\n");
                qrcode.generate(qr, { small: true });
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
            
            // Add a debug log to see if we're even receiving the event
            console.log("\n[DEBUG] Incoming message event:", JSON.stringify(msg.message ? Object.keys(msg.message) : "No message object"));
            console.log("[DEBUG] Is from me?", msg.key.fromMe);

            if (!msg.message || msg.key.fromMe) return;

            const remoteJid = msg.key.remoteJid;
            
            // Ignore status updates or group messages
            if (remoteJid.includes('@g.us') || remoteJid === 'status@broadcast') return;

            // Extract text
            const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
            
            if (!textMessage) {
                console.log("[DEBUG] Could not extract text from message. Message types:", Object.keys(msg.message));
                return;
            }

            console.log(`✅ Received text message from ${remoteJid}: ${textMessage}`);

            console.log("[DEBUG] Fetching product catalog and categories from database...");
            const [catalog, categoryNames] = await Promise.all([
                getProductCatalog(),
                getCategories()
            ]);
            console.log(`[DEBUG] Catalog fetched! Found ${catalog.length} products across ${categoryNames.length} categories.`);

            // Removed unused catalogString

            const categoriesString = categoryNames.join(", ");

            // Retrieve history from DB
            let conversationRecord = await prisma.whatsAppConversation.findUnique({ where: { remoteJid } });
            let chatHistory = conversationRecord ? conversationRecord.messages : [];
            
            // Add user message
            chatHistory.push({ role: "user", content: textMessage });

            // Keep only last 8 messages to save tokens
            if (chatHistory.length > 8) {
                chatHistory = chatHistory.slice(-8);
            }

            const websiteUrl = process.env.NEXT_PUBLIC_URL || "https://nairobimart-gwna.vercel.app";
            const systemPrompt = `You are a NairobiMart sales agent in Kenya. Be friendly, brief, and use Kenyan warmth.

OUR PRODUCT CATEGORIES:
${categoriesString}

IMPORTANT: We stock items across ALL the categories listed above. If a customer asks about a product, you should use the search_catalog tool to find it.

RULES:
1. Use the search_catalog tool to look up product prices and stock before answering.
2. If stock is OUT, say it's sold out and suggest alternatives.
3. If stock < 5, create urgency: "Only a few left!"
4. To buy: direct them to ${websiteUrl} (M-Pesa & card accepted).
5. Only discuss NairobiMart products. Decline off-topic requests politely.
6. Keep replies short and mobile-friendly. Use emojis (🛒✨🔥🚚).`;

            console.log("[DEBUG] Contacting Groq AI for reply...");

            const tools = [
                {
                    type: "function",
                    function: {
                        name: "search_catalog",
                        description: "Search the product catalog for specific items by keyword.",
                        parameters: {
                            type: "object",
                            properties: {
                                query: { type: "string", description: "Search keyword" }
                            },
                            required: ["query"]
                        }
                    }
                }
            ];

            // Call Groq
            let completion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...chatHistory
                ],
                tools: tools,
                tool_choice: "auto",
                max_tokens: 500,
            });

            const responseMessage = completion.choices[0].message;
            let replyText = responseMessage.content;

            // Handle tool calling
            if (responseMessage.tool_calls) {
                console.log("[DEBUG] Tool call detected:", responseMessage.tool_calls[0].function.name);
                chatHistory.push(responseMessage); // append tool call
                
                for (const toolCall of responseMessage.tool_calls) {
                    if (toolCall.function.name === "search_catalog") {
                        const args = JSON.parse(toolCall.function.arguments);
                        // Query the database directly for accurate, real-time results
                        const results = await searchProductsInDB(args.query);
                        const toolResult = results.length > 0 
                            ? results.map(p => `${p.name} | KES ${p.price} | Stock: ${p.stock > 0 ? p.stock : 'OUT OF STOCK'} | Category: ${p.category?.name || 'N/A'}`).join("\n")
                            : "No products found for that query.";
                        
                        chatHistory.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            content: toolResult
                        });
                    }
                }

                // Second call with tool results
                completion = await groq.chat.completions.create({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...chatHistory
                    ]
                });
                replyText = completion.choices[0].message.content;
            }

            console.log("[DEBUG] AI generated reply:", replyText);

            // Add bot reply to history
            chatHistory.push({ role: "assistant", content: replyText });

            // Save history back to DB
            await prisma.whatsAppConversation.upsert({
                where: { remoteJid },
                update: { messages: chatHistory },
                create: { remoteJid, messages: chatHistory }
            });

            console.log("[DEBUG] Sending message back to WhatsApp...");
            // Send reply on WhatsApp
            await sock.sendMessage(remoteJid, { text: replyText });
            console.log(`✅ Replied successfully to ${remoteJid}!`);

        } catch (error) {
            console.error("❌ Error processing message:", error);
        }
    });
}

startBot();
