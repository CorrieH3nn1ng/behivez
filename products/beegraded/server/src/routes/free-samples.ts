import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
// @ts-expect-error — pdf-parse@1.1.1 has no types
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
const uploadFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
}).single('file');

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

async function extractText(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    return (await pdfParse(buffer)).text;
  }
  return (await mammoth.extractRawText({ buffer })).value;
}

// POST /api/free-samples — DB operations only (check email, save paper/eval/sample)
// Returns paper_text so frontend can send it to n8n for AI evaluation
router.post('/', uploadFile, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { email, subject, assessment_type } = req.body;

  if (!req.file) throw new AppError('No file uploaded', 400);
  if (!email) throw new AppError('email is required', 400);

  // Check if email already used
  const existing = await prisma.free_samples.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return res.status(400).json({ error: 'You have already used your free sample evaluation.' });
  }

  // Extract text
  const text = await extractText(req.file.buffer, req.file.mimetype);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Save paper
  const paper = await prisma.papers.create({
    data: {
      filename: req.file.originalname,
      subject: subject || 'General',
      assessment_type: assessment_type || 'Assessment',
      paper_text: text,
      word_count: wordCount,
      page_count: Math.max(1, Math.ceil(wordCount / 250)),
      draft_or_final: 'draft',
    },
  });

  // Create eval record
  const evaluation = await prisma.evaluations.create({
    data: { paper_id: paper.id, mode: 'A', draft_or_final: 'draft', overall_score: 0 },
  });

  // Save free sample record
  const sample = await prisma.free_samples.create({
    data: {
      email: email.toLowerCase(),
      paper_id: paper.id,
      evaluation_id: evaluation.id,
    },
  });

  res.json({
    sample_id: sample.id,
    evaluation_id: evaluation.id,
    paper_text: text.substring(0, 30000),
    subject: subject || 'General',
    assessment_type: assessment_type || 'Assessment',
  });
});

export default router;
