import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

// Mock the auth middleware BEFORE importing media routes
vi.mock('../middleware/auth.js', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 1
    ;(req as any).authPayload = {
      sub: 'test-uuid',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      products: ['broodz'],
    }
    next()
  },
  resolveTalent: (req: any, _res: any, next: any) => {
    req.userId = 1
    req.talentId = 1
    next()
  },
}))

// Mock fluent-ffmpeg to avoid needing ffmpeg binary
vi.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = () => ({
    on: function (event: string, cb: Function) {
      if (event === 'error') (this as any)._errorCb = cb
      if (event === 'end') (this as any)._endCb = cb
      return this
    },
    screenshots: function () {
      if ((this as any)._endCb) setTimeout(() => (this as any)._endCb(), 10)
      return this
    },
  })
  mockFfmpeg.ffprobe = (_path: string, cb: Function) => {
    cb(null, { format: { duration: 15.5 } })
  }
  return { default: mockFfmpeg }
})

// Mock fs to avoid creating real directories
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs')
  return {
    ...actual,
    default: {
      ...actual,
      mkdirSync: vi.fn(),
      unlink: vi.fn((_path: string, cb: Function) => cb()),
    },
    mkdirSync: vi.fn(),
    unlink: vi.fn((_path: string, cb: Function) => cb()),
  }
})

import mediaRoutes from './media.js'
import { formatPortfolioItem } from './public.js'
import { createMockPrisma } from '../test-helper.js'

describe('Media Routes', () => {
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  function buildApp() {
    const app = express()
    app.locals.prisma = mockPrisma
    app.use(express.json())
    app.use('/', mediaRoutes)
    return app
  }

  describe('POST /bz-media-upload (social embed)', () => {
    it('creates an embed portfolio item', async () => {
      const app = buildApp()

      const res = await request(app)
        .post('/bz-media-upload')
        .send({
          type: 'embed',
          url: 'https://www.youtube.com/watch?v=abc123',
          embed_url: 'https://www.youtube.com/embed/abc123',
          platform: 'youtube',
          title: 'My Video',
        })
        .expect(200)

      expect(res.body).toHaveProperty('id')
      expect(res.body.type).toBe('embed')
      expect(res.body.platform).toBe('youtube')
      expect(res.body.title).toBe('My Video')
    })

    it('calls prisma.portfolioItem.create with correct data', async () => {
      const createSpy = vi.fn(async (args: any) => ({
        id: 99,
        talentId: args.data.talentId,
        type: args.data.type,
        url: args.data.url,
        thumbnailUrl: null,
        title: args.data.title,
        description: null,
        sortOrder: args.data.sortOrder,
        embedUrl: args.data.embedUrl,
        platform: args.data.platform,
        createdAt: new Date(),
      }))
      mockPrisma.portfolioItem.create = createSpy

      const app = buildApp()

      await request(app)
        .post('/bz-media-upload')
        .send({
          type: 'embed',
          url: 'https://www.tiktok.com/@user/video/123',
          embed_url: 'https://www.tiktok.com/embed/v2/123',
          platform: 'tiktok',
        })
        .expect(200)

      expect(createSpy).toHaveBeenCalledOnce()
      const createArgs = createSpy.mock.calls[0][0]
      expect(createArgs.data.type).toBe('embed')
      expect(createArgs.data.platform).toBe('tiktok')
      expect(createArgs.data.talentId).toBe(1)
    })
  })

  describe('POST /bz-media-upload (file)', () => {
    it('returns 400 when no file and not embed type', async () => {
      const app = buildApp()

      const res = await request(app)
        .post('/bz-media-upload')
        .send({ type: 'image' })
        .expect(400)

      expect(res.body.error).toBe('No file uploaded')
    })
  })

  describe('POST /bz-media-update', () => {
    it('updates title and description', async () => {
      const updateSpy = vi.fn(async (args: any) => ({
        id: args.where.id,
        talentId: 1,
        type: 'image',
        url: '/api/uploads/media/test.jpg',
        thumbnailUrl: null,
        title: args.data.title ?? 'Test',
        description: args.data.description ?? null,
        sortOrder: 0,
        embedUrl: null,
        platform: null,
      }))
      mockPrisma.portfolioItem.update = updateSpy

      const app = buildApp()

      const res = await request(app)
        .post('/bz-media-update')
        .send({ id: 1, title: 'New Title', description: 'New Desc' })
        .expect(200)

      expect(res.body.title).toBe('New Title')
      expect(res.body.description).toBe('New Desc')
    })

    it('returns 400 when id missing', async () => {
      const app = buildApp()

      const res = await request(app)
        .post('/bz-media-update')
        .send({ title: 'No ID' })
        .expect(400)

      expect(res.body.error).toBe('id required')
    })

    it('returns 404 when item not found', async () => {
      mockPrisma.portfolioItem.findFirst = vi.fn(async () => null)

      const app = buildApp()

      const res = await request(app)
        .post('/bz-media-update')
        .send({ id: 999, title: 'Ghost' })
        .expect(404)

      expect(res.body.error).toBe('Item not found')
    })
  })

  describe('POST /bz-media-delete', () => {
    it('deletes a portfolio item', async () => {
      const deleteSpy = vi.fn(async () => ({}))
      mockPrisma.portfolioItem.delete = deleteSpy

      const app = buildApp()

      const res = await request(app)
        .post('/bz-media-delete')
        .send({ id: 1 })
        .expect(200)

      expect(res.body.deleted).toBe(true)
      expect(deleteSpy).toHaveBeenCalledOnce()
    })

    it('returns 400 when id missing', async () => {
      const app = buildApp()

      await request(app)
        .post('/bz-media-delete')
        .send({})
        .expect(400)
    })

    it('returns 404 when item not found', async () => {
      mockPrisma.portfolioItem.findFirst = vi.fn(async () => null)

      const app = buildApp()

      await request(app)
        .post('/bz-media-delete')
        .send({ id: 999 })
        .expect(404)
    })
  })

  describe('POST /bz-media-reorder', () => {
    it('reorders a single item (legacy)', async () => {
      const updateSpy = vi.fn(async () => ({}))
      mockPrisma.portfolioItem.update = updateSpy

      const app = buildApp()

      const res = await request(app)
        .post('/bz-media-reorder')
        .send({ id: 1, sort_order: 3 })
        .expect(200)

      expect(res.body.reordered).toBe(true)
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { sortOrder: 3 },
      })
    })

    it('batch reorders multiple items', async () => {
      const updateSpy = vi.fn(async () => ({}))
      mockPrisma.portfolioItem.update = updateSpy

      const app = buildApp()

      const res = await request(app)
        .post('/bz-media-reorder')
        .send({
          items: [
            { id: 1, sort_order: 0 },
            { id: 2, sort_order: 1 },
            { id: 3, sort_order: 2 },
          ],
        })
        .expect(200)

      expect(res.body.reordered).toBe(true)
      expect(updateSpy).toHaveBeenCalledTimes(3)
    })

    it('returns 400 when single-item reorder missing fields', async () => {
      const app = buildApp()

      await request(app)
        .post('/bz-media-reorder')
        .send({ id: 1 }) // missing sort_order
        .expect(400)
    })
  })
})

