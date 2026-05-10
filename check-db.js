const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.category.findMany({
        include: { _count: { select: { products: true } } }
    });
    console.log(JSON.stringify(categories.map(c => ({ name: c.name, count: c._count.products, id: c.id })), null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
