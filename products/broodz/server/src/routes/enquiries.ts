import { Router } from 'express'
import type { Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { authenticate, resolveTalent, type AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(authenticate, resolveTalent)

function prisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma
}

// GET /bz-enquiry-list — list my enquiries
router.get('/bz-enquiry-list', async (req: AuthRequest, res: Response) => {
  const enquiries = await prisma(req).enquiry.findMany({
    where: { talentId: req.talentId! },
    orderBy: { createdAt: 'desc' },
  })
  res.json(enquiries.map((e) => ({
    id: e.id,
    talent_id: e.talentId,
    visitor_name: e.visitorName,
    visitor_email: e.visitorEmail,
    visitor_phone: e.visitorPhone,
    message: e.message,
    status: e.status,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  })))
})

// POST /bz-enquiry-status — update enquiry status
router.post('/bz-enquiry-status', async (req: AuthRequest, res: Response) => {
  const { id, status } = req.body
  if (!id || !status) { res.status(400).json({ error: 'id and status required' }); return }

  const valid = ['new', 'read', 'replied', 'archived']
  if (!valid.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` })
    return
  }

  const existing = await prisma(req).enquiry.findFirst({
    where: { id, talentId: req.talentId! },
  })
  if (!existing) { res.status(404).json({ error: 'Enquiry not found' }); return }

  const enquiry = await prisma(req).enquiry.update({
    where: { id },
    data: { status, updatedAt: new Date() },
  })
  res.json({ id: enquiry.id, status: enquiry.status })
})

export default router
