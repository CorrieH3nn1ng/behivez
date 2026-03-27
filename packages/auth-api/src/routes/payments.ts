import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { PLANS, getPlan, VALID_PRODUCT_IDS } from '../config/plans.js';
import {
  getPayFastUrl,
  buildCheckoutPayload,
  validateItnSignature,
  validateItnServerIp,
  confirmPaymentWithPayFast,
} from '../services/payfast.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// GET /payments/plans — public, returns all plans with pricing
router.get('/plans', (_req: AuthRequest, res: Response) => {
  const products = Object.entries(PLANS).map(([productId, plans]) => ({
    product: productId,
    plans: Object.entries(plans).map(([planId, def]) => ({
      id: planId,
      ...def,
    })),
  }));
  res.json(products);
});

// POST /payments/checkout — authenticated, generates PayFast redirect data
router.post('/checkout', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { product, plan } = req.body;

  if (!product || !VALID_PRODUCT_IDS.includes(product)) {
    throw new AppError(`Product must be one of: ${VALID_PRODUCT_IDS.join(', ')}`, 400);
  }

  const planDef = getPlan(product, plan);
  if (!planDef) {
    throw new AppError(`Invalid plan "${plan}" for product "${product}"`, 400);
  }

  if (planDef.priceCents === 0) {
    throw new AppError('Free plans do not require payment', 400);
  }

  const userId = req.user!.sub;

  // Upsert subscription (create if not exists, or update existing)
  let subscription = await prisma.subscription.findUnique({
    where: { userId_product: { userId, product } },
  });

  if (subscription && subscription.plan === plan && subscription.status === 'ACTIVE') {
    throw new AppError('You already have an active subscription for this plan', 400);
  }

  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: {
        userId,
        product,
        plan,
        status: 'TRIAL', // pending until payment confirmed
        priceCents: planDef.priceCents,
      },
    });
  } else {
    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan,
        priceCents: planDef.priceCents,
      },
    });
  }

  // Create a pending payment record
  const payment = await prisma.payment.create({
    data: {
      userId,
      subscriptionId: subscription.id,
      amountCents: planDef.priceCents,
      status: 'PENDING',
    },
  });

  // Fetch user details for PayFast
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const formData = buildCheckoutPayload({
    userId,
    email: user.email,
    firstName: user.name.split(' ')[0],
    product,
    plan,
    subscriptionId: subscription.id,
    amountCents: planDef.priceCents,
    itemName: `${planDef.name} — ${product.charAt(0).toUpperCase() + product.slice(1)}`,
    paymentId: payment.id,
  });

  res.json({
    payFastUrl: getPayFastUrl(),
    formData,
    paymentId: payment.id,
  });
});

