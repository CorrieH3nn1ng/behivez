import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// GET /api/subscription — return current plan for logged-in user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);

  // OWNER/ADMIN always get all_subjects
  if (req.userRole === 'OWNER' || req.userRole === 'ADMIN') {
    res.json({ plan: 'all_subjects', subjects: [], status: 'active', expires_at: null });
    return;
  }

  const sub = await prisma.grade_subscriptions.findUnique({
    where: { auth_user_id: req.userId! },
  });

  if (!sub || sub.status !== 'active') {
    res.json({ plan: 'free', subjects: [], status: 'free', expires_at: null });
    return;
  }

  // Check expiry
  if (sub.expires_at && sub.expires_at < new Date()) {
    await prisma.grade_subscriptions.update({
      where: { auth_user_id: req.userId! },
      data: { status: 'cancelled' },
    });
    res.json({ plan: 'free', subjects: [], status: 'expired', expires_at: sub.expires_at });
    return;
  }

  res.json({
    plan: sub.plan,
    subjects: sub.subjects,
    status: sub.status,
    expires_at: sub.expires_at,
  });
});

// GET /api/subscription/plans — public pricing info
router.get('/plans', (_req, res: Response) => {
  res.json([
    {
      id: 'per_subject',
      name_en: 'Per Subject',
      name_af: 'Per Vak',
      price: 29,
      subject_count: 1,
      description_en: 'Pick 1 subject — AI tests, study mode, progress tracking',
      description_af: 'Kies 1 vak — KI-toetse, studie-modus, vordering',
    },
    {
      id: 'three_subjects',
      name_en: '3 Subjects',
      name_af: '3 Vakke',
      price: 69,
      subject_count: 3,
      description_en: 'Pick any 3 subjects — AI tests, study mode, progress tracking',
      description_af: 'Kies enige 3 vakke — KI-toetse, studie-modus, vordering',
    },
    {
      id: 'all_subjects',
      name_en: 'All Subjects',
      name_af: 'Alle Vakke',
      price: 99,
      subject_count: null,
      description_en: 'Every subject unlocked — AI tests, study mode, unlimited children',
      description_af: 'Elke vak ontsluit — KI-toetse, studie-modus, onbeperkte kinders',
    },
  ]);
});

export default router;
