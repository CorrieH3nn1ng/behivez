import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  generateAccessToken,
  createRefreshToken,
  buildTokenUser,
} from '../services/token.js';
import { sendEmail } from '../utils/sendEmail.js';

const router = Router();

const RESET_EXPIRY_MINUTES = 30;

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// POST /auth/register
router.post('/register', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { name, email, password, product } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email and password are required', 400);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  // If a product was specified, create a subscription
  if (product) {
    await prisma.subscription.create({
      data: { userId: user.id, product, status: 'ACTIVE', plan: 'free' },
    });
  }

  const tokenUser = await buildTokenUser(prisma, user);
  const accessToken = generateAccessToken(tokenUser);
  const refreshToken = await createRefreshToken(prisma, user.id);

  res.status(201).json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, products: tokenUser.products, mustChangePassword: user.mustChangePassword },
  });
});

// POST /auth/login
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

  const tokenUser = await buildTokenUser(prisma, user);
  const accessToken = generateAccessToken(tokenUser);
  const refreshToken = await createRefreshToken(prisma, user.id);

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, products: tokenUser.products, mustChangePassword: user.mustChangePassword },
  });
});

// POST /auth/forgot-password — send reset link via email
router.post('/forgot-password', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  // Always return same message (don't reveal if email exists)
  const message = 'If that email is registered, a password reset link has been sent.';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.json({ message });
    return;
  }

  const token = uuid();
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);

  await prisma.passwordReset.create({
    data: { token, userId: user.id, expiresAt },
  });

  const resetUrl = `${process.env.RESET_PASSWORD_URL || 'http://localhost:8090/auth/reset-password'}?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: 'Reset your BeHivez password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #78350f;">Password Reset</h2>
        <p>Hi ${user.name},</p>
        <p>Click the button below to reset your password. This link expires in ${RESET_EXPIRY_MINUTES} minutes.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: #78350f; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Reset Password
        </a>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">If you didn't request this, just ignore this email. Your password won't change.</p>
      </div>
    `,
  });

  res.json({ message });
});

// POST /auth/reset-password — verify token + set new password
router.post('/reset-password', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { token, password } = req.body;

  if (!token || !password) {
    throw new AppError('Token and new password are required', 400);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  const reset = await prisma.passwordReset.findUnique({ where: { token } });
  if (!reset || reset.used || reset.expiresAt < new Date()) {
    throw new AppError('Invalid or expired reset link', 401);
  }

  // Mark token as used
  await prisma.passwordReset.update({
    where: { id: reset.id },
    data: { used: true },
  });

  // Update password and clear mustChangePassword
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: reset.userId },
    data: { passwordHash, mustChangePassword: false },
  });

  // Revoke all existing refresh tokens (force re-login everywhere)
  await prisma.refreshToken.updateMany({
    where: { userId: reset.userId },
    data: { revoked: true },
  });

  res.json({ message: 'Password reset successfully. Please log in with your new password.' });
});

// POST /auth/refresh
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

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true },
  });

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const tokenUser = await buildTokenUser(prisma, user);
  const accessToken = generateAccessToken(tokenUser);
  const refreshToken = await createRefreshToken(prisma, stored.userId);

  res.json({ accessToken, refreshToken });
});

// POST /auth/logout
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

// GET /auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    include: { subscriptions: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    subscriptions: user.subscriptions.map((s) => ({
      id: s.id,
      product: s.product,
      status: s.status,
      plan: s.plan,
      priceCents: s.priceCents,
      currentPeriodEnd: s.currentPeriodEnd,
    })),
  });
});

// POST /auth/change-password — authenticated user changes their own password
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError('Current password is incorrect', 401);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  res.json({ message: 'Password changed successfully' });
});

export default router;
