import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// GET /api/coupons/validate?code=XXX
router.get('/validate', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const code = req.query.code as string;
  if (!code) throw new AppError('code is required', 400);

  const coupon = await prisma.coupons.findUnique({ where: { code } });

  if (!coupon || !coupon.active) {
    return res.json({ valid: false, message: 'Invalid or expired coupon' });
  }

  if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
    return res.json({ valid: false, message: 'Coupon has reached its usage limit' });
  }

  res.json({
    valid: true,
    discount_percent: coupon.discount_pct,
    affiliate_name: coupon.affiliate_email?.split('@')[0] || 'Affiliate',
  });
});

export default router;
