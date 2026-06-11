const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clear() {
    console.log("Clearing MongoDB WhatsApp session...");
    try {
        await prisma.whatsAppSession.deleteMany({});
        console.log("Successfully cleared the session!");
    } catch (e) {
        console.error("Failed to clear session:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

clear();
