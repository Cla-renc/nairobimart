const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearWhatsAppSessions() {
    console.log("Clearing WhatsApp sessions from MongoDB...");
    try {
        const result = await prisma.whatsAppSession.deleteMany({});
        console.log(`Successfully deleted ${result.count} session records.`);
    } catch (e) {
        console.error("Error deleting sessions:", e);
    } finally {
        await prisma.$disconnect();
    }
}

clearWhatsAppSessions();
