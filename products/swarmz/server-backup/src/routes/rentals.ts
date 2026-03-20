import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Get all rentals
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { status, branchId, search } = req.query;

  const where: any = {};

  if (status) where.status = status;
  if (branchId) where.branchId = branchId;

  if (req.userRole !== 'ADMIN') {
    where.branchId = req.branchId;
  }

  if (search) {
    where.OR = [
      { bookingRef: { contains: search as string, mode: 'insensitive' } },
      { customer: { firstName: { contains: search as string, mode: 'insensitive' } } },
      { customer: { lastName: { contains: search as string, mode: 'insensitive' } } },
      { vehicle: { registration: { contains: search as string, mode: 'insensitive' } } },
    ];
  }

  const rentals = await prisma.rental.findMany({
    where,
    include: {
      customer: true,
      vehicle: true,
      category: true,
      branch: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(
    rentals.map((r) => ({
      id: r.id,
      bookingRef: r.bookingRef,
      status: r.status,
      customerId: r.customerId,
      customerName: `${r.customer.firstName} ${r.customer.lastName}`,
      vehicleId: r.vehicleId,
      vehicleRegistration: r.vehicle?.registration || null,
      vehicleDescription: r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : null,
      categoryId: r.categoryId,
      categoryName: r.category.name,
      branchId: r.branchId,
      branchName: r.branch.name,
      startDate: r.startDate,
      endDate: r.endDate,
      actualStartDate: r.actualStartDate,
      actualEndDate: r.actualEndDate,
      checkoutOdometer: r.checkoutOdometer,
      returnOdometer: r.returnOdometer,
      checkoutFuel: r.checkoutFuel,
      returnFuel: r.returnFuel,
      checkoutInspectionId: r.checkoutInspectionId,
      returnInspectionId: r.returnInspectionId,
      hasDamage: r.hasDamage,
      createdAt: r.createdAt,
    }))
  );
});

// Get active rentals (for return lookup)
router.get('/active', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { search } = req.query;

  const where: any = { status: 'ACTIVE' };

  if (req.userRole !== 'ADMIN') {
    where.branchId = req.branchId;
  }

  if (search) {
    where.OR = [
      { vehicle: { registration: { contains: search as string, mode: 'insensitive' } } },
      { bookingRef: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const rentals = await prisma.rental.findMany({
    where,
    include: {
      customer: true,
      vehicle: true,
      category: true,
      branch: true,
    },
    orderBy: { endDate: 'asc' },
  });

  res.json(
    rentals.map((r) => ({
      id: r.id,
      bookingRef: r.bookingRef,
      status: r.status,
      customerName: `${r.customer.firstName} ${r.customer.lastName}`,
      vehicleId: r.vehicleId,
      vehicleRegistration: r.vehicle?.registration,
      categoryName: r.category.name,
      startDate: r.startDate,
      endDate: r.endDate,
      checkoutOdometer: r.checkoutOdometer,
      checkoutFuel: r.checkoutFuel,
    }))
  );
});

// Find rental by booking reference
router.get('/booking/:bookingRef', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { bookingRef } = req.params;

  const rental = await prisma.rental.findUnique({
    where: { bookingRef },
    include: {
      customer: true,
      vehicle: true,
      category: true,
      branch: true,
    },
  });

  if (!rental) {
    throw new AppError('Rental not found', 404);
  }

  res.json({
    id: rental.id,
    bookingRef: rental.bookingRef,
    status: rental.status,
    customerId: rental.customerId,
    customerName: `${rental.customer.firstName} ${rental.customer.lastName}`,
    vehicleId: rental.vehicleId,
    vehicleRegistration: rental.vehicle?.registration || null,
    categoryId: rental.categoryId,
    categoryName: rental.category.name,
    branchId: rental.branchId,
    branchName: rental.branch.name,
    startDate: rental.startDate,
    endDate: rental.endDate,
    checkoutOdometer: rental.checkoutOdometer,
    checkoutFuel: rental.checkoutFuel,
  });
});

// Get single rental
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { id } = req.params;

  const rental = await prisma.rental.findUnique({
    where: { id },
    include: {
      customer: true,
      vehicle: true,
      category: true,
      branch: true,
    },
  });

  if (!rental) {
    throw new AppError('Rental not found', 404);
  }

  res.json({
    id: rental.id,
    bookingRef: rental.bookingRef,
    status: rental.status,
    customerId: rental.customerId,
    customerName: `${rental.customer.firstName} ${rental.customer.lastName}`,
    vehicleId: rental.vehicleId,
    vehicleRegistration: rental.vehicle?.registration || null,
    vehicleDescription: rental.vehicle ? `${rental.vehicle.make} ${rental.vehicle.model}` : null,
    categoryId: rental.categoryId,
    categoryName: rental.category.name,
    branchId: rental.branchId,
    branchName: rental.branch.name,
    startDate: rental.startDate,
    endDate: rental.endDate,
    actualStartDate: rental.actualStartDate,
    actualEndDate: rental.actualEndDate,
    checkoutOdometer: rental.checkoutOdometer,
    returnOdometer: rental.returnOdometer,
    checkoutFuel: rental.checkoutFuel,
    returnFuel: rental.returnFuel,
    checkoutInspectionId: rental.checkoutInspectionId,
    returnInspectionId: rental.returnInspectionId,
    hasDamage: rental.hasDamage,
    createdAt: rental.createdAt,
  });
});

