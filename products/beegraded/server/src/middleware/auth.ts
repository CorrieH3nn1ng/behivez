import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  userProducts?: string[];
}

interface JwtPayload {
  sub: string;
  email: string;
  name?: string;
  role: string;
  products: string[];
}

function extractJwt(req: AuthRequest, decoded: JwtPayload) {
  req.userId = decoded.sub;
  req.userEmail = decoded.email;
  req.userName = decoded.name || undefined;
  req.userRole = decoded.role;
  req.userProducts = decoded.products;
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
    const decoded = jwt.verify(token, process.env.AUTH_JWT_SECRET!) as JwtPayload;
    extractJwt(req, decoded);
    next();
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
};

export const requireAdmin = (
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
    const decoded = jwt.verify(token, process.env.AUTH_JWT_SECRET!) as JwtPayload;
    extractJwt(req, decoded);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }

  if (req.userRole !== 'OWNER' && req.userRole !== 'ADMIN') {
    throw new AppError('Admin access required', 403);
  }
  next();
};

export const optionalAuth = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.AUTH_JWT_SECRET!) as JwtPayload;
    extractJwt(req, decoded);
  } catch {
    // Token invalid — continue without auth
  }
  next();
};
