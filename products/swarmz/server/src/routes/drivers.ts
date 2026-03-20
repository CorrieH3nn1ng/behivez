import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticate);

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// GET /api/drivers
router.get('/', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const drivers = await prisma.driver.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    include: {
      vehicleAssignments: { select: { vehicleId: true } },
    },
  });

  res.json(
    drivers.map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      inviteStatus: d.inviteStatus.toLowerCase(),
      assignedVehicleIds: d.vehicleAssignments.map((a) => a.vehicleId),
      createdAt: d.createdAt.toISOString(),
    }))
  );
});

// POST /api/drivers (invite)
router.post('/', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { name, email, phone } = req.body;

  if (!name || !email) {
    throw new AppError('Name and email are required', 400);
  }

  const driver = await prisma.driver.create({
    data: {
      userId: req.userId!,
      name,
      email,
      phone: phone || '',
    },
  });

  res.status(201).json({
    id: driver.id,
    name: driver.name,
    email: driver.email,
    phone: driver.phone,
    inviteStatus: driver.inviteStatus.toLowerCase(),
    assignedVehicleIds: [],
    createdAt: driver.createdAt.toISOString(),
  });
});

// DELETE /api/drivers/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const existing = await prisma.driver.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) throw new AppError('Driver not found', 404);

  await prisma.driver.delete({ where: { id: req.params.id } });
  res.json({ message: 'Driver removed' });
});

// POST /api/drivers/:id/assign
router.post('/:id/assign', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { vehicleId } = req.body;

  if (!vehicleId) throw new AppError('vehicleId is required', 400);

  const driver = await prisma.driver.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!driver) throw new AppError('Driver not found', 404);

  await prisma.driverVehicle.create({
    data: { driverId: driver.id, vehicleId },
  });

  res.json({ message: 'Vehicle assigned' });
});

// DELETE /api/drivers/:id/assign/:vehicleId
router.delete('/:id/assign/:vehicleId', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  await prisma.driverVehicle.deleteMany({
    where: { driverId: req.params.id, vehicleId: req.params.vehicleId },
  });
  res.json({ message: 'Vehicle unassigned' });
});

export default router;
