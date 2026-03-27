import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'
import { errorHandler } from './middleware/errorHandler.js'
import publicRoutes from './routes/public.js'
import talentRoutes from './routes/talent.js'
import serviceRoutes from './routes/services.js'
import mediaRoutes from './routes/media.js'
import productRoutes from './routes/products.js'
import enquiryRoutes from './routes/enquiries.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const prisma = new PrismaClient()

// Make Prisma available to all routes
app.locals.prisma = prisma

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve uploaded files
const uploadsPath = process.env.STORAGE_PATH || path.join(__dirname, '..', 'uploads')
app.use('/uploads', express.static(uploadsPath))

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'broodz-api', timestamp: new Date().toISOString() })
})

// All routes use the same /bz-* prefix pattern the frontend expects.
// Public routes (no auth)
app.use('/', publicRoutes)

// Authenticated routes
app.use('/', talentRoutes)
app.use('/', serviceRoutes)
app.use('/', mediaRoutes)
app.use('/', productRoutes)
app.use('/', enquiryRoutes)

// Error handler (must be last)
app.use(errorHandler)

// Start
const PORT = parseInt(process.env.PORT || '3200')

app.listen(PORT, () => {
  console.log(`Broodz API listening on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...')
  await prisma.$disconnect()
  process.exit(0)
})
