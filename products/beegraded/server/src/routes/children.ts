import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// Generate play slug from name + birthdate: "niel-20160415"
function generatePlaySlug(name: string, birthdate: string): string {
  const cleanName = name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]/g, '') // alphanumeric only
    .substring(0, 20);
  const dateStr = new Date(birthdate).toISOString().split('T')[0].replace(/-/g, '');
  return `${cleanName}-${dateStr}`;
}

// Calculate age from birthdate
function calculateAge(birthdate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const m = today.getMonth() - birthdate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) age--;
  return age;
}

// --- POPIA Consent ---

// POST /api/children/consent — Record POPIA consent
router.post('/consent', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const parentId = req.userId!;

  await prisma.parent_consent.upsert({
    where: { parent_id: parentId },
    update: {
      popia_accepted: true,
      accepted_at: new Date(),
      ip_address: req.ip || req.headers['x-forwarded-for'] as string || null,
    },
    create: {
      parent_id: parentId,
      popia_accepted: true,
      accepted_at: new Date(),
      ip_address: req.ip || req.headers['x-forwarded-for'] as string || null,
    },
  });

  res.json({ accepted: true });
});

// GET /api/children/consent — Check if parent has given consent
router.get('/consent', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const consent = await prisma.parent_consent.findUnique({
    where: { parent_id: req.userId! },
  });

  res.json({
    accepted: consent?.popia_accepted || false,
    accepted_at: consent?.accepted_at || null,
  });
});

// --- Children CRUD ---

// GET /api/children — List parent's children
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);

  const kids = await prisma.children.findMany({
    where: { parent_id: req.userId! },
    include: {
      subjects: {
        include: { subject: true },
        where: { status: 'active' },
      },
    },
    orderBy: { created_at: 'asc' },
  });

  res.json({
    children: kids.map(k => ({
      id: k.id,
      name: k.name,
      birthdate: k.birthdate,
      age: calculateAge(k.birthdate),
      grade: k.grade,
      language: k.language,
      play_slug: k.play_slug,
      play_url: `/play/${k.play_slug}`,
      subjects: k.subjects.map(s => ({
        id: s.subject.id,
        code: s.subject.code,
        name_en: s.subject.name_en,
        name_af: s.subject.name_af,
        name_tn: s.subject.name_tn,
        status: s.status,
      })),
      created_at: k.created_at,
    })),
  });
});

// POST /api/children — Add a child
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { name, birthdate, grade, language } = req.body;

  if (!name || !birthdate || !grade) {
    throw new AppError('name, birthdate, and grade are required', 400);
  }

  // Check POPIA consent
  const consent = await prisma.parent_consent.findUnique({
    where: { parent_id: req.userId! },
  });
  if (!consent?.popia_accepted) {
    throw new AppError('POPIA consent required before adding children', 403);
  }

  const playSlug = generatePlaySlug(name, birthdate);

  // Check if slug already exists
  const existing = await prisma.children.findUnique({ where: { play_slug: playSlug } });
  if (existing) {
    throw new AppError('A child with this name and birthdate already exists', 409);
  }

  const birthdateObj = new Date(birthdate);
  const age = calculateAge(birthdateObj);

  const child = await prisma.children.create({
    data: {
      parent_id: req.userId!,
      name,
      birthdate: birthdateObj,
      age,
      grade: parseInt(grade),
      language: language || 'af',
      play_slug: playSlug,
    },
  });

  // Auto-assign Maths (free by default)
  const mathsSubject = await prisma.subjects.findUnique({ where: { code: 'maths' } });
  if (mathsSubject) {
    await prisma.child_subjects.create({
      data: {
        child_id: child.id,
        subject_id: mathsSubject.id,
        status: 'active',
      },
    });
  }

  // Auto-link existing math test attempts by player_name match
  // Matches full name, first name, and accent-stripped variants
  // e.g. child "Niel Lange" matches attempts with "Niél", "Niel", "Niel Lange"
  const firstName = name.split(/\s+/)[0];
  const nameStripped = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const firstStripped = firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const namesToMatch = [...new Set([
    name.toLowerCase(),
    nameStripped.toLowerCase(),
    firstName.toLowerCase(),
    firstStripped.toLowerCase(),
  ])];
  const linked = await prisma.math_test_attempts.updateMany({
    where: {
      child_id: null,
      player_name: { in: namesToMatch, mode: 'insensitive' },
    },
    data: { child_id: child.id },
  });

  res.json({
    id: child.id,
    name: child.name,
    age,
    grade: child.grade,
    language: child.language,
    play_slug: child.play_slug,
    play_url: `/play/${child.play_slug}`,
    linked_attempts: linked.count,
  });
});

