import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { optionalAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// GET /api/comparisons/:draftId/:finalId — compare draft vs final evaluation
router.get('/:draftId/:finalId', optionalAuth, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const draftId = Number(req.params.draftId);
  const finalId = Number(req.params.finalId);

  const [draft, final_] = await Promise.all([
    prisma.evaluations.findUnique({
      where: { id: draftId },
      include: { paper: true, issues: true, strengths: true, references: true },
    }),
    prisma.evaluations.findUnique({
      where: { id: finalId },
      include: { paper: true, issues: true, strengths: true, references: true },
    }),
  ]);

  if (!draft) throw new AppError('Draft evaluation not found', 404);
  if (!final_) throw new AppError('Final evaluation not found', 404);

  const num = (v: any) => v !== null && v !== undefined ? Number(v) : 0;

  const draftScore = num(draft.overall_score);
  const finalScore = num(final_.overall_score);

  // Build criteria comparison
  const criteria = [
    { key: 'knowledge', label: 'Knowledge & Understanding', draft: num(draft.knowledge_score), final: num(final_.knowledge_score) },
    { key: 'critical', label: 'Critical Thinking', draft: num(draft.critical_score), final: num(final_.critical_score) },
    { key: 'application', label: 'Application', draft: num(draft.application_score), final: num(final_.application_score) },
    { key: 'referencing', label: 'Referencing', draft: num(draft.referencing_score), final: num(final_.referencing_score) },
    { key: 'structure', label: 'Structure & Flow', draft: num(draft.structure_score), final: num(final_.structure_score) },
  ];

  if (draft.ai_risk_score !== null || final_.ai_risk_score !== null) {
    criteria.push({
      key: 'ai_risk',
      label: 'AI Risk',
      draft: num(draft.ai_risk_score),
      final: num(final_.ai_risk_score),
    });
  }

  // Compare issues by CATEGORY (not exact text — AI generates different descriptions each run)
  // Count issues per category for draft and final
  const draftByCategory: Record<string, number> = {};
  const finalByCategory: Record<string, number> = {};

  for (const i of draft.issues) {
    const cat = (i.category || 'General').toLowerCase();
    draftByCategory[cat] = (draftByCategory[cat] || 0) + 1;
  }
  for (const i of final_.issues) {
    const cat = (i.category || 'General').toLowerCase();
    finalByCategory[cat] = (finalByCategory[cat] || 0) + 1;
  }

  const allCategories = new Set([...Object.keys(draftByCategory), ...Object.keys(finalByCategory)]);
  let issuesFixed = 0;
  let issuesRemaining = 0;
  let newIssues = 0;

  for (const cat of allCategories) {
    const draftCount = draftByCategory[cat] || 0;
    const finalCount = finalByCategory[cat] || 0;

    if (draftCount > 0 && finalCount === 0) {
      // Category had issues in draft, none in final — all fixed
      issuesFixed += draftCount;
    } else if (draftCount > 0 && finalCount > 0) {
      // Category has issues in both — some remaining, some may be fixed
      const remaining = Math.min(draftCount, finalCount);
      const fixed = Math.max(0, draftCount - finalCount);
      issuesRemaining += remaining;
      issuesFixed += fixed;
      if (finalCount > draftCount) {
        newIssues += finalCount - draftCount;
      }
    } else if (draftCount === 0 && finalCount > 0) {
      // New category of issues in final
      newIssues += finalCount;
    }
  }

  // Monkey detection: if score jumped massively but issues barely changed
  const scoreJump = finalScore - draftScore;
  const monkeyFlag = scoreJump > 25 && final_.issues.length <= 2 && draft.issues.length > 5;

  res.json({
    draftScore,
    finalScore,
    improvement: finalScore - draftScore,
    issuesFixed,
    issuesRemaining,
    newIssues,
    draftIssueCount: draft.issues.length,
    finalIssueCount: final_.issues.length,
    monkeyFlag,
    comparisonHtml: '',
    criteria,
    draftStrengths: draft.strengths.length,
    finalStrengths: final_.strengths.length,
  });
});

export default router;
