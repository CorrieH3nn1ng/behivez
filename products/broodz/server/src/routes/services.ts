import { Router } from 'express'
import type { Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { authenticate, resolveTalent, type AuthRequest } from '../middleware/auth.js'
import { formatService } from './public.js'

const router = Router()
router.use(authenticate, resolveTalent)

function prisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma
}

// POST /bz-service-create
router.post('/bz-service-create', async (req: AuthRequest, res: Response) => {
  const { name, description, price, price_label, duration } = req.body
  if (!name) { res.status(400).json({ error: 'name required' }); return }

  const maxSort = await prisma(req).service.aggregate({
    where: { talentId: req.talentId! },
    _max: { sortOrder: true },
  })

  const service = await prisma(req).service.create({
    data: {
      talentId: req.talentId!,
      name,
      description: description || null,
      price: price != null ? price : null,
      priceLabel: price_label || null,
      duration: duration || null,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  })
  res.json(formatService(service))
})

// POST /bz-service-update
router.post('/bz-service-update', async (req: AuthRequest, res: Response) => {
  const { id, name, description, price, price_label, duration } = req.body
  if (!id) { res.status(400).json({ error: 'id required' }); return }

  // Verify ownership
  const existing = await prisma(req).service.findFirst({
    where: { id, talentId: req.talentId! },
  })
  if (!existing) { res.status(404).json({ error: 'Service not found' }); return }

  const service = await prisma(req).service.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price }),
      ...(price_label !== undefined && { priceLabel: price_label }),
      ...(duration !== undefined && { duration }),
      updatedAt: new Date(),
    },
  })
  res.json(formatService(service))
})

// POST /bz-service-delete
router.post('/bz-service-delete', async (req: AuthRequest, res: Response) => {
  const { id } = req.body
  if (!id) { res.status(400).json({ error: 'id required' }); return }

  const existing = await prisma(req).service.findFirst({
    where: { id, talentId: req.talentId! },
  })
  if (!existing) { res.status(404).json({ error: 'Service not found' }); return }

  await prisma(req).service.delete({ where: { id } })
  res.json({ deleted: true })
})

// POST /bz-service-reorder
router.post('/bz-service-reorder', async (req: AuthRequest, res: Response) => {
  const { id, sort_order } = req.body
  if (!id || sort_order === undefined) { res.status(400).json({ error: 'id and sort_order required' }); return }

  await prisma(req).service.update({
    where: { id },
    data: { sortOrder: sort_order },
  })
  res.json({ reordered: true })
})

export default router
