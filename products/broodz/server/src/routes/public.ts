import { Router } from 'express'
import type { Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'

const router = Router()

function prisma(req: Request): PrismaClient {
  return req.app.locals.prisma
}

// Talent include for full profile
const talentInclude = {
  category: true,
  services: { orderBy: { sortOrder: 'asc' as const } },
  portfolio: { orderBy: { sortOrder: 'asc' as const } },
  products: { orderBy: { sortOrder: 'asc' as const } },
}

function formatTalent(t: any) {
  return {
    id: t.id,
    user_id: t.userId,
    slug: t.slug,
    name: t.name,
    tagline: t.tagline,
    bio: t.bio,
    category_id: t.categoryId,
    category_name: t.category?.name || null,
    category_slug: t.category?.slug || null,
    location: t.location,
    profile_image: t.profileImage,
    cover_image: t.coverImage,
    social_links: t.socialLinks || {},
    is_published: t.isPublished,
    is_beta: t.isBeta,
    theme: t.theme || 'earth',
    phone: t.phone,
    email: t.email,
    whatsapp: t.whatsapp,
    services: t.services?.map(formatService) || [],
    portfolio: t.portfolio?.map(formatPortfolioItem) || [],
    products: t.products?.map(formatProduct) || [],
  }
}

function formatService(s: any) {
  return {
    id: s.id,
    talent_id: s.talentId,
    name: s.name,
    description: s.description,
    price: s.price ? Number(s.price) : null,
    price_label: s.priceLabel,
    duration: s.duration,
    sort_order: s.sortOrder,
  }
}

function formatPortfolioItem(p: any) {
  return {
    id: p.id,
    talent_id: p.talentId,
    type: p.type,
    url: p.url,
    thumbnail_url: p.thumbnailUrl,
    title: p.title,
    description: p.description,
    sort_order: p.sortOrder,
    embed_url: p.embedUrl,
    platform: p.platform,
  }
}

function formatProduct(p: any) {
  return {
    id: p.id,
    talent_id: p.talentId,
    name: p.name,
    description: p.description,
    price: p.price ? Number(p.price) : null,
    price_label: p.priceLabel,
    image_url: p.imageUrl,
    in_stock: p.inStock,
    sort_order: p.sortOrder,
  }
}

// GET /bz-talent-by-slug?slug=maggie-senyatsi
router.get('/bz-talent-by-slug', async (req: Request, res: Response) => {
  const slug = req.query.slug as string
  if (!slug) { res.status(400).json({ error: 'slug required' }); return }

  const talent = await prisma(req).talent.findUnique({
    where: { slug, isPublished: true },
    include: talentInclude,
  })

  if (!talent) { res.status(404).json({ error: 'Talent not found' }); return }
  res.json(formatTalent(talent))
})

// GET /bz-talents-browse?category=landscaping&page=1
router.get('/bz-talents-browse', async (req: Request, res: Response) => {
  const categorySlug = req.query.category as string | undefined
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const perPage = 20

  const where: any = { isPublished: true }
  if (categorySlug) {
    const cat = await prisma(req).category.findUnique({ where: { slug: categorySlug } })
    if (cat) where.categoryId = cat.id
  }

  const [talents, total] = await Promise.all([
    prisma(req).talent.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma(req).talent.count({ where }),
  ])

  res.json({
    talents: talents.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      tagline: t.tagline,
      category_name: t.category?.name || null,
      category_slug: t.category?.slug || null,
      location: t.location,
      profile_image: t.profileImage,
      cover_image: t.coverImage,
    })),
    total,
    page,
    pages: Math.ceil(total / perPage),
  })
})

// GET /bz-categories-list
router.get('/bz-categories-list', async (req: Request, res: Response) => {
  const categories = await prisma(req).category.findMany({
    orderBy: { sortOrder: 'asc' },
  })
  res.json(categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
  })))
})

// POST /bz-enquiry-submit
router.post('/bz-enquiry-submit', async (req: Request, res: Response) => {
  const { talent_id, visitor_name, visitor_email, visitor_phone, message } = req.body
  if (!talent_id || !visitor_name || !visitor_email || !message) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  const enquiry = await prisma(req).enquiry.create({
    data: {
      talentId: talent_id,
      visitorName: visitor_name,
      visitorEmail: visitor_email,
      visitorPhone: visitor_phone || null,
      message,
    },
  })
  res.json({ id: enquiry.id, status: 'sent' })
})

// GET /bz-product-list?talent_id=123
router.get('/bz-product-list', async (req: Request, res: Response) => {
  const talentId = parseInt(req.query.talent_id as string)
  if (!talentId) { res.status(400).json({ error: 'talent_id required' }); return }

  const products = await prisma(req).product.findMany({
    where: { talentId },
    orderBy: { sortOrder: 'asc' },
  })
  res.json(products.map(formatProduct))
})

export { formatTalent, formatService, formatPortfolioItem, formatProduct, talentInclude }
export default router
