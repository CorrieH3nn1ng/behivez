import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const prisma: PrismaClient = req.app.locals.prisma;
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { branch: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, branchId: user.branchId },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Store refresh token
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
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branchId: user.branchId,
        branchName: user.branch.name,
      },
    });
  }
);

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token required', 400);
  }

  const prisma: PrismaClient = req.app.locals.prisma;

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: { include: { branch: true } } },
  });

  if (!storedToken || storedToken.expiresAt < new Date() || storedToken.revokedAt) {
    throw new AppError('Invalid refresh token', 401);
  }

  try {
    jwt.verify(refreshToken, process.env.JWT_SECRET!);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const user = storedToken.user;

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role, branchId: user.branchId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  res.json({ accessToken });
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    const prisma: PrismaClient = req.app.locals.prisma;

    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  res.json({ success: true });
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { branch: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    branchId: user.branchId,
    branchName: user.branch.name,
  });
});

export default router;