// Process checkout
router.post('/:id/checkout', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { id } = req.params;
  const { vehicleId, odometer, fuelLevel, inspectionId } = req.body;

  const rental = await prisma.rental.findUnique({ where: { id } });

  if (!rental) {
    throw new AppError('Rental not found', 404);
  }

  if (rental.status !== 'RESERVED') {
    throw new AppError('Rental is not in RESERVED status', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update rental
    const updatedRental = await tx.rental.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        vehicleId,
        actualStartDate: new Date(),
        checkoutOdometer: odometer,
        checkoutFuel: fuelLevel,
        checkoutInspectionId: inspectionId,
        checkedOutById: req.userId,
      },
      include: {
        customer: true,
        vehicle: true,
        category: true,
        branch: true,
      },
    });

    // Update vehicle status and odometer
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: {
        status: 'OUT',
        odometer,
        fuelLevel,
        lastInspectionDate: new Date(),
      },
    });

    // Log vehicle status change
    await tx.vehicleStatusLog.create({
      data: {
        vehicleId,
        previousStatus: 'READY',
        newStatus: 'OUT',
        changedById: req.userId!,
        notes: `Checkout for rental ${rental.bookingRef}`,
      },
    });

    return updatedRental;
  });

  res.json({
    id: result.id,
    bookingRef: result.bookingRef,
    status: result.status,
    vehicleId: result.vehicleId,
    vehicleRegistration: result.vehicle?.registration,
    customerName: `${result.customer.firstName} ${result.customer.lastName}`,
  });
});

// Process return
router.patch('/:id/return', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { id } = req.params;
  const { odometer, fuelLevel, inspectionId, hasDamage } = req.body;

  const rental = await prisma.rental.findUnique({
    where: { id },
    include: { vehicle: true },
  });

  if (!rental) {
    throw new AppError('Rental not found', 404);
  }

  if (rental.status !== 'ACTIVE') {
    throw new AppError('Rental is not active', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update rental
    const updatedRental = await tx.rental.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualEndDate: new Date(),
        returnOdometer: odometer,
        returnFuel: fuelLevel,
        returnInspectionId: inspectionId,
        hasDamage: hasDamage || false,
        checkedInById: req.userId,
      },
      include: {
        customer: true,
        vehicle: true,
        category: true,
        branch: true,
      },
    });

    // Update vehicle
    const newStatus = hasDamage ? 'WORKSHOP' : 'RETURNED';
    await tx.vehicle.update({
      where: { id: rental.vehicleId! },
      data: {
        status: newStatus,
        odometer,
        fuelLevel,
        lastInspectionDate: new Date(),
      },
    });

    // Log vehicle status change
    await tx.vehicleStatusLog.create({
      data: {
        vehicleId: rental.vehicleId!,
        previousStatus: 'OUT',
        newStatus,
        changedById: req.userId!,
        notes: `Return for rental ${rental.bookingRef}${hasDamage ? ' - damage reported' : ''}`,
      },
    });

    return updatedRental;
  });

  res.json({
    id: result.id,
    bookingRef: result.bookingRef,
    status: result.status,
    hasDamage: result.hasDamage,
  });
});

export default router;
