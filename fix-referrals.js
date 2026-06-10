const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching ALL users...");
  const users = await prisma.user.findMany();

  const usersToUpdate = users.filter(u => !u.referralCode);
  console.log(`Found ${usersToUpdate.length} users with missing or null referral codes.`);

  for (const user of usersToUpdate) {
    const code = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${user.id.substring(user.id.length - 4)}`;
    await prisma.user.update({
      where: { id: user.id },
      data: { referralCode: code }
    });
    console.log(`Updated user ${user.id} with referral code ${code}`);
  }
  console.log('All missing referral codes have been assigned unique values!');
}

main().catch(e => {
  console.error("Error updating users:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
