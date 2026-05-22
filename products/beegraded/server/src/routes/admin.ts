import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// GET /api/admin/stats — overview stats for admin dashboard
router.get('/stats', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);

  const [
    totalPapers,
    totalEvaluations,
    totalRubrics,
    totalUsers,
    totalChildren,
    totalMathAttempts,
    recentPapers,
    recentRubrics,
  ] = await Promise.all([
    prisma.papers.count(),
    prisma.evaluations.count(),
    prisma.rubrics.count(),
    prisma.users.count(),
    prisma.children.count(),
    prisma.math_test_attempts.count(),
    prisma.papers.findMany({
      orderBy: { uploaded_at: 'desc' },
      take: 5,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.rubrics.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
    }),
  ]);

  res.json({
    counts: {
      papers: totalPapers,
      evaluations: totalEvaluations,
      rubrics: totalRubrics,
      users: totalUsers,
      children: totalChildren,
      mathAttempts: totalMathAttempts,
    },
    recentPapers: recentPapers.map(p => ({
      id: p.id,
      filename: p.filename,
      subject: p.subject,
      uploaded_at: p.uploaded_at,
      user_email: p.user?.email || 'unknown',
      user_name: p.user?.name || 'unknown',
      draft_or_final: p.draft_or_final,
      word_count: p.word_count,
    })),
    recentRubrics: recentRubrics.map(r => ({
      id: r.id,
      original_filename: r.original_filename,
      module_name: r.module_name,
      programme: r.programme,
      total_marks: r.total_marks,
      confirmed: r.confirmed,
      created_at: r.created_at,
    })),
  });
});

