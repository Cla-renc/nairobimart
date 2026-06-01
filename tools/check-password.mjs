import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Load DATABASE_URL from .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*DATABASE_URL\s*=\s*"?(.*?)"?\s*$/);
    if (m) {
      process.env.DATABASE_URL = m[1];
      break;
    }
  }
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const email = process.argv[2] || 'yaaclarence@gmail.com';
  const passwordToCheck = process.argv[3] || 'Admin123';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('User not found for email:', email);
    process.exitCode = 1;
    return;
  }
  console.log('Found user:', { id: user.id, email: user.email, role: user.role });
  if (!user.passwordHash) {
    console.log('User has no passwordHash');
    process.exitCode = 1;
    return;
  }
  const match = await bcrypt.compare(passwordToCheck, user.passwordHash);
  console.log('Password match:', match);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 2; })
  .finally(() => prisma.$disconnect());
