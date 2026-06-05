const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { PrismaClient } = require('@prisma/client');
const { OpenAI } = require('openai');
const pino = require('pino');
const http = require('http');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') }); // Load env variables from parent dir

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

// Ensure Gemini API key exists
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ CRITICAL ERROR: GEMINI_API_KEY is missing from environment variables.");
    console.error("Please add it to your .env or .env.local file.");
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/", // Use Gemini via OpenAI compatibility layer
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

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    // Fetch the latest WhatsApp Web version to prevent 405 connection errors
    const { fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using WhatsApp v${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version, // Pass the dynamically fetched version
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }), // Setting back to silent to keep it clean
        browser: ["Ubuntu", "Chrome", "20.0.04"] 
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log("\nSCAN THIS QR CODE IN YOUR WHATSAPP TO LOG IN:\n");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                startBot();
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

            const systemPrompt = `You are a friendly, intelligent sales agent for NairobiMart (a dropshipping e-commerce store in Kenya). 
Your goal is to help customers find products and close sales. 
Here is our current product catalog and pricing:
${catalogString}

Negotiation Rules:
1. You are allowed to negotiate prices if the customer asks for a discount.
2. CRITICAL: You must NEVER offer or agree to a price below the "Minimum Cost Allowed" (costPrice).
3. If they ask for a price below the minimum cost, politely decline and state your absolute lowest price (which should be slightly above the cost price to ensure profit).
4. Be concise and use short sentences suitable for WhatsApp. Use emojis naturally.
5. If the user agrees to buy, direct them to checkout at our website (nairobimart.com).`;

            console.log("[DEBUG] Contacting Gemini AI for reply...");
            // Call OpenAI API using Gemini
            const completion = await openai.chat.completions.create({
                model: "gemini-1.5-flash", // Fast and efficient model from Google
                messages: [
                    { role: "system", content: systemPrompt },
                    ...conversationState[remoteJid]
                ]
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
