const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
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

// In-memory conversation history (For production, consider saving this to Redis or MongoDB)
const conversationState = {};

async function getProductCatalog() {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            select: { name: true, price: true, costPrice: true, description: true, stock: true }
        });
        return products;
    } catch (error) {
        console.error("Error fetching catalog:", error);
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

    const sock = makeWASocket({
        version, // Pass the dynamically fetched version
        auth: state,
        printQRInTerminal: !process.env.BOT_PHONE_NUMBER, // Only print QR if no phone number is provided
        logger: pino({ level: "silent" }), // Setting back to silent to keep it clean
        browser: ["Ubuntu", "Chrome", "20.0.04"] 
    });

    // Debugging info for Render
    console.log(`[DEBUG] BOT_PHONE_NUMBER from env:`, process.env.BOT_PHONE_NUMBER);
    console.log(`[DEBUG] Is registered?`, sock.authState.creds.registered);

    // If not logged in and a phone number is provided, use a Pairing Code!
    if (!sock.authState.creds.registered && process.env.BOT_PHONE_NUMBER) {
        console.log(`[DEBUG] Attempting to request pairing code...`);
        setTimeout(async () => {
            try {
                // Remove any +, spaces, or dashes from the number
                const cleanNumber = process.env.BOT_PHONE_NUMBER.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(cleanNumber);
                console.log(`\n╔══════════════════════════════════════════════╗`);
                console.log(`║   🚀 YOUR PAIRING CODE IS: ${code.padEnd(16)}║`);
                console.log(`╚══════════════════════════════════════════════╝\n`);
                console.log(`STEPS: Open WhatsApp on phone 0741206995`);
                console.log(`→ Tap (⋮) Menu → Linked Devices → Link a Device`);
                console.log(`→ Tap 'Link with phone number instead'`);
                console.log(`→ Enter the code above. You have 60 seconds!`);
                console.log(`→ If it expires, restart this service on Render.`);
            } catch (error) {
                console.error("Failed to request pairing code:", error.message);
            }
        }, 5000); // 5 second delay to ensure socket is fully ready
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr && !process.env.BOT_PHONE_NUMBER) {
            console.log("\nSCAN THIS QR CODE IN YOUR WHATSAPP TO LOG IN:\n");
            qrcode.generate(qr, { small: true });
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

            console.log("[DEBUG] Fetching product catalog from database...");
            // Get product catalog for context
            const catalog = await getProductCatalog();
            console.log(`[DEBUG] Catalog fetched successfully! Found ${catalog.length} products.`);

            const catalogString = catalog.map(p => `- ${p.name} (Price: KES ${p.price}, Minimum Cost Allowed: KES ${p.costPrice}, Stock: ${p.stock})`).join("\n");

            // Build Conversation Context
            if (!conversationState[remoteJid]) {
                conversationState[remoteJid] = [];
            }
            
            // Add user message to history
            conversationState[remoteJid].push({ role: "user", content: textMessage });

            // Keep only last 10 messages to save tokens
            if (conversationState[remoteJid].length > 10) {
                conversationState[remoteJid] = conversationState[remoteJid].slice(-10);
            }

            const systemPrompt = `You are a friendly, professional Kenyan sales agent for NairobiMart (a premier e-commerce store in Kenya). 
Your goal is to help customers find products, close sales, and ensure profitability.

Here is our current product catalog and real-time stock:
${catalogString}

STRICT OPERATING RULES:

1. THE "PROTECT THE PROFIT" RULE (Pricing & Negotiation):
- You may offer small discounts if the customer pushes for it.
- CRITICAL: You must NEVER, under any circumstances, agree to or offer a price lower than the "Minimum Cost Allowed" (costPrice).
- If they request a price below the costPrice, politely decline and state your "final offer" (which MUST be strictly greater than the costPrice).

2. THE "URGENCY & SCARCITY" RULE (Stock Management):
- Always check the stock quantity provided in the catalog.
- If an item has less than 5 in stock, warn the customer to create urgency (e.g., "We only have a few pieces left!").
- If stock is 0, politely tell them it is sold out and suggest another item. Do not sell out-of-stock items.

3. THE "KENYAN FLAVOR" RULE (Tone & Language):
- Be warm and welcoming. Use occasional Kenyan greetings (e.g., "Sasa!", "Karibu NairobiMart").
- Keep sentences short, punchy, and easy to read on a mobile phone.
- Use emojis naturally (🛒, ✨, 🚚, 🔥).

4. THE "PUSH TO CHECKOUT" RULE (Closing the Sale):
- You cannot manually collect M-Pesa payments over chat.
- Once a customer agrees to buy, explicitly instruct them to complete the order securely on the website: "Great! Please complete your order securely on our website: www.nairobimart.com. We accept M-Pesa and card payments at checkout!"

5. THE "STAY ON TOPIC" RULE:
- You are strictly a NairobiMart sales agent. 
- If the customer asks questions unrelated to shopping, NairobiMart, or products (e.g., writing poems, politics, homework), politely decline and steer the conversation back to shopping.`;

            console.log("[DEBUG] Contacting Groq AI for reply...");

            // Call Groq via OpenAI-compatible SDK
            const completion = await groq.chat.completions.create({
                model: "llama3-8b-8192", // Fast, free Groq model
                messages: [
                    { role: "system", content: systemPrompt },
                    ...conversationState[remoteJid]
                ],
                max_tokens: 500,
            });

            const replyText = completion.choices[0].message.content;
            console.log("[DEBUG] Gemini AI generated reply:", replyText);

            // Add bot reply to history
            conversationState[remoteJid].push({ role: "assistant", content: replyText });

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
