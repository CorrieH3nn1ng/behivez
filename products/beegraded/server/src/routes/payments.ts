import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

const PAYFAST_MERCHANT_ID = '10000100'; // sandbox
const PAYFAST_MERCHANT_KEY = '46f0cd694581a'; // sandbox
const PAYFAST_URL = 'https://sandbox.payfast.co.za/eng/process';

// POST /api/payments/initiate
router.post('/initiate', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { paper_id, mode, email, name, token_code } = req.body;

  if (!paper_id || !email) throw new AppError('paper_id and email are required', 400);

  const paymentId = `BG-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;

  // Create payment record
  const payment = await prisma.payments.create({
    data: {
      paper_id: Number(paper_id),
      amount: 20,
      status: 'pending',
      provider: 'payfast',
      provider_ref: paymentId,
    },
  });

  const baseUrl = 'https://beegraded.co.za';
  const fields: Record<string, string> = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: `${baseUrl}/workspace/processing/${paper_id}?mode=${mode || 'A'}&payment=success`,
    cancel_url: `${baseUrl}/workspace/cancel`,
    notify_url: `${baseUrl}/api/payments/notify`,
    name_first: name || 'Student',
    email_address: email,
    m_payment_id: paymentId,
    amount: '20.00',
    item_name: 'BeeGraded Paper Evaluation',
    item_description: `Mode ${mode || 'A'} evaluation`,
  };

  // Generate signature
  const paramString = Object.entries(fields)
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim())}`)
    .join('&');
  fields.signature = crypto.createHash('md5').update(paramString).digest('hex');

  res.json({ fields, payfast_url: PAYFAST_URL });
});

// POST /api/payments/notify — PayFast ITN callback
router.post('/notify', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { m_payment_id, payment_status } = req.body;

  if (m_payment_id && payment_status === 'COMPLETE') {
    await prisma.payments.updateMany({
      where: { provider_ref: m_payment_id },
      data: { status: 'complete' },
    });
  }

  res.status(200).send('OK');
});

export default router;
