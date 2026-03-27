import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

async function getOrCreateLocalUser(prisma: PrismaClient, req: AuthRequest) {
  if (!req.userEmail) return null;
  let user = await prisma.users.findUnique({ where: { email: req.userEmail } });
  if (!user) {
    user = await prisma.users.create({
      data: { email: req.userEmail, name: null },
    });
  }
  return user;
}

// GET /api/profile — get parent profile with preferences
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const localUser = await getOrCreateLocalUser(prisma, req);
  if (!localUser) throw new AppError('Could not resolve user', 401);

  res.json({
    id: localUser.id,
    email: localUser.email,
    name: localUser.name,
    language: localUser.language || 'af',
  });
});

// PATCH /api/profile — update parent preferences (language, name)
router.patch('/', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const localUser = await getOrCreateLocalUser(prisma, req);
  if (!localUser) throw new AppError('Could not resolve user', 401);

  const { language, name } = req.body;
  const data: any = {};
  if (language && ['af', 'en', 'tn'].includes(language)) data.language = language;
  if (name !== undefined) data.name = name;

  const updated = await prisma.users.update({
    where: { id: localUser.id },
    data,
  });

  res.json({
    id: updated.id,
    email: updated.email,
    name: updated.name,
    language: updated.language || 'af',
  });
});

export default router;
