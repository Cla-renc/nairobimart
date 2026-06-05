const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { PrismaClient } = require('@prisma/client');
const { OpenAI } = require('openai');
const pino = require('pino');
require('dotenv').config({ path: '../.env.local' }); // Load env variables from parent dir

const prisma = new PrismaClient();

// Ensure Groq API key exists
if (!process.env.GROQ_API_KEY) {
    console.error("❌ CRITICAL ERROR: GROQ_API_KEY is missing from environment variables.");
    console.error("Please add it to your .env or .env.local file.");
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1", // Use Groq's ultra-fast free servers instead of OpenAI
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

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }) // Reduce console spam
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
            if (!msg.message || msg.key.fromMe) return;

            const remoteJid = msg.key.remoteJid;
            
            // Ignore status updates or group messages
            if (remoteJid.includes('@g.us') || remoteJid === 'status@broadcast') return;

            // Extract text
            const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
            if (!textMessage) return;

            console.log(`Received message from ${remoteJid}: ${textMessage}`);

            // Get product catalog for context
            const catalog = await getProductCatalog();
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

            // Call OpenAI API using Groq's free servers
            const completion = await openai.chat.completions.create({
                model: "llama3-8b-8192", // completely free and incredibly fast model
                messages: [
                    { role: "system", content: systemPrompt },
                    ...conversationState[remoteJid]
                ]
            });

            const replyText = completion.choices[0].message.content;

            // Add bot reply to history
            conversationState[remoteJid].push({ role: "assistant", content: replyText });

            // Send reply on WhatsApp
            await sock.sendMessage(remoteJid, { text: replyText });
            console.log(`Replied to ${remoteJid}: ${replyText}`);

        } catch (error) {
            console.error("Error processing message:", error);
        }
    });
}

startBot();
