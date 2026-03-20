import { Router } from 'express'
import type { Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'path'
import { v4 as uuid } from 'uuid'
import { authenticate, resolveTalent, type AuthRequest } from '../middleware/auth.js'
import { formatPortfolioItem } from './public.js'

type MulterRequest = AuthRequest & { file?: Express.Multer.File }

const router = Router()
router.use(authenticate, resolveTalent)

function prisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma
}

// Multer for media uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.env.STORAGE_PATH || './uploads', 'media'))
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuid()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image and video files allowed'))
    }
  },
})

// POST /bz-media-upload — upload file or add social embed
router.post('/bz-media-upload', upload.single('file'), async (req: MulterRequest, res: Response) => {
  const { type, url, embed_url, platform, title } = req.body

  const maxSort = await prisma(req).portfolioItem.aggregate({
    where: { talentId: req.talentId! },
    _max: { sortOrder: true },
  })
  const nextSort = (maxSort._max.sortOrder ?? -1) + 1

  // Social embed (no file)
  if (type === 'embed') {
    const item = await prisma(req).portfolioItem.create({
      data: {
        talentId: req.talentId!,
        type: 'embed',
        url: url || embed_url || '',
        embedUrl: embed_url || null,
        platform: platform || null,
        title: title || null,
        sortOrder: nextSort,
      },
    })
    res.json(formatPortfolioItem(item))
    return
  }

  // File upload
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  const fileType = req.body.type || (req.file.mimetype.startsWith('video') ? 'video' : 'image')
  const fileUrl = `/api/uploads/media/${req.file.filename}`

  const item = await prisma(req).portfolioItem.create({
    data: {
      talentId: req.talentId!,
      type: fileType,
      url: fileUrl,
      thumbnailUrl: fileType === 'image' ? fileUrl : null,
      sortOrder: nextSort,
    },
  })
  res.json(formatPortfolioItem(item))
})

// POST /bz-media-update — edit title/description
router.post('/bz-media-update', async (req: AuthRequest, res: Response) => {
  const { id, title, description } = req.body
  if (!id) { res.status(400).json({ error: 'id required' }); return }

  const existing = await prisma(req).portfolioItem.findFirst({
    where: { id, talentId: req.talentId! },
  })
  if (!existing) { res.status(404).json({ error: 'Item not found' }); return }

  const item = await prisma(req).portfolioItem.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
    },
  })
  res.json(formatPortfolioItem(item))
})

// POST /bz-media-delete
router.post('/bz-media-delete', async (req: AuthRequest, res: Response) => {
  const { id } = req.body
  if (!id) { res.status(400).json({ error: 'id required' }); return }

  const existing = await prisma(req).portfolioItem.findFirst({
    where: { id, talentId: req.talentId! },
  })
  if (!existing) { res.status(404).json({ error: 'Item not found' }); return }

  await prisma(req).portfolioItem.delete({ where: { id } })
  res.json({ deleted: true })
})

// POST /bz-media-reorder
router.post('/bz-media-reorder', async (req: AuthRequest, res: Response) => {
  const { id, sort_order } = req.body
  if (!id || sort_order === undefined) { res.status(400).json({ error: 'id and sort_order required' }); return }

  await prisma(req).portfolioItem.update({
    where: { id },
    data: { sortOrder: sort_order },
  })
  res.json({ reordered: true })
})

export default router
