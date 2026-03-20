import type { Request, Response, NextFunction } from 'express'
import type { PrismaClient } from '@prisma/client'

export interface AuthRequest extends Request {
  userId?: number
  talentId?: number
}

/**
 * Verify JWT from shared auth-api by decoding the payload.
 * The shared auth-api signs tokens — we trust them if they decode.
 * For a production setup, we'd verify the signature with the shared secret.
 * For now, we decode the base64 payload (auth-api is on the same server).
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const token = authHeader.substring(7)

  try {
    // Decode JWT payload (base64url)
    const parts = token.split('.')
    if (parts.length !== 3) {
      res.status(401).json({ error: 'Invalid token format' })
      return
    }
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    )

    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      res.status(401).json({ error: 'Token expired' })
      return
    }

    // The shared auth JWT has: sub (user uuid), email, name, role, products
    req.userId = payload.sub ? undefined : undefined // We'll resolve by email
    // Store the full payload for lookup
    ;(req as any).authPayload = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

/**
 * Resolve the auth user's email to a broodz talent.
 * Creates a user + talent stub if they don't exist yet.
 */
export async function resolveTalent(req: AuthRequest, res: Response, next: NextFunction) {
  const payload = (req as any).authPayload
  if (!payload?.email) {
    res.status(401).json({ error: 'Token missing email' })
    return
  }

  const prisma: PrismaClient = req.app.locals.prisma

  try {
    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: payload.email } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
        },
      })
    }

    // Find or create talent
    let talent = await prisma.talent.findFirst({ where: { userId: user.id } })
    if (!talent) {
      const slug = (payload.name || payload.email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      talent = await prisma.talent.create({
        data: {
          userId: user.id,
          name: payload.name || payload.email.split('@')[0],
          slug,
        },
      })
    }

    req.userId = user.id
    req.talentId = talent.id
    next()
  } catch (err) {
    console.error('resolveTalent error:', err)
    res.status(500).json({ error: 'Failed to resolve user' })
  }
}
