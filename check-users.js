const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const userCount = await prisma.user.count();
        console.log(`Total users in database: ${userCount}`);

        const latestUsers = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true
            }
        });

        console.log('Latest 5 users:');
        console.log(JSON.stringify(latestUsers, null, 2));
    } catch (error) {
        console.error('Error checking users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
