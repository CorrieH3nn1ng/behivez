import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from './errorHandler.js';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  const token = authHeader.substring(7);

  // Verify JWT first
  let decoded: { sub?: string; userId?: string; email?: string; name?: string };
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as typeof decoded;
  } catch {
    return next(new AppError('Invalid or expired token', 401));
  }

  const userId = decoded.sub || decoded.userId;
  if (!userId) return next(new AppError('No user ID in token', 401));

  // Ensure user exists in local Swarmz DB (get or create from JWT claims)
  try {
    const prisma: PrismaClient = req.app.locals.prisma;
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      await prisma.user.create({
        data: {
          id: userId,
          email: decoded.email || '',
          name: decoded.name || '',
          passwordHash: '',
        },
      });
    }
  } catch (err: any) {
    console.error('Failed to sync user to local DB:', err.message);
    // Don't block the request — user might already exist from a race condition
  }

  req.userId = userId;
  next();
};
