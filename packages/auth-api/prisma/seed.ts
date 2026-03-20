import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ALL_PRODUCTS = ['beegraded', 'pollenz', 'swarmz', 'broodz'];

async function main() {
  console.log('Seeding behivez_auth database...');

  const passwordHash = await bcrypt.hash('behivez123', 12);

  // ── Corrie (OWNER, all products) ──────────────────────────
  const corrie = await prisma.user.upsert({
    where: { email: 'corrie.henning@gmail.com' },
    update: {},
    create: {
      name: 'Corrie Henning',
      email: 'corrie.henning@gmail.com',
      passwordHash,
      role: 'OWNER',
      mustChangePassword: true,
    },
  });
  for (const product of ALL_PRODUCTS) {
    await prisma.subscription.upsert({
      where: { userId_product: { userId: corrie.id, product } },
      update: {},
      create: { userId: corrie.id, product, status: 'ACTIVE', plan: 'pro' },
    });
  }
  console.log(`User: ${corrie.name} (${corrie.email}) — OWNER, all products`);

  // ── Dayna (OWNER, all products) ───────────────────────────
  const dayne = await prisma.user.upsert({
    where: { email: 'gagedp19@gmail.com' },
    update: {},
    create: {
      name: 'Dayna',
      email: 'gagedp19@gmail.com',
      passwordHash,
      role: 'OWNER',
      mustChangePassword: true,
    },
  });
  for (const product of ALL_PRODUCTS) {
    await prisma.subscription.upsert({
      where: { userId_product: { userId: dayne.id, product } },
      update: {},
      create: { userId: dayne.id, product, status: 'ACTIVE', plan: 'pro' },
    });
  }
  console.log(`User: ${dayne.name} (${dayne.email}) — OWNER, all products`);

  // ── Innocentia (AFFILIATE, BeeGraded free) ────────────────
  const innocentia = await prisma.user.upsert({
    where: { email: 'kambuleinnocentia1@gmail.com' },
    update: {},
    create: {
      name: 'Innocentia Kambule',
      email: 'kambuleinnocentia1@gmail.com',
      passwordHash,
      role: 'AFFILIATE',
      mustChangePassword: true,
    },
  });
  await prisma.subscription.upsert({
    where: { userId_product: { userId: innocentia.id, product: 'beegraded' } },
    update: {},
    create: { userId: innocentia.id, product: 'beegraded', status: 'ACTIVE', plan: 'free' },
  });
  console.log(`User: ${innocentia.name} (${innocentia.email}) — AFFILIATE, BeeGraded free`);

  console.log('\nSeed complete!');
  console.log('Login: corrie.henning@gmail.com / behivez123');
  console.log('Login: gagedp19@gmail.com / behivez123');
  console.log('Login: kambuleinnocentia1@gmail.com / behivez123');
  console.log('All users will be prompted to change password on first login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
