import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Process sync queue
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { operations } = req.body;

  const results: any[] = [];

  for (const op of operations) {
    try {
      let result: any;

      switch (op.entityType) {
        case 'vehicle_status':
          result = await processVehicleStatusSync(prisma, op, req.userId!);
          break;
        case 'inspection':
          result = await processInspectionSync(prisma, op, req.userId!);
          break;
        case 'walkin':
          result = await processWalkInSync(prisma, op, req);
          break;
        default:
          throw new Error(`Unknown entity type: ${op.entityType}`);
      }

      results.push({
        localId: op.localId,
        serverId: result.id,
        status: 'success',
      });
    } catch (error: any) {
      results.push({
        localId: op.localId,
        status: 'error',
        error: error.message,
      });
    }
  }

  res.json({ results });
});

async function processVehicleStatusSync(
  prisma: PrismaClient,
  op: any,
  userId: string
) {
  const { entityId, data } = op;

  const vehicle = await prisma.vehicle.findUnique({ where: { id: entityId } });
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  const previousStatus = vehicle.status;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedVehicle = await tx.vehicle.update({
      where: { id: entityId },
      data: { status: data.status },
    });

    await tx.vehicleStatusLog.create({
      data: {
        vehicleId: entityId,
        previousStatus,
        newStatus: data.status,
        changedById: userId,
        notes: data.notes || 'Synced from offline',
      },
    });

    return updatedVehicle;
  });

  return updated;
}

async function processInspectionSync(
  prisma: PrismaClient,
  op: any,
  userId: string
) {
  const { data } = op;

  const inspection = await prisma.inspection.create({
    data: {
      id: uuidv4(),
      vehicleId: data.vehicleId,
      rentalId: data.rentalId,
      type: data.type,
      odometer: data.odometer,
      fuelLevel: data.fuelLevel,
      notes: data.notes,
      customerSignature: data.customerSignature,
      performedById: userId,
      damages: data.damages ? {
        create: data.damages.map((d: any) => ({
          location: d.location,
          description: d.description,
          severity: d.severity,
          isPreExisting: d.isPreExisting || false,
        })),
      } : undefined,
    },
  });

  return inspection;
}

async function processWalkInSync(
  prisma: PrismaClient,
  op: any,
  req: AuthRequest
) {
  const { data } = op;

  const walkIn = await prisma.walkInLog.create({
    data: {
      customerName: data.customerName,
      phone: data.phone,
      categoryRequested: data.categoryRequested,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      notes: data.notes,
      outcome: data.outcome || 'PENDING',
      lostReason: data.lostReason,
      branchId: req.branchId!,
      loggedById: req.userId!,
    },
  });

  return walkIn;
}

// Get sync status
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({
    serverTime: new Date().toISOString(),
    status: 'online',
  });
});

export default router;
