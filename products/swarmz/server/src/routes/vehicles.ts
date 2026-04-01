import { Router, Response } from 'express';
import { PrismaClient, VehicleType } from '@prisma/client';
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

// Multer for vehicle document uploads (photos, invoices, contracts)
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads', 'vehicles'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `vdoc-${uuid()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  },
});

function formatVehicle(v: any) {
  return {
    id: v.id,
    name: v.name,
    registration: v.registration,
    make: v.make,
    model: v.model,
    year: v.year,
    color: v.color,
    vin: v.vin,
    photoUrl: v.photoUrl,
    type: v.type.toLowerCase(),
    purchasePrice: v.purchasePrice,
    purchaseDate: v.purchaseDate?.toISOString().split('T')[0] || null,
    purchaseMileage: v.purchaseMileage,
    fixedCostPa: v.fixedCostPa,
    fuelCostPerKm: v.fuelCostPerKm,
    maintenanceCostPerKm: v.maintenanceCostPerKm,
    openingOdometer: v.openingOdometer,
    totalKmYear: v.totalKmYear,
    businessKmYear: v.businessKmYear,
    businessUsePercent: v.businessUsePercent,
    useStartDate: v.useStartDate?.toISOString().split('T')[0] || null,
    useEndDate: v.useEndDate?.toISOString().split('T')[0] || null,
    rentalStart: v.rentalStart?.toISOString().split('T')[0] || null,
    rentalEnd: v.rentalEnd?.toISOString().split('T')[0] || null,
    rentalTotal: v.rentalTotal,
    currentStatus: v.currentStatus.toLowerCase(),
    odometer: v.odometer,
    isDefault: v.isDefault,
    isActive: v.isActive,
    assignedDriverId: v.driverAssignments?.[0]?.driver?.id || null,
    tripCount: v._count?.trips || 0,
    expenseCount: v._count?.expenses || 0,
    createdAt: v.createdAt.toISOString(),
  };
}

// POST /api/vehicles/scan-upload — save license disk photo (accepts base64 JSON)
// MUST be before /:id routes so Express doesn't match "scan-upload" as an :id param
router.post('/scan-upload', async (req: AuthRequest, res: Response) => {
  const { file_data, mime_type, filename } = req.body;
  if (!file_data) throw new AppError('file_data is required', 400);

  const buffer = Buffer.from(file_data, 'base64');
  const ext = (mime_type || 'image/jpeg').split('/')[1] || 'jpg';
  const savedName = `vdoc-${uuid()}.${ext}`;
  const savePath = path.join(__dirname, '..', '..', 'uploads', 'vehicles', savedName);

  const fs = await import('fs');
  fs.writeFileSync(savePath, buffer);

  res.status(201).json({
    filePath: savePath,
    originalName: filename || savedName,
    mimeType: mime_type || 'image/jpeg',
    fileSize: buffer.length,
  });
});

// GET /api/vehicles — list vehicles (active by default, ?all=true for all)
router.get('/', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const showAll = req.query.all === 'true';

  const where: any = { userId: req.userId! };
  if (!showAll) where.isActive = true;

  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: [{ isDefault: 'desc' }, { isActive: 'desc' }, { name: 'asc' }],
    include: {
      driverAssignments: {
        include: { driver: { select: { id: true, name: true } } },
      },
      _count: { select: { trips: true, expenses: true } },
    },
  });

  res.json(vehicles.map(formatVehicle));
});

// GET /api/vehicles/:id — vehicle detail
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    include: {
      driverAssignments: {
        include: { driver: { select: { id: true, name: true } } },
      },
      documents: { orderBy: { createdAt: 'desc' } },
      _count: { select: { trips: true, expenses: true, statusLogs: true } },
    },
  });

  if (!vehicle) throw new AppError('Vehicle not found', 404);

  res.json({
    ...formatVehicle(vehicle),
    statusLogCount: vehicle._count.statusLogs,
    documents: vehicle.documents.map((d) => ({
      id: d.id,
      docType: d.docType.toLowerCase(),
      originalName: d.originalName,
      mimeType: d.mimeType,
      rawExtraction: d.rawExtraction,
      createdAt: d.createdAt.toISOString(),
    })),
  });
});

// POST /api/vehicles — create vehicle
router.post('/', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const {
    name, registration, make, model, year, color, vin, type,
    purchasePrice, purchaseDate, purchaseMileage,
    fixedCostPa, fuelCostPerKm, maintenanceCostPerKm,
    openingOdometer, useStartDate, useEndDate,
    rentalStart, rentalEnd, rentalTotal,
    odometer,
  } = req.body;

  if (!registration || !make || !model || !year) {
    throw new AppError('Registration, make, model and year are required', 400);
  }

  // Auto-set as default if first vehicle
  const vehicleCount = await prisma.vehicle.count({
    where: { userId: req.userId!, isActive: true },
  });
  const isDefault = vehicleCount === 0;

  const vehicleType = (type || 'OWNED').toUpperCase() as VehicleType;

  const vehicle = await prisma.vehicle.create({
    data: {
      userId: req.userId!,
      name: name || `${year} ${make} ${model}`,
      registration: registration.toUpperCase(),
      make,
      model,
      year: parseInt(year),
      color: color || '',
      vin: vin || null,
      type: vehicleType,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      purchaseMileage: purchaseMileage ? parseInt(purchaseMileage) : null,
      fixedCostPa: fixedCostPa ? parseFloat(fixedCostPa) : null,
      fuelCostPerKm: fuelCostPerKm ? parseFloat(fuelCostPerKm) : null,
      maintenanceCostPerKm: maintenanceCostPerKm ? parseFloat(maintenanceCostPerKm) : null,
      openingOdometer: openingOdometer ? parseInt(openingOdometer) : null,
      useStartDate: useStartDate ? new Date(useStartDate) : null,
      useEndDate: useEndDate ? new Date(useEndDate) : null,
      rentalStart: rentalStart ? new Date(rentalStart) : null,
      rentalEnd: rentalEnd ? new Date(rentalEnd) : null,
      rentalTotal: rentalTotal ? parseFloat(rentalTotal) : null,
      odometer: parseInt(odometer) || 0,
      isDefault,
      isActive: true,
    },
  });

  res.status(201).json(formatVehicle(vehicle));
});

