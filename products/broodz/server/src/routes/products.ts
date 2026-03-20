import { Router } from 'express'
import type { Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'path'
import { v4 as uuid } from 'uuid'
import { authenticate, resolveTalent, type AuthRequest } from '../middleware/auth.js'
import { formatProduct } from './public.js'

type MulterRequest = AuthRequest & { file?: Express.Multer.File }

const router = Router()
router.use(authenticate, resolveTalent)

function prisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma
}

// Multer for product images
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.env.STORAGE_PATH || './uploads', 'products'))
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuid()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files allowed'))
  },
})

// POST /bz-product-upsert — create or update product
router.post('/bz-product-upsert', async (req: AuthRequest, res: Response) => {
  const { id, name, description, price, price_label, image_url, in_stock } = req.body
  if (!name) { res.status(400).json({ error: 'name required' }); return }

  if (id) {
    // Update
    const existing = await prisma(req).product.findFirst({
      where: { id, talentId: req.talentId! },
    })
    if (!existing) { res.status(404).json({ error: 'Product not found' }); return }

    const product = await prisma(req).product.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: price != null ? price : null,
        priceLabel: price_label || null,
        imageUrl: image_url || null,
        inStock: in_stock !== undefined ? in_stock : true,
        updatedAt: new Date(),
      },
    })
    res.json(formatProduct(product))
  } else {
    // Create
    const maxSort = await prisma(req).product.aggregate({
      where: { talentId: req.talentId! },
      _max: { sortOrder: true },
    })

    const product = await prisma(req).product.create({
      data: {
        talentId: req.talentId!,
        name,
        description: description || null,
        price: price != null ? price : null,
        priceLabel: price_label || null,
        imageUrl: image_url || null,
        inStock: in_stock !== undefined ? in_stock : true,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    })
    res.json(formatProduct(product))
  }
})

// POST /bz-product-delete
router.post('/bz-product-delete', async (req: AuthRequest, res: Response) => {
  const { id } = req.body
  if (!id) { res.status(400).json({ error: 'id required' }); return }

  const existing = await prisma(req).product.findFirst({
    where: { id, talentId: req.talentId! },
  })
  if (!existing) { res.status(404).json({ error: 'Product not found' }); return }

  await prisma(req).product.delete({ where: { id } })
  res.json({ deleted: true })
})

// POST /bz-product-reorder
router.post('/bz-product-reorder', async (req: AuthRequest, res: Response) => {
  const { id, sort_order } = req.body
  if (!id || sort_order === undefined) { res.status(400).json({ error: 'id and sort_order required' }); return }

  await prisma(req).product.update({
    where: { id },
    data: { sortOrder: sort_order },
  })
  res.json({ reordered: true })
})

// POST /bz-product-image — upload product image
router.post('/bz-product-image', upload.single('file'), async (req: MulterRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return }
  const url = `/api/uploads/products/${req.file.filename}`
  res.json({ url })
})

// POST /bz-profile-image — upload profile photo
router.post('/bz-profile-image', upload.single('file'), async (req: MulterRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return }
  const url = `/api/uploads/products/${req.file.filename}`
  res.json({ url })
})

// POST /bz-cover-image — upload cover image
router.post('/bz-cover-image', upload.single('file'), async (req: MulterRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return }
  const url = `/api/uploads/products/${req.file.filename}`
  res.json({ url })
})

export default router
