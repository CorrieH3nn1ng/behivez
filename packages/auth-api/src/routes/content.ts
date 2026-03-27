import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// All content routes require authentication
router.use(authenticate);

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// GET /content/drafts — list user's drafts
router.get('/drafts', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const userId = req.user!.sub;

  const drafts = await prisma.contentDraft.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json(drafts);
});

// GET /content/drafts/:id — single draft
router.get('/drafts/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const userId = req.user!.sub;

  const draft = await prisma.contentDraft.findUnique({
    where: { id: req.params.id },
  });

  if (!draft || draft.userId !== userId) {
    throw new AppError('Draft not found', 404);
  }

  res.json(draft);
});

// POST /content/drafts — save a draft
router.post('/drafts', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const userId = req.user!.sub;
  const { topic, insight, message, caption, hashtags, imageData, style, status } = req.body;

  if (!topic) throw new AppError('topic is required', 400);

  const draft = await prisma.contentDraft.create({
    data: {
      userId,
      topic,
      insight: insight || null,
      message: message || null,
      caption: caption || null,
      hashtags: hashtags || [],
      imageData: imageData || null,
      style: style || 'witty',
      status: status || 'draft',
    },
  });

  res.status(201).json(draft);
});

// PATCH /content/drafts/:id — update a draft
router.patch('/drafts/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const userId = req.user!.sub;

  const existing = await prisma.contentDraft.findUnique({
    where: { id: req.params.id },
  });

  if (!existing || existing.userId !== userId) {
    throw new AppError('Draft not found', 404);
  }

  const { topic, insight, message, caption, hashtags, imageData, style, status } = req.body;
  const data: Record<string, unknown> = {};
  if (topic !== undefined) data.topic = topic;
  if (insight !== undefined) data.insight = insight;
  if (message !== undefined) data.message = message;
  if (caption !== undefined) data.caption = caption;
  if (hashtags !== undefined) data.hashtags = hashtags;
  if (imageData !== undefined) data.imageData = imageData;
  if (style !== undefined) data.style = style;
  if (status !== undefined) data.status = status;

  const updated = await prisma.contentDraft.update({
    where: { id: req.params.id },
    data,
  });

  res.json(updated);
});

// DELETE /content/drafts/:id — delete a draft
router.delete('/drafts/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const userId = req.user!.sub;

  const existing = await prisma.contentDraft.findUnique({
    where: { id: req.params.id },
  });

  if (!existing || existing.userId !== userId) {
    throw new AppError('Draft not found', 404);
  }

  await prisma.contentDraft.delete({ where: { id: req.params.id } });

  res.json({ message: 'Draft deleted' });
});

export default router;
