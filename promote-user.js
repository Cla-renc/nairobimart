const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function main() {
    console.log("Using DATABASE_URL:", process.env.DATABASE_URL);
    try {
        const user = await prisma.user.update({
            where: { email: "admin@nairobimart.com" },
            data: { role: "admin" },
        });
        console.log("Successfully promoted user:", user.email, "New role:", user.role);
    } catch (error) {
        console.error("Promotion failed:", error.message);
        const users = await prisma.user.findMany({ take: 5 });
        console.log("Current users in DB:", users.map(u => u.email));
    }
}

main().finally(() => prisma.$disconnect());
