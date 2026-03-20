const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    const users = await prisma.user.findMany();
    console.log("Users in DB count:", users.length);

    const adminEmail = 'admin@nairobimart.com';
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash('password', 10);
        const admin = await prisma.user.create({
            data: {
                email: adminEmail,
                name: 'Admin',
                passwordHash: passwordHash,
                role: 'admin'
            }
        });
        console.log("Created default admin:", admin.email);
    } else {
        console.log("Admin user already exists:", existingAdmin.email);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
