import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function generatePassword(length = 12): string {
  return crypto.randomBytes(length).toString('base64').slice(0, length) + '@Kc1';
}

async function main() {
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf('--email');
  const passIdx = args.indexOf('--password');

  if (emailIdx === -1 || !args[emailIdx + 1]) {
    console.error('Usage: npx ts-node scripts/create-admin.ts --email admin@kiddocare.co.ke [--password YourPassword]');
    process.exit(1);
  }

  const email = args[emailIdx + 1].toLowerCase().trim();
  const password = passIdx !== -1 && args[passIdx + 1] ? args[passIdx + 1] : generatePassword();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error('Error: User already exists with this email');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: { email, phone: '+254743299688', role: UserRole.ADMIN, passwordHash },
  });

  console.log('\n=== KiddoCare Admin Created ===');
  console.log('Email:    ' + email);
  console.log('Password: ' + password);
  console.log('Role:     ADMIN');
  console.log('User ID:  ' + admin.id);
  console.log('===============================');
}

main()
  .catch((e) => { console.error('Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
