import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// GET /api/papers — list user's papers
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);

  // TODO: map auth UUID to local user_id once user linking is in place
  const papers = await prisma.papers.findMany({
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

// GET /api/papers/:id — get single paper
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const paperId = Number(req.params.id);

  const paper = await prisma.papers.findFirst({
    where: { id: paperId },
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

  const paper = await prisma.papers.findUnique({ where: { id: paperId } });
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
