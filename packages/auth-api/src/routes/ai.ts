import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { AppError } from '../middleware/errorHandler.js';
import { callN8nWorkflow, renderTemplate } from '../services/gemini.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

async function getActivePrompt(prisma: PrismaClient, key: string) {
  const prompt = await prisma.prompt.findUnique({ where: { key } });
  if (!prompt) throw new AppError(`Prompt "${key}" not found`, 404);
  if (!prompt.active) throw new AppError(`Prompt "${key}" is inactive`, 400);
  return prompt;
}

// ── Authenticated AI Endpoints ────────────────────────────────
// Auth-api loads prompt from DB, sends to n8n. n8n calls Gemini.

// POST /ai/extract-pdf
router.post('/extract-pdf', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);

  // Get PDF as base64
  let pdfBase64: string;
  if (req.file) {
    pdfBase64 = req.file.buffer.toString('base64');
  } else if (req.body.pdfBase64) {
    pdfBase64 = req.body.pdfBase64;
  } else {
    throw new AppError('Provide a PDF file or pdfBase64', 400);
  }

  const { promptKey } = req.body;
  let prompt: string | undefined;
  let model = 'gemini-2.5-flash';

  if (promptKey) {
    const promptRecord = await getActivePrompt(prisma, promptKey);
    const variables: Record<string, string> = req.body.variables
      ? (typeof req.body.variables === 'string' ? JSON.parse(req.body.variables) : req.body.variables)
      : {};
    prompt = renderTemplate(promptRecord.template, variables);
    model = promptRecord.model;
  }

  const result = await callN8nWorkflow('bh-extract-pdf', {
    pdfBase64,
    prompt,
    model,
  });

  res.json(result);
});

// POST /ai/extract-image
router.post('/extract-image', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { imageBase64, mimeType = 'image/png', promptKey, variables = {} } = req.body;

  if (!imageBase64) throw new AppError('imageBase64 is required', 400);

  let prompt = 'Extract all text and data from this image. Return as structured JSON.';
  let model = 'gemini-2.5-flash';

  if (promptKey) {
    const promptRecord = await getActivePrompt(prisma, promptKey);
    prompt = renderTemplate(promptRecord.template, variables);
    model = promptRecord.model;
  }

  const result = await callN8nWorkflow('bh-extract-image', {
    imageBase64,
    mimeType,
    prompt,
    model,
  });

  res.json(result);
});

// POST /ai/generate-text
router.post('/generate-text', authenticate, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { promptKey, variables = {} } = req.body;

  if (!promptKey) throw new AppError('promptKey is required', 400);

  const promptRecord = await getActivePrompt(prisma, promptKey);
  const prompt = renderTemplate(promptRecord.template, variables);

  const result = await callN8nWorkflow('bh-generate-text', {
    prompt,
    model: promptRecord.model,
  });

  res.json(result);
});

// ── Admin Prompt Management ───────────────────────────────────

// GET /ai/prompts
router.get('/prompts', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const where: Record<string, unknown> = {};
  if (req.query.product) where.product = req.query.product;
  if (req.query.active) where.active = req.query.active === 'true';

  const prompts = await prisma.prompt.findMany({ where, orderBy: { key: 'asc' } });
  res.json(prompts);
});

// POST /ai/prompts
router.post('/prompts', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { key, name, template, product, description, model, version, active } = req.body;

  if (!key || !name || !template) {
    throw new AppError('key, name, and template are required', 400);
  }

  const existing = await prisma.prompt.findUnique({ where: { key } });
  if (existing) throw new AppError(`Prompt with key "${key}" already exists`, 409);

  const prompt = await prisma.prompt.create({
    data: {
      key,
      name,
      template,
      product: product || null,
      description: description || null,
      model: model || 'gemini-2.0-flash',
      version: version || 1,
      active: active !== false,
    },
  });

  res.status(201).json(prompt);
});

// PUT /ai/prompts/:key
router.put('/prompts/:key', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { key } = req.params;

  const existing = await prisma.prompt.findUnique({ where: { key } });
  if (!existing) throw new AppError(`Prompt "${key}" not found`, 404);

  const data: Record<string, unknown> = {};
  const fields = ['name', 'description', 'template', 'model', 'version', 'active', 'product'];
  for (const field of fields) {
    if (req.body[field] !== undefined) data[field] = req.body[field];
  }

  // Auto-increment version if template changed and version wasn't explicitly set
  if (data.template && data.template !== existing.template && !req.body.version) {
    data.version = existing.version + 1;
  }

  const prompt = await prisma.prompt.update({ where: { key }, data });
  res.json(prompt);
});

// DELETE /ai/prompts/:key
router.delete('/prompts/:key', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { key } = req.params;

  const existing = await prisma.prompt.findUnique({ where: { key } });
  if (!existing) throw new AppError(`Prompt "${key}" not found`, 404);

  await prisma.prompt.delete({ where: { key } });
  res.json({ message: 'Prompt deleted' });
});

export default router;