// GET /api/admin/papers — all papers across all users
router.get('/papers', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const [papers, total] = await Promise.all([
    prisma.papers.findMany({
      orderBy: { uploaded_at: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { email: true, name: true } },
        evaluations: { select: { id: true, overall_score: true, mode: true, created_at: true } },
      },
    }),
    prisma.papers.count(),
  ]);

  res.json({
    papers: papers.map(p => ({
      id: p.id,
      filename: p.filename,
      subject: p.subject,
      assessment_type: p.assessment_type,
      draft_or_final: p.draft_or_final,
      word_count: p.word_count,
      page_count: p.page_count,
      uploaded_at: p.uploaded_at,
      user_id: p.user_id,
      user_email: p.user?.email || null,
      user_name: p.user?.name || null,
      evaluations: p.evaluations.map(e => ({
        id: e.id,
        overall_score: Number(e.overall_score),
        mode: e.mode,
        created_at: e.created_at,
      })),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// GET /api/admin/rubrics — all rubrics
router.get('/rubrics', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const [rubrics, total] = await Promise.all([
    prisma.rubrics.findMany({
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.rubrics.count(),
  ]);

  res.json({
    rubrics: rubrics.map(r => {
      const parsed = r.parsed_json as Record<string, unknown> || {};
      return {
        id: r.id,
        original_filename: r.original_filename,
        programme: r.programme || parsed.programme || '',
        module_name: r.module_name || parsed.module_name || '',
        assessment_type: r.assessment_type || parsed.assessment_type || '',
        total_marks: r.total_marks || parsed.total_marks || 0,
        confirmed: r.confirmed,
        created_at: r.created_at,
        question_count: Array.isArray(parsed.questions) ? parsed.questions.length : 0,
      };
    }),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// GET /api/admin/rubrics/:id — full rubric detail (including parsed_json)
router.get('/rubrics/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const rubric = await prisma.rubrics.findUnique({ where: { id: Number(req.params.id) } });
  if (!rubric) {
    res.status(404).json({ error: 'Rubric not found' });
    return;
  }

  const parsed = rubric.parsed_json as Record<string, unknown> || {};
  res.json({
    id: rubric.id,
    original_filename: rubric.original_filename,
    programme: parsed.programme || rubric.programme || '',
    module_name: parsed.module_name || rubric.module_name || '',
    nqf_level: parsed.nqf_level || rubric.nqf_level || null,
    assessment_type: parsed.assessment_type || rubric.assessment_type || '',
    total_marks: parsed.total_marks || rubric.total_marks || 0,
    questions: (parsed.questions as unknown[]) || [],
    structure_notes: (parsed.structure_notes as unknown[]) || [],
    grading_scale: (parsed.grading_scale as unknown[]) || [],
    confirmed: rubric.confirmed,
    created_at: rubric.created_at,
    raw_text: rubric.raw_text,
  });
});

// GET /api/admin/papers/:id — full paper detail with text + evaluations
router.get('/papers/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const paper = await prisma.papers.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      user: { select: { email: true, name: true } },
      evaluations: {
        orderBy: { created_at: 'desc' },
        select: { id: true, overall_score: true, mode: true, draft_or_final: true, created_at: true },
      },
    },
  });
  if (!paper) {
    res.status(404).json({ error: 'Paper not found' });
    return;
  }

  res.json({
    id: paper.id,
    filename: paper.filename,
    subject: paper.subject,
    assessment_type: paper.assessment_type,
    draft_or_final: paper.draft_or_final,
    word_count: paper.word_count,
    page_count: paper.page_count,
    uploaded_at: paper.uploaded_at,
    user_email: paper.user?.email || null,
    user_name: paper.user?.name || null,
    paper_text: paper.paper_text,
    evaluations: paper.evaluations.map(e => ({
      id: e.id,
      overall_score: Number(e.overall_score),
      mode: e.mode,
      draft_or_final: e.draft_or_final,
      created_at: e.created_at,
    })),
  });
});

// GET /api/admin/evaluations/:id — full evaluation detail with issues, strengths, references
router.get('/evaluations/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const evalId = Number(req.params.id);

  const evaluation = await prisma.evaluations.findUnique({
    where: { id: evalId },
    include: {
      paper: {
        include: { user: { select: { email: true, name: true } } },
      },
      issues: { orderBy: [{ severity: 'asc' }] },
      strengths: true,
      references: true,
      consistency: true,
    },
  });

  if (!evaluation) {
    res.status(404).json({ error: 'Evaluation not found' });
    return;
  }

  const num = (v: any) => v !== null && v !== undefined ? Number(v) : null;

  res.json({
    evaluation: {
      id: evaluation.id,
      paper_id: evaluation.paper_id,
      mode: evaluation.mode,
      draft_or_final: evaluation.draft_or_final,
      overall_score: num(evaluation.overall_score) ?? 0,
      knowledge_score: num(evaluation.knowledge_score) ?? 0,
      critical_score: num(evaluation.critical_score) ?? 0,
      application_score: num(evaluation.application_score) ?? 0,
      referencing_score: num(evaluation.referencing_score) ?? 0,
      structure_score: num(evaluation.structure_score) ?? 0,
      ai_risk_score: num(evaluation.ai_risk_score),
      report_html: evaluation.report_html,
      created_at: evaluation.created_at,
      filename: evaluation.paper.filename,
      subject: evaluation.paper.subject,
      assessment_type: evaluation.paper.assessment_type,
      word_count: evaluation.paper.word_count,
      page_count: evaluation.paper.page_count,
      user_email: evaluation.paper.user?.email || null,
      user_name: evaluation.paper.user?.name || null,
    },
    issues: evaluation.issues,
    strengths: evaluation.strengths,
    references: evaluation.references,
    consistency: evaluation.consistency,
  });
});

// GET /api/admin/evaluations — all evaluations across all users
router.get('/evaluations', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const [evaluations, total] = await Promise.all([
    prisma.evaluations.findMany({
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      include: {
        paper: {
          select: { filename: true, subject: true, user: { select: { email: true, name: true } } },
        },
      },
    }),
    prisma.evaluations.count(),
  ]);

  res.json({
    evaluations: evaluations.map(e => ({
      id: e.id,
      paper_id: e.paper_id,
      filename: e.paper.filename,
      subject: e.paper.subject,
      user_email: e.paper.user?.email || null,
      user_name: e.paper.user?.name || null,
      mode: e.mode,
      draft_or_final: e.draft_or_final,
      overall_score: Number(e.overall_score),
      knowledge_score: Number(e.knowledge_score),
      critical_score: Number(e.critical_score),
      application_score: Number(e.application_score),
      referencing_score: Number(e.referencing_score),
      structure_score: Number(e.structure_score),
      ai_risk_score: e.ai_risk_score ? Number(e.ai_risk_score) : null,
      created_at: e.created_at,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// GET /api/admin/users — all local beegraded users
router.get('/users', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);

  const users = await prisma.users.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      _count: { select: { papers: true, tokens: true } },
    },
  });

  res.json({
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      grade: u.grade,
      language: u.language,
      created_at: u.created_at,
      paper_count: u._count.papers,
      token_count: u._count.tokens,
    })),
  });
});

export default router;
