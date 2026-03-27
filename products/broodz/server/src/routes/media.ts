import { Router } from 'express'
import type { Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuid } from 'uuid'
import ffmpeg from 'fluent-ffmpeg'
import { authenticate, resolveTalent, type AuthRequest } from '../middleware/auth.js'
import { formatPortfolioItem } from './public.js'

type MulterRequest = AuthRequest & { file?: Express.Multer.File }

const router = Router()
router.use(authenticate, resolveTalent)

function prisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma
}

// Storage paths
const storagePath = process.env.STORAGE_PATH || './uploads'
const mediaDir = path.join(storagePath, 'media')
const thumbDir = path.join(storagePath, 'media', 'thumbnails')

// Ensure directories exist
fs.mkdirSync(mediaDir, { recursive: true })
fs.mkdirSync(thumbDir, { recursive: true })

// Multer for media uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, mediaDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuid()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB (for video)
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image and video files allowed'))
    }
  },
})

/**
 * Generate a thumbnail from a video file using ffmpeg.
 * Returns the thumbnail filename or null if generation fails.
 */
function generateVideoThumbnail(videoPath: string, thumbFilename: string): Promise<string | null> {
  return new Promise((resolve) => {
    const outputPath = path.join(thumbDir, thumbFilename)

    ffmpeg(videoPath)
      .on('end', () => resolve(thumbFilename))
      .on('error', (err) => {
        console.warn('Thumbnail generation failed:', err.message)
        resolve(null)
      })
      .screenshots({
        count: 1,
        timemarks: ['00:00:01'],
        folder: thumbDir,
        filename: thumbFilename,
        size: '480x?',
      })
  })
}

/**
 * Get video duration in seconds using ffprobe.
 */
function getVideoDuration(videoPath: string): Promise<number | null> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err || !metadata?.format?.duration) {
        resolve(null)
        return
      }
      resolve(Math.round(metadata.format.duration))
    })
  })
}

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

  const isVideo = req.file.mimetype.startsWith('video')
  const fileType = req.body.type || (isVideo ? 'video' : 'image')
  const fileUrl = `/api/uploads/media/${req.file.filename}`
  let thumbnailUrl: string | null = fileType === 'image' ? fileUrl : null
  let duration: number | null = null

  // Generate thumbnail for videos
  if (isVideo) {
    const thumbFilename = `thumb_${path.parse(req.file.filename).name}.png`
    const thumbResult = await generateVideoThumbnail(req.file.path, thumbFilename)
    if (thumbResult) {
      thumbnailUrl = `/api/uploads/media/thumbnails/${thumbResult}`
    }
    duration = await getVideoDuration(req.file.path)
  }

  const item = await prisma(req).portfolioItem.create({
    data: {
      talentId: req.talentId!,
      type: fileType,
      url: fileUrl,
      thumbnailUrl,
      title: title || null,
      sortOrder: nextSort,
    },
  })

  // Return with duration metadata for videos
  const formatted = formatPortfolioItem(item)
  if (duration) {
    ;(formatted as any).duration = duration
  }
  res.json(formatted)
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

  // Clean up files from disk
  if (existing.url && !existing.url.startsWith('http')) {
    const filePath = path.join(storagePath, existing.url.replace('/api/uploads/', ''))
    fs.unlink(filePath, () => {}) // best-effort cleanup
  }
  if (existing.thumbnailUrl && existing.thumbnailUrl.includes('thumbnails/')) {
    const thumbPath = path.join(storagePath, existing.thumbnailUrl.replace('/api/uploads/', ''))
    fs.unlink(thumbPath, () => {})
  }

  await prisma(req).portfolioItem.delete({ where: { id } })
  res.json({ deleted: true })
})

// POST /bz-media-reorder — batch reorder
router.post('/bz-media-reorder', async (req: AuthRequest, res: Response) => {
  const { id, sort_order, items: reorderItems } = req.body

  // Batch reorder: [{ id, sort_order }, ...]
  if (Array.isArray(reorderItems)) {
    const updates = reorderItems.map((item: { id: number; sort_order: number }) =>
      prisma(req).portfolioItem.update({
        where: { id: item.id },
        data: { sortOrder: item.sort_order },
      })
    )
    await Promise.all(updates)
    res.json({ reordered: true })
    return
  }

  // Single item reorder (legacy)
  if (!id || sort_order === undefined) { res.status(400).json({ error: 'id and sort_order required' }); return }

  await prisma(req).portfolioItem.update({
    where: { id },
    data: { sortOrder: sort_order },
  })
  res.json({ reordered: true })
})

export default router
