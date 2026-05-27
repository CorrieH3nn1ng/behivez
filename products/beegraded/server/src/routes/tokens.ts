import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { buildPayFastFields } from './payments.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

const PAYFAST_URL = process.env.PAYFAST_URL || 'https://www.payfast.co.za/eng/process';
const BASE_URL = process.env.BASE_URL || 'https://beegraded.co.za';
const TOKEN_PRICE = 25;

// GET /api/tokens/validate?code=XXX — validate a token code
router.get('/validate', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const code = req.query.code as string;
  if (!code) throw new AppError('code is required', 400);

  const token = await prisma.tokens.findUnique({ where: { code } });
  if (!token) throw new AppError('Token not found', 404);

  // Reject tokens still awaiting payment
  if (token.status === 'pending_payment') {
    throw new AppError('Token payment not yet confirmed', 402);
  }

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

// POST /api/tokens/purchase — create a new token (free or PayFast)
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

  const finalPrice = discount === 100 ? 0 : Math.round(TOKEN_PRICE * (1 - discount / 100));
  const isFree = finalPrice === 0;

  const token = await prisma.tokens.create({
    data: {
      code,
      email: email.toLowerCase(),
      status: isFree ? 'active' : 'pending_payment',
      tier: 'token',
      price_paid: finalPrice,
      coupon_code: coupon_code || null,
      expires_at: expiresAt,
    },
  });

  if (isFree) {
    res.json({ token_code: code, free: true });
    return;
  }

  // Generate PayFast form for paid purchase
  const paymentId = `BG-TK-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;

  const payment = await prisma.payments.create({
    data: {
      paper_id: null,
      amount: finalPrice,
      status: 'pending',
      provider: 'payfast',
      provider_ref: paymentId,
    },
  });

  await prisma.tokens.update({
    where: { id: token.id },
    data: { payment_id: payment.id },
  });

  const fields = buildPayFastFields({
    paymentId,
    amount: `${finalPrice}.00`,
    itemName: 'BeeGraded Evaluation Token',
    returnUrl: `${BASE_URL}/#/thank-you?token_code=${code}&m_payment_id=${paymentId}`,
    cancelUrl: `${BASE_URL}/#/cancel`,
    notifyUrl: `${BASE_URL}/api/payments/notify`,
  });

  res.json({
    token_code: code,
    free: false,
    fields,
    payfast_url: PAYFAST_URL,
  });
});

export default router;
