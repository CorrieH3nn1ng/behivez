import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const VALID_PRODUCTS = ['beegraded', 'pollenz', 'swarmz', 'broodz'] as const;
const VALID_ROLES = ['OWNER', 'ADMIN', 'USER', 'AFFILIATE'] as const;
const VALID_STATUSES = ['ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED'] as const;

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// Strip passwordHash from user objects
function sanitizeUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// GET /admin/users — list all users with subscriptions
router.get('/users', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { search, role, product } = req.query;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (role && VALID_ROLES.includes(role as any)) {
    where.role = role;
  }

  if (product && VALID_PRODUCTS.includes(product as any)) {
    where.subscriptions = { some: { product: product as string } };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { subscriptions: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    users: users.map(sanitizeUser),
    total,
    page,
    limit,
  });
});

// GET /admin/users/:id — single user detail
router.get('/users/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { subscriptions: true },
  });

  if (!user) throw new AppError('User not found', 404);

  res.json(sanitizeUser(user));
});

// PATCH /admin/users/:id — update user fields
router.patch('/users/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { name, role, mustChangePassword } = req.body;

  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('User not found', 404);

  // Prevent removing your own OWNER role
  if (req.params.id === req.user!.sub && role && role !== 'OWNER' && existing.role === 'OWNER') {
    throw new AppError('Cannot demote yourself from OWNER', 400);
  }

  // Only OWNERs can promote to OWNER
  if (role === 'OWNER' && req.user!.role !== 'OWNER') {
    throw new AppError('Only OWNER can promote to OWNER', 403);
  }

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (role !== undefined && VALID_ROLES.includes(role)) data.role = role;
  if (mustChangePassword !== undefined) data.mustChangePassword = !!mustChangePassword;

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data,
    include: { subscriptions: true },
  });

  res.json(sanitizeUser(updated));
});

// POST /admin/users — create a new user
router.post('/users', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { name, email, password, role, products } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email and password are required', 400);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const userRole = role && VALID_ROLES.includes(role) ? role : 'USER';

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: userRole,
      mustChangePassword: true,
    },
  });

  // Create subscriptions for specified products
  if (products && Array.isArray(products)) {
    for (const product of products) {
      if (VALID_PRODUCTS.includes(product)) {
        await prisma.subscription.create({
          data: { userId: user.id, product, status: 'ACTIVE', plan: 'free' },
        });
      }
    }
  }

  const result = await prisma.user.findUnique({
    where: { id: user.id },
    include: { subscriptions: true },
  });

  res.status(201).json(sanitizeUser(result));
});

// POST /admin/users/:id/subscriptions — add subscription
router.post('/users/:id/subscriptions', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { product, plan, status } = req.body;

  if (!product || !VALID_PRODUCTS.includes(product)) {
    throw new AppError(`Product must be one of: ${VALID_PRODUCTS.join(', ')}`, 400);
  }

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new AppError('User not found', 404);

  // Check if subscription already exists
  const existing = await prisma.subscription.findUnique({
    where: { userId_product: { userId: req.params.id, product } },
  });
  if (existing) throw new AppError('User already has a subscription for this product', 409);

  const sub = await prisma.subscription.create({
    data: {
      userId: req.params.id,
      product,
      plan: plan || 'free',
      status: status && VALID_STATUSES.includes(status) ? status : 'ACTIVE',
    },
  });

  res.status(201).json(sub);
});

// PATCH /admin/users/:id/subscriptions/:subId — update subscription
router.patch('/users/:id/subscriptions/:subId', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { status, plan, meta } = req.body;

  const sub = await prisma.subscription.findUnique({ where: { id: req.params.subId } });
  if (!sub || sub.userId !== req.params.id) {
    throw new AppError('Subscription not found', 404);
  }

  const data: any = {};
  if (status !== undefined && VALID_STATUSES.includes(status)) data.status = status;
  if (plan !== undefined) data.plan = plan;
  if (meta !== undefined) data.meta = meta;

  const updated = await prisma.subscription.update({
    where: { id: req.params.subId },
    data,
  });

  res.json(updated);
});

// DELETE /admin/users/:id/subscriptions/:subId — remove subscription
router.delete('/users/:id/subscriptions/:subId', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);

  const sub = await prisma.subscription.findUnique({ where: { id: req.params.subId } });
  if (!sub || sub.userId !== req.params.id) {
    throw new AppError('Subscription not found', 404);
  }

  await prisma.subscription.delete({ where: { id: req.params.subId } });

  res.json({ message: 'Subscription removed' });
});

