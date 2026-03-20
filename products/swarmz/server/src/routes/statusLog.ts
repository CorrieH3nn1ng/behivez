import { Router, Response } from 'express';
import { PrismaClient, VehicleStatus } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticate);

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// Multer config for receipt photos
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads', 'receipts'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const STATUS_MAP: Record<string, VehicleStatus> = {
  available: 'AVAILABLE',
  out: 'OUT',
  fueling: 'FUELING',
  service: 'SERVICE',
  repair: 'REPAIR',
  cleaning: 'CLEANING',
  accident: 'ACCIDENT',
  towed: 'TOWED',
};

const CATEGORY_MAP: Record<string, string> = {
  fuel: 'FUEL',
  service: 'SERVICE',
  repair: 'REPAIR',
  cleaning: 'CLEANING',
  accident: 'ACCIDENT',
  other: 'OTHER',
};

// GET /api/status-log?vehicleId=xxx
router.get('/', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { vehicleId } = req.query;

  const where: any = { userId: req.userId! };
  if (vehicleId) where.vehicleId = vehicleId as string;

  const entries = await prisma.statusLogEntry.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    include: { receiptPhotos: true },
  });

  res.json(
    entries.map((e) => ({
      id: e.id,
      vehicleId: e.vehicleId,
      status: e.status.toLowerCase(),
      timestamp: e.timestamp.toISOString(),
      odometer: e.odometer,
      costAmount: e.costAmount,
      costCategory: e.costCategory?.toLowerCase() || null,
      vendor: e.vendor,
      notes: e.notes,
      receiptPhotos: e.receiptPhotos.map((p) => ({
        id: p.id,
        url: `/uploads/receipts/${path.basename(p.filePath)}`,
        originalName: p.originalName,
      })),
    }))
  );
});

// POST /api/status-log
router.post('/', upload.array('receipts', 5), async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { vehicleId, status, odometer, costAmount, costCategory, vendor, notes } = req.body;

  if (!vehicleId || !status) {
    throw new AppError('vehicleId and status are required', 400);
  }

  // Verify vehicle belongs to user
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, userId: req.userId! },
  });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  const dbStatus = STATUS_MAP[status];
  if (!dbStatus) throw new AppError('Invalid status', 400);

  // Create status log entry
  const entry = await prisma.statusLogEntry.create({
    data: {
      vehicleId,
      userId: req.userId!,
      status: dbStatus,
      odometer: odometer ? parseInt(odometer) : null,
      costAmount: costAmount ? parseFloat(costAmount) : null,
      costCategory: costCategory ? (CATEGORY_MAP[costCategory] as any) : null,
      vendor: vendor || null,
      notes: notes || null,
    },
  });

  // Save receipt photos
  const files = (req.files as Express.Multer.File[]) || [];
  const photos = [];
  for (const file of files) {
    const photo = await prisma.receiptPhoto.create({
      data: {
        statusLogId: entry.id,
        filePath: file.path,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
      },
    });
    photos.push(photo);
  }

  // Update vehicle status + odometer
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      currentStatus: dbStatus,
      ...(odometer ? { odometer: parseInt(odometer) } : {}),
    },
  });

  res.status(201).json({
    id: entry.id,
    vehicleId: entry.vehicleId,
    status: entry.status.toLowerCase(),
    timestamp: entry.timestamp.toISOString(),
    odometer: entry.odometer,
    costAmount: entry.costAmount,
    costCategory: entry.costCategory?.toLowerCase() || null,
    vendor: entry.vendor,
    notes: entry.notes,
    receiptPhotos: photos.map((p) => ({
      id: p.id,
      url: `/uploads/receipts/${path.basename(p.filePath)}`,
      originalName: p.originalName,
    })),
  });
});

export default router;
