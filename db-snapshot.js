const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, phone: true, createdAt: true } });
    const orders = await prisma.order.findMany({ select: { id: true, userId: true, orderNumber: true } });

    console.log('--- DATABASE SNAPSHOT ---');
    console.log('Total Users:', users.length);
    console.log(JSON.stringify(users, null, 2));
    console.log('Total Orders:', orders.length);
    console.log(JSON.stringify(orders, null, 2));
    console.log('--- END SNAPSHOT ---');
    process.exit(0);
}
main();
