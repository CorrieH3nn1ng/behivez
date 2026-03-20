import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, process.env.STORAGE_PATH || './uploads');
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Create inspection
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { vehicleId, rentalId, type, odometer, fuelLevel, notes, damages } = req.body;

  const inspection = await prisma.inspection.create({
    data: {
      vehicleId,
      rentalId,
      type,
      odometer,
      fuelLevel,
      notes,
      performedById: req.userId!,
      damages: damages ? {
        create: damages.map((d: any) => ({
          location: d.location,
          description: d.description,
          severity: d.severity,
          isPreExisting: d.isPreExisting || false,
        })),
      } : undefined,
    },
    include: {
      damages: true,
      photos: true,
    },
  });

  res.status(201).json(inspection);
});

// Get inspection
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { id } = req.params;

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      vehicle: true,
      damages: true,
      photos: true,
      performedBy: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  if (!inspection) {
    throw new AppError('Inspection not found', 404);
  }

  res.json(inspection);
});

// Upload photo to inspection
router.post(
  '/:id/photos',
  authenticate,
  upload.single('photo'),
  async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.locals.prisma;
    const { id } = req.params;
    const { position } = req.body;

    if (!req.file) {
      throw new AppError('Photo file required', 400);
    }

    const inspection = await prisma.inspection.findUnique({ where: { id } });

    if (!inspection) {
      throw new AppError('Inspection not found', 404);
    }

    const photo = await prisma.inspectionPhoto.create({
      data: {
        inspectionId: id,
        position,
        filePath: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
      },
    });

    res.status(201).json(photo);
  }
);

// Update inspection
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.locals.prisma;
  const { id } = req.params;
  const { notes, customerSignature } = req.body;

  const inspection = await prisma.inspection.update({
    where: { id },
    data: {
      notes,
      customerSignature,
    },
    include: {
      damages: true,
      photos: true,
    },
  });

  res.json(inspection);
});

export default router;