// PATCH /api/vehicles/:id — update vehicle
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const existing = await prisma.vehicle.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) throw new AppError('Vehicle not found', 404);

  const {
    name, registration, make, model, year, color, vin, photoUrl, type,
    purchasePrice, purchaseDate, purchaseMileage,
    fixedCostPa, fuelCostPerKm, maintenanceCostPerKm,
    openingOdometer, useStartDate, useEndDate,
    rentalStart, rentalEnd, rentalTotal,
    odometer, isActive,
  } = req.body;

  const vehicle = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(registration && { registration: registration.toUpperCase() }),
      ...(make && { make }),
      ...(model && { model }),
      ...(year && { year: parseInt(year) }),
      ...(color !== undefined && { color }),
      ...(vin !== undefined && { vin }),
      ...(photoUrl !== undefined && { photoUrl }),
      ...(type && { type: (type as string).toUpperCase() as VehicleType }),
      ...(purchasePrice !== undefined && { purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null }),
      ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }),
      ...(purchaseMileage !== undefined && { purchaseMileage: purchaseMileage ? parseInt(purchaseMileage) : null }),
      ...(fixedCostPa !== undefined && { fixedCostPa: fixedCostPa ? parseFloat(fixedCostPa) : null }),
      ...(fuelCostPerKm !== undefined && { fuelCostPerKm: fuelCostPerKm ? parseFloat(fuelCostPerKm) : null }),
      ...(maintenanceCostPerKm !== undefined && { maintenanceCostPerKm: maintenanceCostPerKm ? parseFloat(maintenanceCostPerKm) : null }),
      ...(openingOdometer !== undefined && { openingOdometer: openingOdometer ? parseInt(openingOdometer) : null }),
      ...(useStartDate !== undefined && { useStartDate: useStartDate ? new Date(useStartDate) : null }),
      ...(useEndDate !== undefined && { useEndDate: useEndDate ? new Date(useEndDate) : null }),
      ...(rentalStart !== undefined && { rentalStart: rentalStart ? new Date(rentalStart) : null }),
      ...(rentalEnd !== undefined && { rentalEnd: rentalEnd ? new Date(rentalEnd) : null }),
      ...(rentalTotal !== undefined && { rentalTotal: rentalTotal ? parseFloat(rentalTotal) : null }),
      ...(odometer !== undefined && { odometer: parseInt(odometer) }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  res.json(formatVehicle(vehicle));
});

// POST /api/vehicles/:id/set-default
router.post('/:id/set-default', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  // Unset all defaults
  await prisma.vehicle.updateMany({
    where: { userId: req.userId! },
    data: { isDefault: false },
  });

  // Set this one
  await prisma.vehicle.update({
    where: { id: req.params.id },
    data: { isDefault: true },
  });

  res.json({ message: 'Default vehicle set', vehicleId: req.params.id });
});

// POST /api/vehicles/:id/sync-km — recalculate km from trips for current tax year
router.post('/:id/sync-km', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  // SA tax year March-February
  const now = new Date();
  const year = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
  const start = new Date(`${year}-03-01`);
  const end = new Date(`${year + 1}-02-28`);

  const trips = await prisma.trip.findMany({
    where: { vehicleId: vehicle.id, date: { gte: start, lte: end } },
    select: { distanceKm: true, isBusiness: true },
  });

  const totalKm = Math.round(trips.reduce((sum, t) => sum + t.distanceKm, 0));
  const businessKm = Math.round(trips.filter((t) => t.isBusiness).reduce((sum, t) => sum + t.distanceKm, 0));
  const businessPercent = totalKm > 0 ? Math.round((businessKm / totalKm) * 1000) / 10 : 0;

  const updated = await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: { totalKmYear: totalKm, businessKmYear: businessKm, businessUsePercent: businessPercent },
  });

  res.json({
    vehicleId: vehicle.id,
    totalKmYear: updated.totalKmYear,
    businessKmYear: updated.businessKmYear,
    businessUsePercent: updated.businessUsePercent,
    tripCount: trips.length,
  });
});

// POST /api/vehicles/:id/document — upload vehicle document (photo, invoice, contract)
router.post('/:id/document', upload.single('file'), async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  const file = req.file;
  if (!file) throw new AppError('File is required', 400);

  const { docType, rawExtraction } = req.body;

  const doc = await prisma.vehicleDocument.create({
    data: {
      vehicleId: vehicle.id,
      docType: (docType || 'OTHER').toUpperCase(),
      filePath: file.path,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      rawExtraction: rawExtraction ? JSON.parse(rawExtraction) : null,
    },
  });

  res.status(201).json({
    id: doc.id,
    docType: doc.docType.toLowerCase(),
    originalName: doc.originalName,
    rawExtraction: doc.rawExtraction,
    createdAt: doc.createdAt.toISOString(),
  });
});

// DELETE /api/vehicles/:id — soft delete (deactivate)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const existing = await prisma.vehicle.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) throw new AppError('Vehicle not found', 404);

  await prisma.vehicle.update({
    where: { id: req.params.id },
    data: { isActive: false, isDefault: false },
  });

  res.json({ message: 'Vehicle deactivated' });
});

export default router;
