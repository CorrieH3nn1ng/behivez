import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// GET /api/tokens/validate?code=XXX — validate a token code
router.get('/validate', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const code = req.query.code as string;
  if (!code) throw new AppError('code is required', 400);

  const token = await prisma.tokens.findUnique({ where: { code } });
  if (!token) throw new AppError('Token not found', 404);

  // Get rubric if linked
  let rubric = null;
  if (token.rubric_id) {
    const r = await prisma.rubrics.findUnique({ where: { id: token.rubric_id } });
    if (r) {
      const parsed = r.parsed_json as Record<string, unknown> || {};
      rubric = {
        id: r.id,
        programme: parsed.programme || r.programme || '',
        module_name: parsed.module_name || r.module_name || '',
        nqf_level: parsed.nqf_level || null,
        assessment_type: parsed.assessment_type || r.assessment_type || '',
        total_marks: parsed.total_marks || r.total_marks || 0,
        questions: (parsed.questions as unknown[]) || [],
        confirmed: r.confirmed,
        original_filename: r.original_filename || '',
        structure_notes: (parsed.structure_notes as unknown[]) || [],
        grading_scale: (parsed.grading_scale as unknown[]) || [],
      };
    }
  }

  res.json({
    id: token.id,
    code: token.code,
    email: token.email || '',
    status: token.status,
    tier: token.tier,
    rubric_id: token.rubric_id,
    draft_paper_id: token.draft_paper_id,
    draft_evaluation_id: token.draft_evaluation_id,
    final_paper_id: token.final_paper_id,
    final_evaluation_id: token.final_evaluation_id,
    expires_at: token.expires_at?.toISOString() || '',
    rubric,
  });
});

// GET /api/tokens/user — list user's tokens
router.get('/user', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const email = req.query.email as string || req.userEmail;

  const tokens = await prisma.tokens.findMany({
    where: email ? { email } : {},
    orderBy: { created_at: 'desc' },
  });

  res.json(tokens);
});

// POST /api/tokens/purchase — create a new token
router.post('/purchase', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { email, coupon_code } = req.body;

  if (!email) throw new AppError('email is required', 400);

  // Check coupon
  let discount = 0;
  if (coupon_code) {
    const coupon = await prisma.coupons.findUnique({ where: { code: coupon_code } });
    if (coupon && coupon.active && (!coupon.max_uses || coupon.current_uses < coupon.max_uses)) {
      discount = coupon.discount_pct;
      await prisma.coupons.update({
        where: { id: coupon.id },
        data: { current_uses: { increment: 1 } },
      });
    }
  }

  const code = 'BG-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const token = await prisma.tokens.create({
    data: {
      code,
      email: email.toLowerCase(),
      status: 'active',
      tier: 'token',
      price_paid: discount === 100 ? 0 : 25,
      coupon_code: coupon_code || null,
      expires_at: expiresAt,
    },
  });

  if (discount === 100) {
    res.json({ token_code: code, free: true });
  } else {
    // Return token code — payment handled separately via PayFast
    res.json({ token_code: code, free: false });
  }
});

export default router;
