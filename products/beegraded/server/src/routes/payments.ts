import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// PayFast config from environment
const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || '';
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || '';
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || '';
const PAYFAST_URL = process.env.PAYFAST_URL || 'https://www.payfast.co.za/eng/process';
const BASE_URL = process.env.BASE_URL || 'https://beegraded.co.za';

// PayFast valid server IPs for ITN verification
const PAYFAST_VALID_IPS = [
  '197.97.145.144', '197.97.145.145', '197.97.145.146', '197.97.145.147',
  '197.97.145.148', '197.97.145.149', '197.97.145.150', '197.97.145.151',
  '197.97.145.152', '197.97.145.153', '197.97.145.154', '197.97.145.155',
  '197.97.145.156', '197.97.145.157', '197.97.145.158', '197.97.145.159',
  '41.74.179.192', '41.74.179.193', '41.74.179.194', '41.74.179.195',
  '41.74.179.196', '41.74.179.197', '41.74.179.198', '41.74.179.199',
  '41.74.179.200', '41.74.179.201', '41.74.179.202', '41.74.179.203',
  '41.74.179.204', '41.74.179.205', '41.74.179.206', '41.74.179.207',
  '41.74.179.208', '41.74.179.209', '41.74.179.210', '41.74.179.211',
  '41.74.179.212', '41.74.179.213', '41.74.179.214', '41.74.179.215',
  '41.74.179.216', '41.74.179.217', '41.74.179.218', '41.74.179.219',
  '41.74.179.220', '41.74.179.221', '41.74.179.222', '41.74.179.223',
];

/** Generate PayFast signature (MD5 of param string + passphrase) */
export function generatePayFastSignature(fields: Record<string, string>, passphrase: string): string {
  const paramString = Object.entries(fields)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim()).replace(/%20/g, '+')}`)
    .join('&');

  const toHash = passphrase ? `${paramString}&passphrase=${encodeURIComponent(passphrase.trim())}` : paramString;
  return crypto.createHash('md5').update(toHash).digest('hex');
}

/** Verify an incoming ITN signature from PayFast */
function verifyITNSignature(body: Record<string, string>, passphrase: string): boolean {
  const receivedSig = body.signature;
  if (!receivedSig) return false;

  // Rebuild param string from all fields except signature
  const paramString = Object.entries(body)
    .filter(([k]) => k !== 'signature')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v).trim()).replace(/%20/g, '+')}`)
    .join('&');

  const toHash = passphrase ? `${paramString}&passphrase=${encodeURIComponent(passphrase.trim())}` : paramString;
  const expected = crypto.createHash('md5').update(toHash).digest('hex');
  return expected === receivedSig;
}

/** Build PayFast form fields for a payment */
export function buildPayFastFields(opts: {
  paymentId: string;
  amount: string;
  email: string;
  name: string;
  itemName: string;
  itemDescription: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  customStr1?: string;
}): Record<string, string> {
  const fields: Record<string, string> = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: opts.returnUrl,
    cancel_url: opts.cancelUrl,
    notify_url: opts.notifyUrl,
    name_first: opts.name || 'Student',
    email_address: opts.email,
    m_payment_id: opts.paymentId,
    amount: opts.amount,
    item_name: opts.itemName,
    item_description: opts.itemDescription,
  };

  if (opts.customStr1) fields.custom_str1 = opts.customStr1;

  fields.signature = generatePayFastSignature(fields, PAYFAST_PASSPHRASE);
  return fields;
}

// POST /api/payments/initiate — Generate PayFast form for paper evaluation
router.post('/initiate', async (req: AuthRequest, res: Response) => {
  if (!PAYFAST_MERCHANT_ID) throw new AppError('PayFast not configured', 500);

  const prisma = getPrisma(req);
  const { paper_id, mode, email, name, token_code } = req.body;

  if (!paper_id || !email) throw new AppError('paper_id and email are required', 400);

  const paymentId = `BG-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;

  await prisma.payments.create({
    data: {
      paper_id: Number(paper_id),
      amount: 20,
      status: 'pending',
      provider: 'payfast',
      provider_ref: paymentId,
    },
  });

  const fields = buildPayFastFields({
    paymentId,
    amount: '20.00',
    email,
    name: name || 'Student',
    itemName: 'BeeGraded Paper Evaluation',
    itemDescription: `Mode ${mode || 'A'} evaluation`,
    returnUrl: `${BASE_URL}/#/workspace/processing/${paper_id}?mode=${mode || 'A'}&payment=success`,
    cancelUrl: `${BASE_URL}/#/cancel`,
    notifyUrl: `${BASE_URL}/api/payments/notify`,
  });

  res.json({ fields, payfast_url: PAYFAST_URL });
});

// POST /api/payments/notify — PayFast ITN callback
router.post('/notify', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const body = req.body as Record<string, string>;

  // 1. Verify source IP (trust x-forwarded-for from nginx)
  const sourceIp = (req.headers['x-forwarded-for'] as string || req.ip || '').split(',')[0].trim();
  if (process.env.NODE_ENV === 'production' && !PAYFAST_VALID_IPS.includes(sourceIp)) {
    console.warn(`PayFast ITN: rejected IP ${sourceIp}`);
    res.status(403).send('Forbidden');
    return;
  }

  // 2. Verify signature
  if (!verifyITNSignature(body, PAYFAST_PASSPHRASE)) {
    console.warn('PayFast ITN: signature mismatch');
    res.status(400).send('Invalid signature');
    return;
  }

  const { m_payment_id, payment_status, custom_str1 } = body;

  // 3. Update payment record
  if (m_payment_id && payment_status === 'COMPLETE') {
    await prisma.payments.updateMany({
      where: { provider_ref: m_payment_id },
      data: { status: 'complete' },
    });

    // 4. If this is a token purchase, activate the token
    if (custom_str1 && custom_str1.startsWith('BG-')) {
      await prisma.tokens.updateMany({
        where: { code: custom_str1, status: 'pending_payment' },
        data: { status: 'active' },
      });
    }
  }

  res.status(200).send('OK');
});

export default router;