// GET /admin/stats — dashboard statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    usersByRole,
    subscriptionsByProduct,
    subscriptionsByStatus,
    recentSignups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.subscription.groupBy({ by: ['product'], _count: true }),
    prisma.subscription.groupBy({ by: ['product', 'status'], _count: true }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  res.json({
    totalUsers,
    usersByRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count])),
    subscriptionsByProduct: Object.fromEntries(subscriptionsByProduct.map((r) => [r.product, r._count])),
    subscriptionsByStatus: subscriptionsByStatus.map((r) => ({
      product: r.product,
      status: r.status,
      count: r._count,
    })),
    recentSignups,
  });
});

// GET /admin/payments — list all payments (paginated)
router.get('/payments', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const { product, status } = req.query;

  const where: any = {};
  if (product) where.subscription = { product };
  if (status) where.status = status;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        subscription: { select: { product: true, plan: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  res.json({
    payments: payments.map((p: any) => ({
      id: p.id,
      userName: p.user?.name,
      userEmail: p.user?.email,
      product: p.subscription?.product || null,
      plan: p.subscription?.plan || null,
      amountCents: p.amountCents,
      status: p.status,
      createdAt: p.createdAt,
    })),
    total,
    page,
    limit,
  });
});

// GET /admin/revenue — revenue statistics
router.get('/revenue', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // MRR: sum of priceCents for all active paid subscriptions
  const activeSubscriptions = await prisma.subscription.findMany({
    where: { status: 'ACTIVE', priceCents: { gt: 0 } },
    select: { product: true, priceCents: true },
  });

  const mrr = activeSubscriptions.reduce((sum: number, s: any) => sum + (s.priceCents || 0), 0);
  const activePaidCount = activeSubscriptions.length;

  const mrrByProduct: Record<string, number> = {};
  for (const s of activeSubscriptions) {
    mrrByProduct[s.product] = (mrrByProduct[s.product] || 0) + (s.priceCents || 0);
  }

  // Total revenue: sum of complete payments
  const totalResult = await prisma.payment.aggregate({
    where: { status: 'COMPLETE' },
    _sum: { amountCents: true },
  });
  const totalRevenue = totalResult._sum.amountCents || 0;

  // Revenue this month vs last month
  const thisMonthResult = await prisma.payment.aggregate({
    where: { status: 'COMPLETE', createdAt: { gte: thirtyDaysAgo } },
    _sum: { amountCents: true },
  });
  const lastMonthResult = await prisma.payment.aggregate({
    where: { status: 'COMPLETE', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    _sum: { amountCents: true },
  });

  // Recent payments
  const recentPayments = await prisma.payment.findMany({
    where: { status: 'COMPLETE' },
    include: {
      user: { select: { name: true, email: true } },
      subscription: { select: { product: true, plan: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  res.json({
    mrr,
    activePaidCount,
    mrrByProduct,
    totalRevenue,
    revenueThisMonth: thisMonthResult._sum.amountCents || 0,
    revenueLastMonth: lastMonthResult._sum.amountCents || 0,
    recentPayments: recentPayments.map((p: any) => ({
      id: p.id,
      userName: p.user?.name,
      product: p.subscription?.product,
      plan: p.subscription?.plan,
      amountCents: p.amountCents,
      createdAt: p.createdAt,
    })),
  });
});

// GET /admin/health — ping all product domains
router.get('/health', async (_req: AuthRequest, res: Response) => {
  const domains = [
    { name: 'BeeGraded', url: 'https://beegraded.co.za' },
    { name: 'Pollenz', url: 'https://pollenz.co.za' },
    { name: 'Swarmz', url: 'https://swarmz.co.za' },
    { name: 'Broodz', url: 'https://broodz.co.za' },
    { name: 'BeHivez', url: 'https://behivez.co.za' },
  ];

  const checks = await Promise.all(
    domains.map(async ({ name, url }) => {
      const start = Date.now();
      try {
        const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
        return {
          name,
          url,
          status: resp.ok ? 'up' as const : 'degraded' as const,
          statusCode: resp.status,
          responseTime: Date.now() - start,
        };
      } catch {
        return {
          name,
          url,
          status: 'down' as const,
          statusCode: null,
          responseTime: Date.now() - start,
        };
      }
    })
  );

  res.json(checks);
});

export default router;
