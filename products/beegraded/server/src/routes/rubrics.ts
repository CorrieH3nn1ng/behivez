import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// POST /api/rubrics — save already-parsed rubric JSON (AI parsing done by n8n)
router.post('/', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { token_code, original_filename, parsed_json } = req.body;

  if (!parsed_json) throw new AppError('parsed_json is required', 400);

  const parsed = typeof parsed_json === 'string' ? JSON.parse(parsed_json) : parsed_json;

  const rubric = await prisma.rubrics.create({
    data: {
      source: 'upload',
      original_filename: original_filename || null,
      raw_text: null,
      parsed_json: parsed,
      confirmed: false,
      programme: parsed.programme || null,
      module_name: parsed.module_name || null,
      nqf_level: parsed.nqf_level ? String(parsed.nqf_level) : null,
      assessment_type: parsed.assessment_type || null,
      total_marks: parsed.total_marks || null,
    },
  });

  // If token_code provided, link rubric to token
  if (token_code) {
    await prisma.tokens.updateMany({
      where: { code: token_code },
      data: { rubric_id: rubric.id },
    });
  }

  res.status(201).json({
    id: rubric.id,
    programme: parsed.programme || '',
    module_name: parsed.module_name || '',
    nqf_level: parsed.nqf_level || null,
    assessment_type: parsed.assessment_type || '',
    total_marks: parsed.total_marks || 0,
    questions: parsed.questions || [],
    confirmed: false,
    original_filename: original_filename || '',
    structure_notes: parsed.structure_notes || [],
    grading_scale: parsed.grading_scale || [],
  });
});

// POST /api/rubrics/confirm — mark rubric as confirmed
router.post('/confirm', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { rubric_id, token_code } = req.body;

  if (!rubric_id) throw new AppError('rubric_id is required', 400);

  await prisma.rubrics.update({
    where: { id: Number(rubric_id) },
    data: { confirmed: true },
  });

  // Update token status if provided
  if (token_code) {
    await prisma.tokens.updateMany({
      where: { code: token_code },
      data: { rubric_id: Number(rubric_id) },
    });
  }

  res.json({ success: true });
});

// GET /api/rubrics/:id — get rubric details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const rubricId = Number(req.params.id);

  const rubric = await prisma.rubrics.findUnique({ where: { id: rubricId } });
  if (!rubric) throw new AppError('Rubric not found', 404);

  const parsed = rubric.parsed_json as Record<string, unknown> || {};

  res.json({
    id: rubric.id,
    programme: parsed.programme || rubric.programme || '',
    module_name: parsed.module_name || rubric.module_name || '',
    nqf_level: parsed.nqf_level || null,
    assessment_type: parsed.assessment_type || rubric.assessment_type || '',
    total_marks: parsed.total_marks || rubric.total_marks || 0,
    questions: (parsed.questions as unknown[]) || [],
    confirmed: rubric.confirmed,
    original_filename: rubric.original_filename || '',
    structure_notes: (parsed.structure_notes as unknown[]) || [],
    grading_scale: (parsed.grading_scale as unknown[]) || [],
  });
});

export default router;