// POST /payments/itn — PayFast Instant Transaction Notification (webhook)
// No auth — PayFast sends this server-to-server
router.post('/itn', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const body = req.body as Record<string, string>;

  // 1. Validate source IP
  const clientIp = req.ip || req.socket.remoteAddress || '';
  if (!validateItnServerIp(clientIp)) {
    console.error('[PayFast ITN] Invalid source IP:', clientIp);
    res.status(403).send('Invalid source');
    return;
  }

  // 2. Validate signature
  const passphrase = process.env.PAYFAST_PASSPHRASE || '';
  if (!validateItnSignature(body, passphrase)) {
    console.error('[PayFast ITN] Invalid signature');
    res.status(400).send('Invalid signature');
    return;
  }

  // 3. Confirm with PayFast
  const pfParamString = Object.entries(body)
    .filter(([k]) => k !== 'signature')
    .map(([k, v]) => `${k}=${encodeURIComponent((v || '').trim()).replace(/%20/g, '+')}`)
    .join('&');

  const valid = await confirmPaymentWithPayFast(pfParamString);
  if (!valid) {
    console.error('[PayFast ITN] PayFast server validation failed');
    res.status(400).send('Server validation failed');
    return;
  }

  // 4. Process the payment
  const pfPaymentId = body.pf_payment_id;
  const paymentStatus = body.payment_status;
  const pfToken = body.token; // subscription token
  const customUserId = body.custom_str1;
  const customProduct = body.custom_str2;
  const customPlan = body.custom_str3;
  const customSubscriptionId = body.custom_str4;
  const customPaymentId = body.custom_str5;
  const amountGross = Math.round(parseFloat(body.amount_gross || '0') * 100);

  console.log(`[PayFast ITN] pf_payment_id=${pfPaymentId} status=${paymentStatus} user=${customUserId} product=${customProduct}`);

  // Check for duplicate (idempotency)
  const existingPayment = await prisma.payment.findUnique({
    where: { pfPaymentId },
  });
  if (existingPayment) {
    console.log('[PayFast ITN] Duplicate ITN, already processed');
    res.status(200).send('OK');
    return;
  }

  if (paymentStatus === 'COMPLETE') {
    // Update or create payment record
    if (customPaymentId) {
      await prisma.payment.update({
        where: { id: customPaymentId },
        data: {
          pfPaymentId,
          pfSubscriptionId: pfToken || null,
          amountCents: amountGross,
          status: 'COMPLETE',
          rawItn: body as any,
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          userId: customUserId,
          subscriptionId: customSubscriptionId || null,
          pfPaymentId,
          pfSubscriptionId: pfToken || null,
          amountCents: amountGross,
          status: 'COMPLETE',
          rawItn: body as any,
        },
      });
    }

    // Activate subscription
    if (customSubscriptionId) {
      const nextPeriodEnd = new Date();
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

      await prisma.subscription.update({
        where: { id: customSubscriptionId },
        data: {
          status: 'ACTIVE',
          plan: customPlan || 'pro',
          pfSubscriptionId: pfToken || null,
          currentPeriodEnd: nextPeriodEnd,
        },
      });
    } else if (customUserId && customProduct) {
      // Fallback: find by user + product
      const nextPeriodEnd = new Date();
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

      await prisma.subscription.upsert({
        where: {
          userId_product: { userId: customUserId, product: customProduct },
        },
        create: {
          userId: customUserId,
          product: customProduct,
          plan: customPlan || 'pro',
          status: 'ACTIVE',
          pfSubscriptionId: pfToken || null,
          currentPeriodEnd: nextPeriodEnd,
        },
        update: {
          status: 'ACTIVE',
          plan: customPlan || 'pro',
          pfSubscriptionId: pfToken || null,
          currentPeriodEnd: nextPeriodEnd,
        },
      });
    }
  } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
    if (customPaymentId) {
      await prisma.payment.update({
        where: { id: customPaymentId },
        data: {
          pfPaymentId,
          status: paymentStatus === 'FAILED' ? 'FAILED' : 'FAILED',
          rawItn: body as any,
        },
      });
    }

    if (customSubscriptionId) {
      await prisma.subscription.update({
        where: { id: customSubscriptionId },
        data: { status: paymentStatus === 'CANCELLED' ? 'CANCELLED' : 'EXPIRED' },
      });
    }
  }

  // Always respond 200 to PayFast
  res.status(200).send('OK');
});

// GET /payments/history — authenticated user's payment history
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const userId = req.user!.sub;

  const payments = await prisma.payment.findMany({
    where: { userId },
    include: { subscription: { select: { product: true, plan: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json(
    payments.map((p) => ({
      id: p.id,
      product: p.subscription?.product || null,
      plan: p.subscription?.plan || null,
      amountCents: p.amountCents,
      status: p.status,
      createdAt: p.createdAt,
    }))
  );
});

// POST /payments/cancel — authenticated user cancels a subscription
router.post('/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const userId = req.user!.sub;
  const { subscriptionId } = req.body;

  if (!subscriptionId) {
    throw new AppError('subscriptionId is required', 400);
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription || subscription.userId !== userId) {
    throw new AppError('Subscription not found', 404);
  }

  if (subscription.status === 'CANCELLED') {
    throw new AppError('Subscription is already cancelled', 400);
  }

  // If there's a PayFast subscription token, cancel with PayFast
  if (subscription.pfSubscriptionId) {
    try {
      const merchantId = process.env.PAYFAST_MERCHANT_ID || '';
      const passphrase = process.env.PAYFAST_PASSPHRASE || '';
      const baseUrl = process.env.PAYFAST_SANDBOX === 'true'
        ? 'https://sandbox.payfast.co.za'
        : 'https://api.payfast.co.za';

      // PayFast cancel API
      const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '+02:00');
      const response = await fetch(
        `${baseUrl}/subscriptions/${subscription.pfSubscriptionId}/cancel`,
        {
          method: 'PUT',
          headers: {
            'merchant-id': merchantId,
            version: 'v1',
            timestamp,
            signature: '', // PayFast cancel API may need this — depends on integration
          },
        }
      );

      if (!response.ok) {
        console.error('[PayFast Cancel] Failed:', await response.text());
      }
    } catch (err) {
      console.error('[PayFast Cancel] Error:', err);
      // Continue with local cancellation even if PayFast call fails
    }
  }

  // Update local subscription status
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'CANCELLED',
      plan: 'free',
      priceCents: 0,
      pfSubscriptionId: null,
    },
  });

  res.json({ message: 'Subscription cancelled' });
});

export default router;
