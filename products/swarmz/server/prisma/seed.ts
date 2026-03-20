import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Swarmz database...');

  // Create owner user (you)
  const passwordHash = await bcrypt.hash('swarmz123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'admin@swarmz.co.za' },
    update: {},
    create: {
      name: 'Corri',
      email: 'admin@swarmz.co.za',
      passwordHash,
      plan: 'FLEET',
      fleetName: 'My Fleet',
    },
  });

  console.log(`User: ${user.name} (${user.email})`);

  // Create vehicles
  const vehicles = [
    { registration: 'CA 123 456', make: 'Toyota', model: 'Hilux', year: 2022, color: 'White', odometer: 45200 },
    { registration: 'GP 789 012', make: 'Volkswagen', model: 'Polo Vivo', year: 2021, color: 'Silver', odometer: 62800 },
    { registration: 'CF 345 678', make: 'Ford', model: 'Ranger', year: 2023, color: 'Blue', odometer: 18500 },
  ];

  for (const v of vehicles) {
    const vehicle = await prisma.vehicle.upsert({
      where: { userId_registration: { userId: user.id, registration: v.registration } },
      update: {},
      create: { userId: user.id, ...v },
    });
    console.log(`Vehicle: ${vehicle.registration} - ${vehicle.make} ${vehicle.model}`);

    // Add some status log entries
    if (v.registration === 'CA 123 456') {
      await prisma.statusLogEntry.createMany({
        data: [
          { vehicleId: vehicle.id, userId: user.id, status: 'FUELING', costAmount: 1250, costCategory: 'FUEL', vendor: 'Shell Pinelands', notes: '55L', timestamp: new Date('2026-03-10T08:30:00Z') },
          { vehicleId: vehicle.id, userId: user.id, status: 'SERVICE', costAmount: 3500, costCategory: 'SERVICE', vendor: 'Toyota Tygerberg', notes: 'Major service 45000km', timestamp: new Date('2026-03-08T10:00:00Z') },
          { vehicleId: vehicle.id, userId: user.id, status: 'CLEANING', costAmount: 180, costCategory: 'CLEANING', vendor: 'Supa Quick Wash', timestamp: new Date('2026-03-05T14:00:00Z') },
          { vehicleId: vehicle.id, userId: user.id, status: 'OUT', notes: 'Sipho - Uber shift', odometer: 44800, timestamp: new Date('2026-03-04T06:00:00Z') },
        ],
      });
    }
    if (v.registration === 'GP 789 012') {
      await prisma.statusLogEntry.createMany({
        data: [
          { vehicleId: vehicle.id, userId: user.id, status: 'FUELING', costAmount: 890, costCategory: 'FUEL', vendor: 'Engen N1', notes: '42L', timestamp: new Date('2026-03-11T09:00:00Z') },
          { vehicleId: vehicle.id, userId: user.id, status: 'REPAIR', costAmount: 4200, costCategory: 'REPAIR', vendor: 'Midas Bellville', notes: 'Brake pads + discs', timestamp: new Date('2026-03-06T11:00:00Z') },
        ],
      });
    }
    if (v.registration === 'CF 345 678') {
      await prisma.statusLogEntry.createMany({
        data: [
          { vehicleId: vehicle.id, userId: user.id, status: 'FUELING', costAmount: 1680, costCategory: 'FUEL', vendor: 'Caltex Stellenbosch', notes: '68L diesel', timestamp: new Date('2026-03-09T07:00:00Z') },
        ],
      });
    }
  }

  // Create drivers
  await prisma.driver.upsert({
    where: { userId_email: { userId: user.id, email: 'sipho@example.com' } },
    update: {},
    create: { userId: user.id, name: 'Sipho Ndlovu', email: 'sipho@example.com', phone: '082 555 1234', inviteStatus: 'ACCEPTED' },
  });
  await prisma.driver.upsert({
    where: { userId_email: { userId: user.id, email: 'thandi@example.com' } },
    update: {},
    create: { userId: user.id, name: 'Thandi Mokoena', email: 'thandi@example.com', phone: '073 555 5678', inviteStatus: 'PENDING' },
  });

  console.log('Seed complete!');
  console.log('Login: admin@swarmz.co.za / swarmz123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
