const { PrismaClient } = require('@prisma/client');
try {
    const prisma = new PrismaClient({ log: ['query', 'error', 'warn'] });
    console.log("Prisma initialized successfully!", Object.keys(prisma));
} catch (e) {
    console.error("Prisma error:", e);
}
