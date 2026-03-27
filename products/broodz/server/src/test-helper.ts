import express from 'express'
import cors from 'cors'
import type { Request, Response, NextFunction } from 'express'
import { errorHandler } from './middleware/errorHandler.js'
import type { AuthRequest } from './middleware/auth.js'

/**
 * Create a test Express app with mocked auth middleware and a mock Prisma client.
 */
export function createTestApp(mockPrisma: any) {
  const app = express()

  app.locals.prisma = mockPrisma

  app.use(cors())
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  return app
}

/**
 * Middleware that skips real auth and injects test user/talent IDs.
 */
export function mockAuth(userId = 1, talentId = 1) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    req.userId = userId
    req.talentId = talentId
    ;(req as any).authPayload = {
      sub: 'test-uuid',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      products: ['broodz'],
    }
    next()
  }
}

/**
 * Create a mock Prisma client with common portfolio item methods.
 */
export function createMockPrisma(overrides: any = {}) {
  return {
    portfolioItem: {
      aggregate: overrides.aggregate ?? (async () => ({ _max: { sortOrder: 0 } })),
      create: overrides.create ?? (async (args: any) => ({
        id: 99,
        talentId: args.data.talentId,
        type: args.data.type,
        url: args.data.url || '',
        thumbnailUrl: args.data.thumbnailUrl || null,
        title: args.data.title || null,
        description: null,
        sortOrder: args.data.sortOrder || 0,
        embedUrl: args.data.embedUrl || null,
        platform: args.data.platform || null,
        createdAt: new Date(),
      })),
      findFirst: overrides.findFirst ?? (async () => ({
        id: 1,
        talentId: 1,
        type: 'image',
        url: '/api/uploads/media/test.jpg',
        thumbnailUrl: null,
        title: 'Test',
        description: null,
        sortOrder: 0,
        embedUrl: null,
        platform: null,
      })),
      update: overrides.update ?? (async (args: any) => ({
        id: args.where.id,
        talentId: 1,
        type: 'image',
        url: '/api/uploads/media/test.jpg',
        thumbnailUrl: null,
        title: args.data.title ?? 'Test',
        description: args.data.description ?? null,
        sortOrder: args.data.sortOrder ?? 0,
        embedUrl: null,
        platform: null,
      })),
      delete: overrides.delete ?? (async () => ({})),
    },
    user: {
      findUnique: overrides.userFindUnique ?? (async () => ({ id: 1, email: 'test@example.com' })),
    },
    talent: {
      findFirst: overrides.talentFindFirst ?? (async () => ({ id: 1, userId: 1, name: 'Test' })),
    },
  }
}
