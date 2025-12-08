import 'dotenv/config';
import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({});

const packages = [
  { name: 'Development drill rigs1', price: '600', dailyReturn: '105', durationDays: 30 },
  { name: 'Top hammer longhole drill rigs2', price: '1300', dailyReturn: '230', durationDays: 30 },
  { name: 'In-the-hole longhole drill rigs3', price: '3000', dailyReturn: '580', durationDays: 30 },
  { name: 'Rock support drill rigs4', price: '6000', dailyReturn: '1260', durationDays: 30 },
  { name: 'Cable bolters5', price: '10000', dailyReturn: '2200', durationDays: 30 },
  { name: 'Low profile drill rigs6', price: '20000', dailyReturn: '4800', durationDays: 30 },
  { name: 'Secondary breaking drill rigs7', price: '40000', dailyReturn: '10400', durationDays: 30 },
  { name: 'Tunneling jumbos8', price: '80000', dailyReturn: '22000', durationDays: 30 },
];

async function seedRoles() {
  for (const name of [RoleName.USER, RoleName.ADMIN, RoleName.SUPER_ADMIN]) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

async function seedAdmin() {
  const email = process.env.ADMIN_DEFAULT_EMAIL ?? 'admin@example.com';
  const password = process.env.ADMIN_DEFAULT_PASSWORD ?? 'ChangeMe123!';
  const role = await prisma.role.findFirst({ where: { name: RoleName.SUPER_ADMIN } });
  if (!role) throw new Error('SUPER_ADMIN role missing');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: {
      email,
      username: 'superadmin',
      passwordHash,
      phoneNumber: '0000000000',
      roleId: role.id,
      referralCode: `ADMIN-${Date.now()}`,
    },
  });
  await prisma.wallet.create({
    data: { userId: admin.id },
  });
  return admin;
}

async function seedPackages() {
  for (const pkg of packages) {
    const existing = await prisma.investmentPackage.findFirst({ where: { name: pkg.name } });
    if (existing) {
      await prisma.investmentPackage.update({
        where: { id: existing.id },
        data: {
          price: pkg.price,
          dailyReturn: pkg.dailyReturn,
          durationDays: pkg.durationDays,
          isActive: true,
        },
      });
    } else {
      await prisma.investmentPackage.create({
        data: {
          name: pkg.name,
          price: pkg.price,
          dailyReturn: pkg.dailyReturn,
          durationDays: pkg.durationDays,
        },
      });
    }
  }
}

async function seedSettings() {
  await prisma.setting.upsert({
    where: { key: 'deposit_number' },
    update: { value: process.env.DEPOSIT_NUMBER ?? '0788807422', description: 'MPesa pay-to number' },
    create: { key: 'deposit_number', value: process.env.DEPOSIT_NUMBER ?? '0788807422', description: 'MPesa pay-to number' },
  });
}

async function main() {
  await seedRoles();
  await seedAdmin();
  await seedPackages();
  await seedSettings();
  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

