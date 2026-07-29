import { PrismaClient, UserRole, SchoolStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function generatePassword(length = 12): string {
  return crypto.randomBytes(length).toString('base64').slice(0, length) + '@Kc1';
}

async function main() {
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf('--email');
  const nameIdx = args.indexOf('--name');
  const phoneIdx = args.indexOf('--phone');

  if (emailIdx === -1 || !args[emailIdx + 1] || nameIdx === -1 || !args[nameIdx + 1]) {
    console.error('Usage: npx ts-node scripts/onboard-school.ts --email school@abc.co.ke --name "School Name" [--phone 0712000000]');
    process.exit(1);
  }

  const email = args[emailIdx + 1].toLowerCase().trim();
  const schoolName = args[nameIdx + 1];
  const phone = phoneIdx !== -1 && args[phoneIdx + 1] ? args[phoneIdx + 1] : '+254000000000';
  const tempPassword = generatePassword();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error('Error: User already exists with email: ' + email);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      email,
      phone,
      role: UserRole.SCHOOL,
      passwordHash,
      mustChangePassword: true,
    },
  });

  const school = await prisma.school.create({
    data: {
      userId: user.id,
      name: schoolName,
      location: 'Nairobi, KE',
      status: SchoolStatus.PENDING_PROFILE,
    },
  });

  // Send onboarding email via Resend API
  const resendApiKey = process.env.RESEND_API_KEY || '';
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  let emailSent = false;

  if (resendApiKey) {
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: `Welcome to KiddoCare Kenya — Credentials for ${schoolName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6eeff; border-radius: 16px; background-color: #ffffff;">
              <div style="background-color: #004ac6; padding: 16px; border-radius: 12px; text-align: center; color: #ffffff;">
                <h2 style="margin: 0;">KiddoCare Kenya</h2>
                <p style="margin: 4px 0 0 0; font-size: 13px;">Verified Daycares Platform</p>
              </div>
              <div style="padding: 20px 0;">
                <h3 style="color: #121c2a;">Welcome, ${schoolName}!</h3>
                <p style="color: #434655; line-height: 1.5;">
                  Your school account has been onboarded to KiddoCare Kenya. Use your temporary credentials below to log in:
                </p>
                <div style="background-color: #f8f9ff; border: 1px solid #c3c6d7; padding: 16px; border-radius: 12px; margin: 20px 0;">
                  <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Portal Email:</strong> ${email}</p>
                  <p style="margin: 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #e6eeff; padding: 4px 8px; border-radius: 4px; color: #004ac6; font-weight: bold;">${tempPassword}</code></p>
                </div>
                <p style="color: #c2410c; font-size: 13px; font-weight: bold;">
                  🔒 Security Notice: You will be prompted to set a new password on your first login, after which you will be guided to complete your school profile.
                </p>
                <div style="text-align: center; margin-top: 24px;">
                  <a href="http://localhost:5173" style="background-color: #004ac6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 999px; font-weight: bold; display: inline-block;">
                    Log In to Portal &rarr;
                  </a>
                </div>
              </div>
            </div>
          `,
        }),
      });
      if (emailRes.ok) {
        const resData = await emailRes.json();
        console.log(`📧 Credentials Email sent via Resend (ID: ${resData.id})`);
        emailSent = true;
      } else {
        const errText = await emailRes.text();
        console.warn(`⚠️ Resend API returned error: ${errText}`);
      }
    } catch (e: any) {
      console.warn(`⚠️ Resend API dispatch failed: ${e.message}`);
    }
  }

  if (!emailSent) {
    console.log('ℹ️ Resend API Key not configured or simulated. Credentials logged below:');
  }

  console.log('\n=== KiddoCare School Onboarded ===');
  console.log('School:   ' + schoolName);
  console.log('Email:    ' + email);
  console.log('Password: ' + tempPassword + ' (TEMP)');
  console.log('School ID:' + school.id);
  console.log('Status:   PENDING_PROFILE (School must change password & complete profile wizard)');
  console.log('Resend:   ' + (emailSent ? 'SENT via Resend API' : 'SIMULATED / Logged to console'));
  console.log('==================================');
}

main()
  .catch((e) => { console.error('Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
