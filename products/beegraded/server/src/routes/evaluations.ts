import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

async function getOrCreateLocalUser(prisma: PrismaClient, req: AuthRequest) {
  if (!req.userEmail) return null;
  let user = await prisma.users.findUnique({ where: { email: req.userEmail } });
  if (!user) {
    user = await prisma.users.create({ data: { email: req.userEmail, name: null } });
  }
  return user;
}

// POST /api/evaluations — trigger evaluation
// Frontend calls this → backend calls n8n for AI → saves results to DB
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { paper_id, mode = 'A', rubric_id } = req.body;

  if (!paper_id) throw new AppError('paper_id is required', 400);

  // Verify paper exists
  const paper = await prisma.papers.findUnique({
    where: { id: Number(paper_id) },
  });
  if (!paper) throw new AppError('Paper not found', 404);

  // Create pending evaluation record
  const evaluation = await prisma.evaluations.create({
    data: {
      paper_id: Number(paper_id),
      mode,
      draft_or_final: req.body.draft_or_final || 'draft',
      overall_score: 0,
    },
  });

  // Backend only creates the DB record — frontend triggers n8n directly
  res.status(201).json({
    evaluation_id: evaluation.id,
    status: 'processing',
  });
});

// POST /api/evaluations/:id/complete — callback from n8n with AI results
// n8n calls this after AI processing is done, with structured scores + details
router.post('/:id/complete', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const evalId = Number(req.params.id);
  const {
    overall_score, knowledge_score, critical_score,
    application_score, referencing_score, structure_score,
    ai_risk_score, report_html, issues, strengths, references, consistency,
  } = req.body;

  // Update evaluation scores
  await prisma.evaluations.update({
    where: { id: evalId },
    data: {
      overall_score: overall_score || 0,
      knowledge_score: knowledge_score || 0,
      critical_score: critical_score || 0,
      application_score: application_score || 0,
      referencing_score: referencing_score || 0,
      structure_score: structure_score || 0,
      ai_risk_score: ai_risk_score ?? null,
      report_html: report_html || null,
    },
  });

  // Insert issues
  if (issues?.length) {
    await prisma.evaluation_issues.createMany({
      data: issues.map((i: any) => ({
        evaluation_id: evalId,
        category: i.category || 'General',
        severity: i.severity || 'important',
        what_issue: i.what_issue || null,
        where_in_paper: i.where_in_paper || null,
        why_chain: i.why_chain || null,
        root_cause: i.root_cause || null,
        how_to_fix: i.how_to_fix || null,
        who_notices: i.who_notices || null,
        description: i.description || null,
        recommendation: i.recommendation || null,
        example_before: i.example_before || null,
        example_after: i.example_after || null,
        fixed_in_final: i.fixed_in_final ?? null,
      })),
    });
  }

  // Insert strengths
  if (strengths?.length) {
    await prisma.evaluation_strengths.createMany({
      data: strengths.map((s: any) => ({
        evaluation_id: evalId,
        category: s.category || 'General',
        what_well: s.what_well || '',
        where_in_paper: s.where_in_paper || null,
        why_chain: s.why_chain || null,
        reusable_pattern: s.reusable_pattern || null,
        how_it_helps: s.how_it_helps || null,
        who_notices: s.who_notices || null,
      })),
    });
  }

  // Insert references
  if (references?.length) {
    await prisma.reference_audit.createMany({
      data: references.map((r: any) => ({
        evaluation_id: evalId,
        citation: r.citation || '',
        source_type: r.source_type || 'in_text',
        matched: r.matched ?? false,
        issue_type: r.issue_type || null,
      })),
    });
  }

  // Insert consistency checks
  if (consistency?.length) {
    await prisma.consistency_checks.createMany({
      data: consistency.map((c: any) => ({
        evaluation_id: evalId,
        location_a: c.location_a || null,
        location_b: c.location_b || null,
        description: c.description || null,
        verdict: c.verdict || null,
        explanation: c.explanation || null,
        recommendation: c.recommendation || null,
      })),
    });
  }

  res.json({ status: 'complete', evaluation_id: evalId });
});

// GET /api/evaluations/:id — get full evaluation detail (structured JSON)
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const evalId = Number(req.params.id);

  const evaluation = await prisma.evaluations.findUnique({
    where: { id: evalId },
    include: {
      paper: true,
      issues: { orderBy: [{ severity: 'asc' }] },
      strengths: true,
      references: true,
      consistency: true,
    },
  });

  if (!evaluation) throw new AppError('Evaluation not found', 404);

  // Get rubric if linked via token
  let rubric = null;
  const token = await prisma.tokens.findFirst({
    where: {
      OR: [
        { draft_paper_id: evaluation.paper_id },
        { final_paper_id: evaluation.paper_id },
      ],
    },
  });
  if (token?.rubric_id) {
    rubric = await prisma.rubrics.findUnique({ where: { id: token.rubric_id } });
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
      created_at: evaluation.created_at,
      filename: evaluation.paper.filename,
      subject: evaluation.paper.subject,
      assessment_type: evaluation.paper.assessment_type,
      word_count: evaluation.paper.word_count,
      page_count: evaluation.paper.page_count,
      programme: rubric?.programme || null,
      module_name: rubric?.module_name || null,
      total_marks: rubric?.total_marks || null,
    },
    issues: evaluation.issues,
    strengths: evaluation.strengths,
    references: evaluation.references,
    consistency: evaluation.consistency,
  });
});

// GET /api/evaluations/:id/status — poll evaluation status
router.get('/:id/status', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const evalId = Number(req.params.id);

  const evaluation = await prisma.evaluations.findUnique({
    where: { id: evalId },
    select: { id: true, overall_score: true, created_at: true },
  });

  if (!evaluation) throw new AppError('Evaluation not found', 404);

  // If overall_score > 0, evaluation is complete
  const status = Number(evaluation.overall_score) > 0 ? 'complete' : 'processing';

  res.json({ id: evaluation.id, status });
});

// GET /api/evaluations — list user's evaluations (scoped to their papers)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);

  const localUser = await getOrCreateLocalUser(prisma, req);
  if (!localUser) throw new AppError('Could not resolve user', 401);

  const evaluations = await prisma.evaluations.findMany({
    where: { paper: { user_id: localUser.id } },
    include: { paper: { select: { filename: true, subject: true } } },
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  res.json(evaluations);
});

export default router;
