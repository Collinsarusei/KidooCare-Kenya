import { PrismaClient, UserRole, SchoolStatus, ServiceBillingCycle } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const DAYCARE_SERVICE_PRESETS = [
  { name: 'Full-Day Care (8–10 hours)', price: 15000, capacity: 20, description: 'Comprehensive full day care including activities, nap time, and supervised play.' },
  { name: 'Half-Day Care (4–5 hours)', price: 8000, capacity: 15, description: 'Morning or afternoon care with structured early learning activities.' },
  { name: 'Infant Care (3–12 months)', price: 18000, capacity: 10, description: 'Dedicated high-ratio infant care with individual feeding and sleep routines.' },
  { name: 'Toddler Care (1–3 years)', price: 14000, capacity: 15, description: 'Active toddler stimulation, sensory play, and early speech development.' },
  { name: 'Preschool Prep (3–5 years)', price: 16000, capacity: 20, description: 'Foundational literacy, numeracy, social skills, and school readiness.' },
  { name: 'Special Needs Day Care', price: 25000, capacity: 8, description: 'Tailored individual care plans with trained special needs caregivers.' },
  { name: 'Transport Services', price: 4000, capacity: 25, description: 'Door-to-door safe shuttle transport within a 10km radius.' },
  { name: 'Meals & Snacks', price: 2000, capacity: 30, description: 'Freshly prepared nutritious warm lunches and 2 tea/snack breaks daily.' },
];

async function main() {
  console.log('🌱 Seeding Daycare Platform Database...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@daycare.com' },
    update: {},
    create: {
      email: 'admin@daycare.com',
      phone: '+254743299688',
      role: UserRole.ADMIN,
      passwordHash,
    },
  });
  console.log('✅ Admin user created: admin@daycare.com');

  // 2. Create School 1: Kilimani
  const schoolUser1 = await prisma.user.upsert({
    where: { email: 'kilimani@littleangels.co.ke' },
    update: {},
    create: {
      email: 'kilimani@littleangels.co.ke',
      phone: '+254711111111',
      role: UserRole.SCHOOL,
      passwordHash,
    },
  });

  const school1 = await prisma.school.upsert({
    where: { userId: schoolUser1.id },
    update: {},
    create: {
      userId: schoolUser1.id,
      name: 'Little Angels Daycare & Nursery',
      location: 'Kilimani, Argwings Kodhek Rd, Nairobi',
      about: 'A premier early childhood center offering infant care, toddler development, and flexible weekly payment options.',
      status: SchoolStatus.ACTIVE,
      verifiedBadge: true,
      createdByAdminId: admin.id,
    },
  });

  // Seed services for School 1
  for (const preset of DAYCARE_SERVICE_PRESETS.slice(0, 5)) {
    await prisma.service.create({
      data: {
        schoolId: school1.id,
        name: preset.name,
        description: preset.description,
        price: preset.price,
        capacity: preset.capacity,
        billingCycle: ServiceBillingCycle.MONTHLY,
      },
    });
  }

  // 3. Create School 2: Westlands
  const schoolUser2 = await prisma.user.upsert({
    where: { email: 'info@sunshineearlylearning.co.ke' },
    update: {},
    create: {
      email: 'info@sunshineearlylearning.co.ke',
      phone: '+254722222222',
      role: UserRole.SCHOOL,
      passwordHash,
    },
  });

  const school2 = await prisma.school.upsert({
    where: { userId: schoolUser2.id },
    update: {},
    create: {
      userId: schoolUser2.id,
      name: 'Sunshine Early Learning Center',
      location: 'Westlands, Peponi Road, Nairobi',
      about: 'Spacious green play grounds, certified early childhood educators, and specialized infant and special needs care.',
      status: SchoolStatus.ACTIVE,
      verifiedBadge: true,
      createdByAdminId: admin.id,
    },
  });

  // Seed services for School 2
  for (const preset of [DAYCARE_SERVICE_PRESETS[2], DAYCARE_SERVICE_PRESETS[3], DAYCARE_SERVICE_PRESETS[4], DAYCARE_SERVICE_PRESETS[5], DAYCARE_SERVICE_PRESETS[6]]) {
    await prisma.service.create({
      data: {
        schoolId: school2.id,
        name: preset.name,
        description: preset.description,
        price: preset.price,
        capacity: preset.capacity,
        billingCycle: ServiceBillingCycle.MONTHLY,
      },
    });
  }

  console.log('✅ Daycare Schools & Service Presets seeded cleanly!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
