const { PrismaClient } = require('@prisma/client');
const urls = [
    "postgresql://postgres:password@localhost:5432/nairobimart?schema=public",
    "postgresql://postgres:password@127.0.0.1:5432/nairobimart?schema=public",
    "postgresql://postgres:password@[::1]:5432/nairobimart?schema=public"
];

async function test(url) {
    console.log(`Testing URL: ${url}`);
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
        await prisma.$connect();
        const count = await prisma.user.count();
        console.log(`SUCCESS! User count: ${count}`);
        return true;
    } catch (e) {
        console.log(`FAILED: ${e.message.split('\n')[0]}`);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    for (const url of urls) {
        if (await test(url)) break;
    }
}

main();