// PATCH /api/children/:id — Update a child
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const childId = parseInt(req.params.id);
  const { name, grade, language } = req.body;

  // Verify ownership
  const child = await prisma.children.findFirst({
    where: { id: childId, parent_id: req.userId! },
  });
  if (!child) throw new AppError('Child not found', 404);

  const updated = await prisma.children.update({
    where: { id: childId },
    data: {
      ...(name ? { name } : {}),
      ...(grade ? { grade: parseInt(grade) } : {}),
      ...(language ? { language } : {}),
    },
  });

  res.json({
    id: updated.id,
    name: updated.name,
    grade: updated.grade,
    language: updated.language,
    play_slug: updated.play_slug,
    play_url: `/play/${updated.play_slug}`,
  });
});

// DELETE /api/children/:id — Remove a child and all their data
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const childId = parseInt(req.params.id);

  // Verify ownership
  const child = await prisma.children.findFirst({
    where: { id: childId, parent_id: req.userId! },
  });
  if (!child) throw new AppError('Child not found', 404);

  // Delete attempts linked to this child
  await prisma.math_test_attempts.deleteMany({ where: { child_id: childId } });

  // Delete child (cascades to child_subjects)
  await prisma.children.delete({ where: { id: childId } });

  res.json({ deleted: true });
});

// --- Public: Get child by play slug (no auth needed) ---

// GET /api/children/play/:slug — Get child profile for magic link
router.get('/play/:slug', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const slug = req.params.slug;

  const child = await prisma.children.findUnique({
    where: { play_slug: slug },
    include: {
      subjects: {
        include: { subject: true },
        where: { status: 'active' },
      },
    },
  });

  if (!child) throw new AppError('Play link not found', 404);

  // Get recent attempts for this child
  const attempts = await prisma.math_test_attempts.findMany({
    where: { child_id: child.id },
    include: { template: { select: { name: true, grade: true } } },
    orderBy: { created_at: 'desc' },
    take: 5,
  });

  res.json({
    id: child.id,
    name: child.name,
    grade: child.grade,
    language: child.language,
    subjects: child.subjects.map(s => ({
      code: s.subject.code,
      name_en: s.subject.name_en,
      name_af: s.subject.name_af,
      name_tn: s.subject.name_tn,
    })),
    recent_attempts: attempts.map(a => ({
      id: a.id,
      template_name: a.template.name,
      score: a.score,
      total: a.total,
      percentage: Number(a.percentage),
      time_used_sec: a.time_used_sec,
      date: a.created_at,
    })),
  });
});

// --- Subjects list ---

// GET /api/children/subjects — List available subjects
router.get('/subjects', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);

  const subjects = await prisma.subjects.findMany({
    where: { active: true },
    orderBy: { code: 'asc' },
  });

  res.json({ subjects });
});

// --- Parent dashboard: child progress ---

// GET /api/children/:id/progress — Get child's test history
router.get('/:id/progress', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const childId = parseInt(req.params.id);

  // Verify ownership
  const child = await prisma.children.findFirst({
    where: { id: childId, parent_id: req.userId! },
  });
  if (!child) throw new AppError('Child not found', 404);

  const attempts = await prisma.math_test_attempts.findMany({
    where: { child_id: childId },
    include: { template: { select: { name: true, grade: true, operations: true } } },
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  const totalTests = attempts.length;
  const avgScore = totalTests > 0
    ? Math.round(attempts.reduce((sum, a) => sum + Number(a.percentage), 0) / totalTests)
    : 0;
  const bestScore = totalTests > 0
    ? Math.max(...attempts.map(a => Number(a.percentage)))
    : 0;

  res.json({
    child: { id: child.id, name: child.name, grade: child.grade, play_slug: child.play_slug },
    stats: { total_tests: totalTests, average_score: avgScore, best_score: bestScore },
    attempts: attempts.map(a => ({
      id: a.id,
      template_name: a.template.name,
      type: a.template.operations.includes('problem_solving') ? 'problem_solving' : 'speed',
      score: a.score,
      total: a.total,
      percentage: Number(a.percentage),
      time_used_sec: a.time_used_sec,
      date: a.created_at,
    })),
  });
});

export default router;
