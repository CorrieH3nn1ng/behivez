import { describe, it, expect, vi } from 'vitest'
import { authenticate } from './auth.js'
import type { Response, NextFunction } from 'express'
import type { AuthRequest } from './auth.js'

function createMockReq(authHeader?: string): AuthRequest {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as AuthRequest
}

function createMockRes() {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res as Response
}

describe('authenticate middleware', () => {
  it('returns 401 when no Authorization header', () => {
    const req = createMockReq()
    const res = createMockRes()
    const next = vi.fn()

    authenticate(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when header does not start with Bearer', () => {
    const req = createMockReq('Basic abc123')
    const res = createMockRes()
    const next = vi.fn()

    authenticate(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 for invalid JWT format', () => {
    const req = createMockReq('Bearer not-a-jwt')
    const res = createMockRes()
    const next = vi.fn()

    authenticate(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 for expired token', () => {
    // Create a JWT-like token with expired payload
    const header = Buffer.from('{"alg":"HS256"}').toString('base64url')
    const payload = Buffer.from(JSON.stringify({
      sub: 'test-uuid',
      email: 'test@example.com',
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    })).toString('base64url')
    const token = `${header}.${payload}.fakesig`

    const req = createMockReq(`Bearer ${token}`)
    const res = createMockRes()
    const next = vi.fn()

    authenticate(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next() for valid non-expired token', () => {
    const header = Buffer.from('{"alg":"HS256"}').toString('base64url')
    const payload = Buffer.from(JSON.stringify({
      sub: 'test-uuid',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    })).toString('base64url')
    const token = `${header}.${payload}.fakesig`

    const req = createMockReq(`Bearer ${token}`)
    const res = createMockRes()
    const next = vi.fn()

    authenticate(req, res, next)

    expect(next).toHaveBeenCalledOnce()
    expect((req as any).authPayload.email).toBe('test@example.com')
  })

  it('stores authPayload on request', () => {
    const header = Buffer.from('{"alg":"HS256"}').toString('base64url')
    const payload = Buffer.from(JSON.stringify({
      sub: 'user-123',
      email: 'artist@broodz.co.za',
      name: 'Maggie',
      role: 'USER',
      products: ['broodz'],
      exp: Math.floor(Date.now() / 1000) + 900,
    })).toString('base64url')
    const token = `${header}.${payload}.fakesig`

    const req = createMockReq(`Bearer ${token}`)
    const res = createMockRes()
    const next = vi.fn()

    authenticate(req, res, next)

    const stored = (req as any).authPayload
    expect(stored.sub).toBe('user-123')
    expect(stored.name).toBe('Maggie')
    expect(stored.products).toContain('broodz')
  })
})
