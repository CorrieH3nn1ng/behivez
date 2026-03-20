import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Get all vehicles
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { status, categoryId, branchId, search } = req.query;

  const where: any = {};

  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (branchId) where.branchId = branchId;

  // Non-admin users only see their branch
  if (req.userRole !== 'ADMIN') {
    where.branchId = req.branchId;
  }

  if (search) {
    where.OR = [
      { registration: { contains: search as string, mode: 'insensitive' } },
      { make: { contains: search as string, mode: 'insensitive' } },
      { model: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      category: true,
      branch: true,
    },
    orderBy: { registration: 'asc' },
  });

  res.json(
    vehicles.map((v) => ({
      id: v.id,
      registration: v.registration,
      make: v.make,
      model: v.model,
      year: v.year,
      color: v.color,
      categoryId: v.categoryId,
      categoryName: v.category.name,
      status: v.status,
      branchId: v.branchId,
      branchName: v.branch.name,
      odometer: v.odometer,
      fuelLevel: v.fuelLevel,
      lastInspectionDate: v.lastInspectionDate,
      imageUrl: v.imageUrl,
    }))
  );
});

// Get single vehicle
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { id } = req.params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      category: true,
      branch: true,
    },
  });

  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }

  res.json({
    id: vehicle.id,
    registration: vehicle.registration,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    categoryId: vehicle.categoryId,
    categoryName: vehicle.category.name,
    status: vehicle.status,
    branchId: vehicle.branchId,
    branchName: vehicle.branch.name,
    odometer: vehicle.odometer,
    fuelLevel: vehicle.fuelLevel,
    lastInspectionDate: vehicle.lastInspectionDate,
    imageUrl: vehicle.imageUrl,
    vin: vehicle.vin,
    licenseDueDate: vehicle.licenseDueDate,
    serviceDueDate: vehicle.serviceDueDate,
    serviceDueOdometer: vehicle.serviceDueOdometer,
  });
});

// Update vehicle status
router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { id } = req.params;
  const { status, notes } = req.body;

  const vehicle = await prisma.vehicle.findUnique({ where: { id } });

  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }

  const previousStatus = vehicle.status;

  const updated = await prisma.$transaction(async (tx) => {
    // Update vehicle
    const updatedVehicle = await tx.vehicle.update({
      where: { id },
      data: { status },
      include: { category: true, branch: true },
    });

    // Log status change
    await tx.vehicleStatusLog.create({
      data: {
        vehicleId: id,
        previousStatus,
        newStatus: status,
        changedById: req.userId!,
        notes,
      },
    });

    return updatedVehicle;
  });

  res.json({
    id: updated.id,
    registration: updated.registration,
    make: updated.make,
    model: updated.model,
    year: updated.year,
    color: updated.color,
    categoryId: updated.categoryId,
    categoryName: updated.category.name,
    status: updated.status,
    branchId: updated.branchId,
    branchName: updated.branch.name,
    odometer: updated.odometer,
    fuelLevel: updated.fuelLevel,
    lastInspectionDate: updated.lastInspectionDate,
    imageUrl: updated.imageUrl,
  });
});

export default router;
