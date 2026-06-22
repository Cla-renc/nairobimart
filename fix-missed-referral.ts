import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminCode = "REF-G3EXML-a757";
  
  const adminUser = await prisma.user.findFirst({
    where: {
      referralCode: {
        equals: adminCode,
        mode: 'insensitive'
      }
    }
  });

  if (!adminUser) {
    console.log("Could not find admin user with code", adminCode);
    return;
  }
  
  console.log("Found admin user:", adminUser.email, adminUser.id);

  // Find users created in the last 2 hours who have no referredById
  const recentUsers = await prisma.user.findMany({
    where: {
      referredById: null,
      createdAt: {
        gte: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`Found ${recentUsers.length} recent users with no referral.`);
  for (const u of recentUsers) {
    console.log(`- ${u.email} created at ${u.createdAt}`);
  }

  // If there's exactly one, let's link it
  if (recentUsers.length === 1) {
    const targetUser = recentUsers[0];
    await prisma.user.update({
      where: { id: targetUser.id },
      data: { referredById: adminUser.id }
    });
    // Add 100 points to admin
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { loyaltyPoints: { increment: 100 } }
    });
    console.log(`Linked ${targetUser.email} to admin! Admin awarded 100 points.`);
  } else if (recentUsers.length > 1) {
    console.log("More than one recent user, not auto-linking to be safe.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
