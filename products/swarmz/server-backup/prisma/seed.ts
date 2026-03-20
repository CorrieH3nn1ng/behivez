import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create branches
  const mainBranch = await prisma.branch.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: {
      name: 'Main Branch',
      code: 'MAIN',
      address: '123 Main Street, City',
      phone: '+27 11 123 4567',
      email: 'main@fleetz.com',
    },
  });

  const airportBranch = await prisma.branch.upsert({
    where: { code: 'AIRPORT' },
    update: {},
    create: {
      name: 'Airport Branch',
      code: 'AIRPORT',
      address: 'O.R. Tambo International Airport',
      phone: '+27 11 987 6543',
      email: 'airport@fleetz.com',
    },
  });

  console.log('Created branches:', mainBranch.name, airportBranch.name);

  // Create vehicle categories
  const categories = [
    { name: 'Category A (Economy)', code: 'A', dailyRate: 350, sortOrder: 1 },
    { name: 'Category B (Compact)', code: 'B', dailyRate: 450, sortOrder: 2 },
    { name: 'Category C (Sedan)', code: 'C', dailyRate: 550, sortOrder: 3 },
    { name: 'SUV', code: 'SUV', dailyRate: 750, sortOrder: 4 },
    { name: 'Luxury', code: 'LUX', dailyRate: 1200, sortOrder: 5 },
  ];

  for (const cat of categories) {
    await prisma.vehicleCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }

  console.log('Created vehicle categories');

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fleetz.com' },
    update: {},
    create: {
      email: 'admin@fleetz.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      branchId: mainBranch.id,
    },
  });

  console.log('Created admin user:', admin.email);

  // Create staff user
  const staffPasswordHash = await bcrypt.hash('staff123', 10);

  const staff = await prisma.user.upsert({
    where: { email: 'staff@fleetz.com' },
    update: {},
    create: {
      email: 'staff@fleetz.com',
      passwordHash: staffPasswordHash,
      firstName: 'Staff',
      lastName: 'Member',
      role: 'STAFF',
      branchId: mainBranch.id,
    },
  });

  console.log('Created staff user:', staff.email);

  // Get category IDs
  const catA = await prisma.vehicleCategory.findUnique({ where: { code: 'A' } });
  const catB = await prisma.vehicleCategory.findUnique({ where: { code: 'B' } });
  const catC = await prisma.vehicleCategory.findUnique({ where: { code: 'C' } });
  const catSUV = await prisma.vehicleCategory.findUnique({ where: { code: 'SUV' } });

  // Create sample vehicles
  const vehicles = [
    { registration: 'CA 123-456', make: 'Toyota', model: 'Corolla', year: 2023, color: 'White', categoryId: catA!.id, branchId: mainBranch.id, odometer: 15000 },
    { registration: 'CA 234-567', make: 'VW', model: 'Polo', year: 2023, color: 'Silver', categoryId: catA!.id, branchId: mainBranch.id, odometer: 12000 },
    { registration: 'CA 345-678', make: 'Hyundai', model: 'i20', year: 2022, color: 'Blue', categoryId: catA!.id, branchId: mainBranch.id, odometer: 25000, status: 'OUT' },
    { registration: 'CA 456-789', make: 'Toyota', model: 'Corolla Cross', year: 2023, color: 'Black', categoryId: catB!.id, branchId: mainBranch.id, odometer: 8000 },
    { registration: 'CA 567-890', make: 'VW', model: 'T-Roc', year: 2023, color: 'Red', categoryId: catB!.id, branchId: mainBranch.id, odometer: 5000 },
    { registration: 'CA 678-901', make: 'Toyota', model: 'Camry', year: 2023, color: 'White', categoryId: catC!.id, branchId: mainBranch.id, odometer: 3000 },
    { registration: 'CA 789-012', make: 'Toyota', model: 'Fortuner', year: 2023, color: 'Gray', categoryId: catSUV!.id, branchId: mainBranch.id, odometer: 10000 },
    { registration: 'CA 890-123', make: 'Ford', model: 'Everest', year: 2022, color: 'Blue', categoryId: catSUV!.id, branchId: mainBranch.id, odometer: 30000, status: 'CLEANING' },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { registration: v.registration },
      update: {},
      create: {
        ...v,
        status: (v as any).status || 'READY',
      },
    });
  }

  console.log('Created sample vehicles');

  // Create sample customers
  const customer1 = await prisma.customer.upsert({
    where: { id: 'customer-1' },
    update: {},
    create: {
      id: 'customer-1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@email.com',
      phone: '+27 82 123 4567',
      licenseNumber: 'JS1234567890',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 'customer-2' },
    update: {},
    create: {
      id: 'customer-2',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@email.com',
      phone: '+27 83 987 6543',
      licenseNumber: 'JD0987654321',
    },
  });

  console.log('Created sample customers');

  // Create sample rentals
  const vehicle1 = await prisma.vehicle.findUnique({ where: { registration: 'CA 345-678' } });

  await prisma.rental.upsert({
    where: { bookingRef: 'FLZ-2026-0001' },
    update: {},
    create: {
      bookingRef: 'FLZ-2026-0001',
      status: 'ACTIVE',
      customerId: customer1.id,
      vehicleId: vehicle1!.id,
      categoryId: catA!.id,
      branchId: mainBranch.id,
      startDate: new Date('2026-02-03'),
      endDate: new Date('2026-02-07'),
      actualStartDate: new Date('2026-02-03T09:00:00'),
      checkoutOdometer: 24500,
      checkoutFuel: 100,
    },
  });

  await prisma.rental.upsert({
    where: { bookingRef: 'FLZ-2026-0002' },
    update: {},
    create: {
      bookingRef: 'FLZ-2026-0002',
      status: 'RESERVED',
      customerId: customer2.id,
      categoryId: catB!.id,
      branchId: mainBranch.id,
      startDate: new Date('2026-02-06'),
      endDate: new Date('2026-02-10'),
    },
  });

  console.log('Created sample rentals');

  console.log('Database seeding completed!');
  console.log('\nTest credentials:');
  console.log('  Admin: admin@fleetz.com / admin123');
  console.log('  Staff: staff@fleetz.com / staff123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
