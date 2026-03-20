import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticate);

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// GET /api/vehicles
router.get('/', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const vehicles = await prisma.vehicle.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    include: {
      driverAssignments: {
        include: { driver: { select: { id: true, name: true } } },
      },
    },
  });

  res.json(
    vehicles.map((v) => ({
      id: v.id,
      registration: v.registration,
      make: v.make,
      model: v.model,
      year: v.year,
      color: v.color,
      photoUrl: v.photoUrl,
      currentStatus: v.currentStatus.toLowerCase(),
      odometer: v.odometer,
      assignedDriverId: v.driverAssignments[0]?.driver.id || null,
      createdAt: v.createdAt.toISOString(),
    }))
  );
});

// GET /api/vehicles/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });

  if (!vehicle) throw new AppError('Vehicle not found', 404);

  res.json({
    id: vehicle.id,
    registration: vehicle.registration,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    photoUrl: vehicle.photoUrl,
    currentStatus: vehicle.currentStatus.toLowerCase(),
    odometer: vehicle.odometer,
    createdAt: vehicle.createdAt.toISOString(),
  });
});

// POST /api/vehicles
router.post('/', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { registration, make, model, year, color, odometer } = req.body;

  if (!registration || !make || !model || !year) {
    throw new AppError('Registration, make, model and year are required', 400);
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      userId: req.userId!,
      registration: registration.toUpperCase(),
      make,
      model,
      year: parseInt(year),
      color: color || '',
      odometer: parseInt(odometer) || 0,
    },
  });

  res.status(201).json({
    id: vehicle.id,
    registration: vehicle.registration,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    photoUrl: vehicle.photoUrl,
    currentStatus: vehicle.currentStatus.toLowerCase(),
    odometer: vehicle.odometer,
    createdAt: vehicle.createdAt.toISOString(),
  });
});

// PATCH /api/vehicles/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const existing = await prisma.vehicle.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) throw new AppError('Vehicle not found', 404);

  const { registration, make, model, year, color, odometer, photoUrl } = req.body;

  const vehicle = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: {
      ...(registration && { registration: registration.toUpperCase() }),
      ...(make && { make }),
      ...(model && { model }),
      ...(year && { year: parseInt(year) }),
      ...(color !== undefined && { color }),
      ...(odometer !== undefined && { odometer: parseInt(odometer) }),
      ...(photoUrl !== undefined && { photoUrl }),
    },
  });

  res.json({
    id: vehicle.id,
    registration: vehicle.registration,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    photoUrl: vehicle.photoUrl,
    currentStatus: vehicle.currentStatus.toLowerCase(),
    odometer: vehicle.odometer,
    createdAt: vehicle.createdAt.toISOString(),
  });
});

// DELETE /api/vehicles/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const existing = await prisma.vehicle.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) throw new AppError('Vehicle not found', 404);

  await prisma.vehicle.delete({ where: { id: req.params.id } });
  res.json({ message: 'Vehicle deleted' });
});

export default router;
