import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = uuid();
  return { accessToken, refreshToken };
}

// POST /api/auth/register
router.post('/register', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { name, email, password, plan, fleetName } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email and password are required', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      plan: plan === 'fleet' ? 'FLEET' : 'SOLO',
      fleetName: plan === 'fleet' ? fleetName : null,
    },
  });

  const { accessToken, refreshToken } = generateTokens(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.status(201).json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan.toLowerCase(),
      fleetName: user.fleetName,
    },
  });
});

// POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid credentials', 401);
  }

  const { accessToken, refreshToken } = generateTokens(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan.toLowerCase(),
      fleetName: user.fleetName,
    },
  });
});

// POST /api/auth/refresh
router.post('/refresh', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AppError('Refresh token required', 400);
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new AppError('Invalid refresh token', 401);
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true },
  });

  const { accessToken, refreshToken } = generateTokens(stored.userId);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: stored.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({ accessToken, refreshToken });
});

// POST /api/auth/logout
router.post('/logout', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { refreshToken } = req.body;

  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }

  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan.toLowerCase(),
    fleetName: user.fleetName,
  });
});

export default router;