describe('formatPortfolioItem', () => {
  it('formats Prisma model to API response shape', () => {
    const prismaItem = {
      id: 1,
      talentId: 5,
      type: 'video',
      url: '/api/uploads/media/clip.mp4',
      thumbnailUrl: '/api/uploads/media/thumbnails/thumb_clip.png',
      title: 'My Clip',
      description: 'A great clip',
      sortOrder: 2,
      embedUrl: null,
      platform: null,
      createdAt: new Date(),
    }

    const result = formatPortfolioItem(prismaItem)

    expect(result).toEqual({
      id: 1,
      talent_id: 5,
      type: 'video',
      url: '/api/uploads/media/clip.mp4',
      thumbnail_url: '/api/uploads/media/thumbnails/thumb_clip.png',
      title: 'My Clip',
      description: 'A great clip',
      sort_order: 2,
      embed_url: null,
      platform: null,
    })
  })

  it('handles null optional fields', () => {
    const prismaItem = {
      id: 2,
      talentId: 1,
      type: 'image',
      url: '/api/uploads/media/photo.jpg',
      thumbnailUrl: null,
      title: null,
      description: null,
      sortOrder: 0,
      embedUrl: null,
      platform: null,
      createdAt: new Date(),
    }

    const result = formatPortfolioItem(prismaItem)

    expect(result.thumbnail_url).toBeNull()
    expect(result.title).toBeNull()
    expect(result.embed_url).toBeNull()
  })
})
