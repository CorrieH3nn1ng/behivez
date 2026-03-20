import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get walk-ins
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { date, from, to } = req.query;

  const where: any = {};

  if (req.userRole !== 'ADMIN') {
    where.branchId = req.branchId;
  }

  if (date) {
    const dateStart = new Date(date as string);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date as string);
    dateEnd.setHours(23, 59, 59, 999);
    where.createdAt = { gte: dateStart, lte: dateEnd };
  } else if (from && to) {
    where.createdAt = {
      gte: new Date(from as string),
      lte: new Date(to as string),
    };
  }

  const walkIns = await prisma.walkInLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  res.json(walkIns);
});

// Create walk-in log
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const {
    customerName,
    phone,
    categoryRequested,
    startDate,
    endDate,
    notes,
    outcome,
    lostReason,
  } = req.body;

  const walkIn = await prisma.walkInLog.create({
    data: {
      customerName,
      phone,
      categoryRequested,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      notes,
      outcome: outcome || 'PENDING',
      lostReason,
      branchId: req.branchId!,
      loggedById: req.userId!,
    },
  });

  res.status(201).json(walkIn);
});

// Update walk-in
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { id } = req.params;
  const { outcome, lostReason, notes } = req.body;

  const walkIn = await prisma.walkInLog.update({
    where: { id },
    data: { outcome, lostReason, notes },
  });

  res.json(walkIn);
});

export default router;
