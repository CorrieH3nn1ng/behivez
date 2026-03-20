import { Router } from 'express'
import type { Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { authenticate, resolveTalent, type AuthRequest } from '../middleware/auth.js'
import { formatTalent, talentInclude } from './public.js'

const router = Router()

// All routes require auth + talent resolution
router.use(authenticate, resolveTalent)

function prisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma
}

// GET /bz-talent-mine — fetch own profile with services, portfolio, products
router.get('/bz-talent-mine', async (req: AuthRequest, res: Response) => {
  const talent = await prisma(req).talent.findFirst({
    where: { id: req.talentId! },
    include: talentInclude,
  })

  if (!talent) { res.status(404).json({ error: 'Talent not found' }); return }
  res.json(formatTalent(talent))
})

// POST /bz-talent-update — update profile fields
router.post('/bz-talent-update', async (req: AuthRequest, res: Response) => {
  const {
    name, slug, tagline, bio, category_id, location,
    profile_image, cover_image, social_links, is_published,
    theme, phone, email, whatsapp,
  } = req.body

  const data: any = {}
  if (name !== undefined) data.name = name
  if (slug !== undefined) data.slug = slug
  if (tagline !== undefined) data.tagline = tagline
  if (bio !== undefined) data.bio = bio
  if (category_id !== undefined) data.categoryId = category_id
  if (location !== undefined) data.location = location
  if (profile_image !== undefined) data.profileImage = profile_image
  if (cover_image !== undefined) data.coverImage = cover_image
  if (social_links !== undefined) data.socialLinks = social_links
  if (is_published !== undefined) data.isPublished = is_published
  if (theme !== undefined) data.theme = theme
  if (phone !== undefined) data.phone = phone
  if (email !== undefined) data.email = email
  if (whatsapp !== undefined) data.whatsapp = whatsapp
  data.updatedAt = new Date()

  const talent = await prisma(req).talent.update({
    where: { id: req.talentId! },
    data,
    include: talentInclude,
  })
  res.json(formatTalent(talent))
})

// POST /bz-talent-publish — toggle publish status
router.post('/bz-talent-publish', async (req: AuthRequest, res: Response) => {
  const { is_published } = req.body

  const talent = await prisma(req).talent.update({
    where: { id: req.talentId! },
    data: { isPublished: !!is_published, updatedAt: new Date() },
  })
  res.json({ is_published: talent.isPublished })
})

// GET /bz-talent-slug-check?slug=my-slug
router.get('/bz-talent-slug-check', async (req: AuthRequest, res: Response) => {
  const slug = req.query.slug as string
  if (!slug) { res.json({ available: false }); return }

  const existing = await prisma(req).talent.findUnique({ where: { slug } })
  const available = !existing || existing.id === req.talentId!
  res.json({ available })
})

export default router
