import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
// @ts-expect-error — pdf-parse@1.1.1 has no types
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Resolve auth JWT (UUID + email) to a local beegraded users row.
 * Creates the row on first encounter so papers can be linked.
 */
async function getOrCreateLocalUser(prisma: PrismaClient, req: AuthRequest) {
  if (!req.userEmail) return null;

  let user = await prisma.users.findUnique({ where: { email: req.userEmail } });
  if (!user) {
    user = await prisma.users.create({
      data: {
        email: req.userEmail,
        name: null,
      },
    });
  }
  return user;
}

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .pdf, .docx, and .doc files are allowed'));
    }
  },
});

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// Extract text from uploaded file buffer
async function extractText(buffer: Buffer, mimetype: string): Promise<{ text: string; pageCount: number }> {
  if (mimetype === 'application/pdf') {
    const result = await pdfParse(buffer);
    return { text: result.text, pageCount: result.numpages };
  }

  // DOCX
  const result = await mammoth.extractRawText({ buffer });
  // Estimate pages from word count (~250 words/page)
  const words = result.value.split(/\s+/).filter(Boolean).length;
  const pageCount = Math.max(1, Math.ceil(words / 250));
  return { text: result.value, pageCount };
}

// POST /api/papers — upload paper file, extract text, save to DB
router.post('/', optionalAuth, upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const { subject, assessment_type, num_questions, draft_or_final, linked_paper_id, token_code } = req.body;
  if (!subject) throw new AppError('subject is required', 400);

  const prisma = getPrisma(req);

  // Resolve auth user to local user row
  const localUser = await getOrCreateLocalUser(prisma, req);

  // Extract text from file
  const { text, pageCount } = await extractText(req.file.buffer, req.file.mimetype);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Save paper to DB
  const paper = await prisma.papers.create({
    data: {
      user_id: localUser?.id ?? null,
      filename: req.file.originalname,
      subject,
      assessment_type: assessment_type || 'Summative Assessment',
      num_questions: Number(num_questions) || 0,
      paper_text: text,
      word_count: wordCount,
      page_count: pageCount,
      draft_or_final: draft_or_final || 'draft',
      linked_paper_id: linked_paper_id ? Number(linked_paper_id) : null,
    },
  });

  // If token_code provided, link paper to token
  if (token_code) {
    const draftOrFinal = draft_or_final || 'draft';
    const field = draftOrFinal === 'final' ? 'final_paper_id' : 'draft_paper_id';
    await prisma.tokens.updateMany({
      where: { code: token_code },
      data: { [field]: paper.id },
    });
  }

  res.status(201).json({
    paper_id: paper.id,
    word_count: wordCount,
    page_count: pageCount,
  });
});

// GET /api/papers — list user's papers (scoped to authenticated user)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);

  const localUser = await getOrCreateLocalUser(prisma, req);
  if (!localUser) throw new AppError('Could not resolve user', 401);

  const papers = await prisma.papers.findMany({
    where: { user_id: localUser.id },
    include: {
      evaluations: {
        select: {
          id: true,
          mode: true,
          draft_or_final: true,
          overall_score: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
      },
    },
    orderBy: { uploaded_at: 'desc' },
  });

  res.json(papers);
});

// GET /api/papers/:id — get single paper (must belong to authenticated user)
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const paperId = Number(req.params.id);
  const localUser = await getOrCreateLocalUser(prisma, req);
  if (!localUser) throw new AppError('Could not resolve user', 401);

  const paper = await prisma.papers.findFirst({
    where: { id: paperId, user_id: localUser.id },
    include: {
      evaluations: {
        select: {
          id: true,
          mode: true,
          draft_or_final: true,
          overall_score: true,
          created_at: true,
        },
      },
    },
  });

  if (!paper) {
    return res.status(404).json({ status: 'error', message: 'Paper not found' });
  }

  res.json(paper);
});

// GET /api/papers/:id/latest-eval — poll for completed evaluation (used by ProcessingPage)
router.get('/:id/latest-eval', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const paperId = Number(req.params.id);

  const evaluation = await prisma.evaluations.findFirst({
    where: { paper_id: paperId },
    orderBy: { created_at: 'desc' },
    select: { id: true, overall_score: true },
  });

  if (!evaluation) {
    return res.json({ id: 0, status: 'processing' });
  }

  const status = Number(evaluation.overall_score) > 0 ? 'complete' : 'processing';
  res.json({ id: evaluation.id, status });
});

// DELETE /api/papers/:id — permanently delete paper and ALL related data (POPIA compliant)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const paperId = Number(req.params.id);
  const localUser = await getOrCreateLocalUser(prisma, req);
  if (!localUser) throw new AppError('Could not resolve user', 401);

  const paper = await prisma.papers.findFirst({ where: { id: paperId, user_id: localUser.id } });
  if (!paper) {
    return res.status(404).json({ status: 'error', message: 'Paper not found' });
  }

  // Get all evaluation IDs for this paper
  const evaluations = await prisma.evaluations.findMany({
    where: { paper_id: paperId },
    select: { id: true },
  });
  const evalIds = evaluations.map(e => e.id);

  // Delete all related data in correct order (foreign keys)
  if (evalIds.length > 0) {
    await prisma.evaluation_issues.deleteMany({ where: { evaluation_id: { in: evalIds } } });
    await prisma.evaluation_strengths.deleteMany({ where: { evaluation_id: { in: evalIds } } });
    await prisma.reference_audit.deleteMany({ where: { evaluation_id: { in: evalIds } } });
    await prisma.consistency_checks.deleteMany({ where: { evaluation_id: { in: evalIds } } });
    await prisma.evaluations.deleteMany({ where: { paper_id: paperId } });
  }

  // Clear linked_paper_id references from other papers pointing to this one
  await prisma.papers.updateMany({
    where: { linked_paper_id: paperId },
    data: { linked_paper_id: null },
  });

  // Clear token references
  await prisma.tokens.updateMany({
    where: { draft_paper_id: paperId },
    data: { draft_paper_id: null },
  });
  await prisma.tokens.updateMany({
    where: { final_paper_id: paperId },
    data: { final_paper_id: null },
  });

  // Delete the paper itself
  await prisma.papers.delete({ where: { id: paperId } });

  res.json({ status: 'deleted', paper_id: paperId });
});

export default router;
