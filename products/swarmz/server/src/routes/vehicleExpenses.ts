import { Router, Response } from 'express';
import { PrismaClient, ExpenseCategory, ExpenseSource } from '@prisma/client';
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

// Multer for receipt uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads', 'receipts'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `expense-${uuid()}${ext}`);
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

const VALID_CATEGORIES = [
  'FUEL', 'SERVICE', 'TYRES', 'INSURANCE', 'TOLL',
  'LICENCE', 'PARKING', 'FINANCE', 'DEPRECIATION', 'OTHER',
];

// GET /api/vehicle-expenses — list expenses
router.get('/', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { vehicle_id, category, date_from, date_to, tax_year } = req.query;

  const where: any = { userId: req.userId! };

  if (vehicle_id) where.vehicleId = vehicle_id as string;
  if (category) where.category = (category as string).toUpperCase();

  if (tax_year) {
    const [startYear] = (tax_year as string).split('/').map(Number);
    where.date = {
      gte: new Date(`${startYear}-03-01`),
      lte: new Date(`${startYear + 1}-02-28`),
    };
  } else if (date_from || date_to) {
    where.date = {};
    if (date_from) where.date.gte = new Date(date_from as string);
    if (date_to) where.date.lte = new Date(date_to as string);
  }

  const expenses = await prisma.vehicleExpense.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      vehicle: { select: { id: true, name: true, registration: true } },
    },
  });

  res.json(
    expenses.map((e) => ({
      id: e.id,
      vehicleId: e.vehicleId,
      vehicle: e.vehicle,
      date: e.date.toISOString().split('T')[0],
      category: e.category.toLowerCase(),
      amount: e.amount,
      vendor: e.vendor,
      description: e.description,
      litres: e.litres,
      pricePerLitre: e.pricePerLitre,
      odometerKm: e.odometerKm,
      receiptPath: e.receiptPath,
      source: e.source.toLowerCase(),
      createdAt: e.createdAt.toISOString(),
    }))
  );
});

// GET /api/vehicle-expenses/summary — totals by category and vehicle
router.get('/summary', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { vehicle_id, tax_year } = req.query;

  const where: any = { userId: req.userId! };
  if (vehicle_id) where.vehicleId = vehicle_id as string;

  if (tax_year) {
    const [startYear] = (tax_year as string).split('/').map(Number);
    where.date = {
      gte: new Date(`${startYear}-03-01`),
      lte: new Date(`${startYear + 1}-02-28`),
    };
  }

  const expenses = await prisma.vehicleExpense.findMany({
    where,
    select: { category: true, amount: true, vehicleId: true },
  });

  // By category
  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    const cat = e.category.toLowerCase();
    byCategory[cat] = (byCategory[cat] || 0) + e.amount;
  }

  // By vehicle
  const byVehicle: Record<string, number> = {};
  for (const e of expenses) {
    byVehicle[e.vehicleId] = (byVehicle[e.vehicleId] || 0) + e.amount;
  }

  const totalActualCost = expenses.reduce((sum, e) => sum + e.amount, 0);

  res.json({
    totalActualCost: Math.round(totalActualCost * 100) / 100,
    totalExpenses: expenses.length,
    byCategory,
    byVehicle,
  });
});

// POST /api/vehicle-expenses — create expense
router.post('/', upload.single('receipt'), async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const {
    vehicleId, date, category, amount, vendor, description,
    litres, pricePerLitre, odometerKm, source,
  } = req.body;

  if (!vehicleId || !date || !category || !amount) {
    throw new AppError('vehicleId, date, category, and amount are required', 400);
  }

  const cat = (category as string).toUpperCase();
  if (!VALID_CATEGORIES.includes(cat)) {
    throw new AppError(`Invalid category. Valid: ${VALID_CATEGORIES.join(', ')}`, 400);
  }

  const file = req.file;

  const expense = await prisma.vehicleExpense.create({
    data: {
      userId: req.userId!,
      vehicleId,
      date: new Date(date),
      category: cat as ExpenseCategory,
      amount: parseFloat(amount),
      vendor: vendor || null,
      description: description || null,
      litres: litres ? parseFloat(litres) : null,
      pricePerLitre: pricePerLitre ? parseFloat(pricePerLitre) : null,
      odometerKm: odometerKm ? parseInt(odometerKm) : null,
      receiptPath: file?.path || null,
      source: (source || 'MANUAL').toUpperCase() as ExpenseSource,
    },
  });

  res.status(201).json({
    id: expense.id,
    vehicleId: expense.vehicleId,
    date: expense.date.toISOString().split('T')[0],
    category: expense.category.toLowerCase(),
    amount: expense.amount,
    vendor: expense.vendor,
    source: expense.source.toLowerCase(),
    createdAt: expense.createdAt.toISOString(),
  });
});

// PUT /api/vehicle-expenses/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const existing = await prisma.vehicleExpense.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) throw new AppError('Expense not found', 404);

  const { date, category, amount, vendor, description, litres, pricePerLitre, odometerKm } = req.body;

  const expense = await prisma.vehicleExpense.update({
    where: { id: req.params.id },
    data: {
      ...(date && { date: new Date(date) }),
      ...(category && { category: (category as string).toUpperCase() as ExpenseCategory }),
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      ...(vendor !== undefined && { vendor }),
      ...(description !== undefined && { description }),
      ...(litres !== undefined && { litres: litres ? parseFloat(litres) : null }),
      ...(pricePerLitre !== undefined && { pricePerLitre: pricePerLitre ? parseFloat(pricePerLitre) : null }),
      ...(odometerKm !== undefined && { odometerKm: odometerKm ? parseInt(odometerKm) : null }),
    },
  });

  res.json({
    id: expense.id,
    date: expense.date.toISOString().split('T')[0],
    category: expense.category.toLowerCase(),
    amount: expense.amount,
  });
});

// DELETE /api/vehicle-expenses/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const existing = await prisma.vehicleExpense.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) throw new AppError('Expense not found', 404);

  await prisma.vehicleExpense.delete({ where: { id: req.params.id } });
  res.json({ message: 'Expense deleted' });
});

export default router;
