import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub?: string;
      userId?: string;
    };
    // Shared auth-api uses 'sub', local tokens used 'userId'
    req.userId = decoded.sub || decoded.userId;
    if (!req.userId) throw new Error('No user ID in token');
    next();
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
};
