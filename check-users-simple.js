const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const users = await prisma.user.findMany({ select: { email: true, name: true } });
    console.log('USERS_START');
    console.log(JSON.stringify(users));
    console.log('USERS_END');
    process.exit(0);
}
main();
