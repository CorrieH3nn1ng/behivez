import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

const DEFAULT_NOTIFICATIONS = {
  licenceExpiry: false,
  serviceDue: false,
  taxYearEnd: false,
  monthlySummary: false,
};

type SettingsRow = {
  onboarded: boolean;
  persona: string | null;
  moduleAiScan: boolean;
  moduleTax: boolean;
  moduleFleet: boolean;
  notifications: unknown;
};

// Shape the DB row into the nested object the frontend uses
function serialize(s: SettingsRow) {
  return {
    onboarded: s.onboarded,
    persona: s.persona,
    modules: {
      expenses: true, // core — always on
      aiScan: s.moduleAiScan,
      tax: s.moduleTax,
      fleet: s.moduleFleet,
    },
    notifications: { ...DEFAULT_NOTIFICATIONS, ...((s.notifications as object) || {}) },
  };
}

// Keep only known notification keys, coerce to booleans
function cleanNotifications(input: Record<string, unknown>) {
  return {
    licenceExpiry: !!input.licenceExpiry,
    serviceDue: !!input.serviceDue,
    taxYearEnd: !!input.taxYearEnd,
    monthlySummary: !!input.monthlySummary,
  };
}

// GET /api/settings — current user's settings (creates defaults on first call)
router.get('/', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  let settings = await prisma.userSettings.findUnique({ where: { userId: req.userId! } });
  if (!settings) {
    settings = await prisma.userSettings.create({ data: { userId: req.userId! } });
  }
  res.json(serialize(settings as unknown as SettingsRow));
});

// PATCH /api/settings — update persona / onboarded / feature modules / notifications
router.patch('/', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { onboarded, persona, modules, notifications } = req.body;

  const data: Record<string, unknown> = {};
  if (typeof onboarded === 'boolean') data.onboarded = onboarded;
  if (persona !== undefined) data.persona = persona;

  if (modules && typeof modules === 'object') {
    if (typeof modules.aiScan === 'boolean') data.moduleAiScan = modules.aiScan;
    if (typeof modules.tax === 'boolean') data.moduleTax = modules.tax;
    if (typeof modules.fleet === 'boolean') data.moduleFleet = modules.fleet;
  }

  if (notifications && typeof notifications === 'object') {
    const existing = await prisma.userSettings.findUnique({ where: { userId: req.userId! } });
    data.notifications = cleanNotifications({
      ...DEFAULT_NOTIFICATIONS,
      ...((existing?.notifications as object) || {}),
      ...notifications,
    });
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId!, ...data },
    update: data,
  });

  res.json(serialize(settings as unknown as SettingsRow));
});

export default router;
