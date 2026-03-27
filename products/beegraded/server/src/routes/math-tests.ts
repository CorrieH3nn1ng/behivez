import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { optionalAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://165.73.87.181:5678/webhook';

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// --- Question Generation ---

interface Question {
  question: string;
  answer: number;
  operandA: number;
  operandB: number;
  operation: string;
}

interface GradeConfig {
  maxNumber: number;
  operations: string[];
  count: number;
  timeLimitSec: number;
  name: string;
}

const GRADE_CONFIGS: Record<number, GradeConfig> = {
  1: { maxNumber: 5, operations: ['add', 'subtract'], count: 20, timeLimitSec: 300, name: 'Somme Toets' },
  2: { maxNumber: 10, operations: ['add', 'subtract'], count: 30, timeLimitSec: 360, name: 'Somme Toets' },
  3: { maxNumber: 10, operations: ['multiply', 'divide'], count: 40, timeLimitSec: 360, name: 'Maaltafel Toets' },
  4: { maxNumber: 12, operations: ['multiply', 'divide'], count: 50, timeLimitSec: 360, name: 'Maaltafel Toets' },
  5: { maxNumber: 15, operations: ['multiply', 'divide'], count: 50, timeLimitSec: 360, name: 'Maaltafel Toets' },
  6: { maxNumber: 20, operations: ['multiply', 'divide'], count: 50, timeLimitSec: 360, name: 'Maaltafel Toets' },
  7: { maxNumber: 20, operations: ['multiply', 'divide', 'add', 'subtract'], count: 50, timeLimitSec: 360, name: 'Gemengde Toets' },
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestions(grade: number): Question[] {
  const config = GRADE_CONFIGS[grade] || GRADE_CONFIGS[4];
  return generateQuestionsWithOps(grade, config.operations);
}

function generateQuestionsWithOps(grade: number, ops: string[]): Question[] {
  const config = GRADE_CONFIGS[grade] || GRADE_CONFIGS[4];
  const questions: Question[] = [];
  const seen = new Set<string>();
  const perOp = Math.ceil(config.count / ops.length);

  for (const op of ops) {
    let generated = 0;
    let attempts = 0;
    while (generated < perOp && questions.length < config.count && attempts < 500) {
      attempts++;
      let a: number, b: number, answer: number, questionText: string;

      // Age-appropriate number ranges for addition/subtraction
      const addMax = grade <= 1 ? 10 : grade <= 2 ? 20 : grade <= 3 ? 50 : grade <= 4 ? 100 : config.maxNumber * config.maxNumber;

      switch (op) {
        case 'multiply':
          a = randInt(2, config.maxNumber);
          b = randInt(2, config.maxNumber);
          answer = a * b;
          questionText = `${a} x ${b}`;
          break;
        case 'divide':
          // Generate as multiply, then flip to division (guarantees whole number)
          b = randInt(2, config.maxNumber);
          a = randInt(2, config.maxNumber);
          answer = b; // (a*b) ÷ a = b
          questionText = `${a * b} ÷ ${a}`;
          break;
        case 'add':
          // Grade 1: 1+1 to 5+5 (max answer 10)
          // Grade 2: 1+1 to 10+10 (max answer 20)
          // Grade 3+: scaled up
          a = randInt(1, Math.floor(addMax / 2));
          b = randInt(1, addMax - a); // ensures answer <= addMax
          answer = a + b;
          questionText = `${a} + ${b}`;
          break;
        case 'subtract':
          // Answer is always positive, numbers within age-appropriate range
          a = randInt(2, addMax);
          b = randInt(1, a - 1);
          answer = a - b;
          questionText = `${a} - ${b}`;
          break;
        default:
          continue;
      }

      // Skip duplicates
      if (seen.has(questionText)) continue;
      seen.add(questionText);

      questions.push({
        question: questionText,
        answer,
        operandA: a!,
        operandB: b!,
        operation: op,
      });
      generated++;
    }
  }

  // Shuffle (Fisher-Yates)
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return questions.slice(0, config.count);
}

// --- Routes ---

// POST /api/math-tests/generate — Generate a unique test
router.post('/generate', optionalAuth, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const grade = parseInt(req.body.grade) || 4;
  const language = req.body.language || 'af';
  const customOps = req.body.operations as string[] | undefined;

  const config = GRADE_CONFIGS[grade] || GRADE_CONFIGS[4];
  const ops = customOps && customOps.length > 0 ? customOps : config.operations;
  const questions = generateQuestionsWithOps(grade, ops);

  // Determine name based on operations
  let testName = config.name;
  if (customOps && customOps.length > 0) {
    if (customOps.includes('add') && customOps.includes('subtract') && !customOps.includes('multiply')) {
      testName = language === 'af' ? 'Plus Minus Toets' : 'Plus Minus Test';
    }
  }

  const template = await prisma.math_test_templates.create({
    data: {
      name: `${testName} Gr ${grade}`,
      grade,
      operations: ops,
      time_limit_sec: config.timeLimitSec,
      questions_json: questions as any,
      question_count: questions.length,
      language,
      created_by: req.userId || null,
    },
  });

  res.json({
    id: template.id,
    name: template.name,
    grade: template.grade,
    operations: template.operations,
    time_limit_sec: template.time_limit_sec,
    question_count: template.question_count,
    language: template.language,
    questions: questions.map(q => ({
      question: q.question,
      operation: q.operation,
    })),
  });
});

// POST /api/math-tests/generate-problems — Generate problem-solving test via AI
router.post('/generate-problems', optionalAuth, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const grade = parseInt(req.body.grade) || 4;
  const language = req.body.language || 'af';

  const categories = [
    'money/financial (Rands and cents, shopping, change)',
    'number patterns (find missing number in sequence)',
    'speed/distance/time',
    'division and remainders (packing, grouping)',
    'multi-step logic (people getting on/off a taxi, bus)',
    'fractions (parts of a whole, sharing equally)',
    'measurement (litres, kg, km, cm, converting units)',
    'perimeter and area of rectangles',
    'data reading (bar graphs, tables)',
    'time calculations (elapsed time, calendars)',
  ];

  const prompt = `You are a South African Grade ${grade} mathematics teacher creating a practice test for the SA Wiskunde-uitdaging (SA Mathematics Challenge).

Generate exactly 20 multiple choice word problems. Each question must:
- Be appropriate for Grade ${grade} CAPS curriculum level
- Be a word problem (not plain arithmetic)
- Have exactly 5 options labeled (A), (B), (C), (D), (E)
- Have exactly ONE correct answer
- Be in BOTH Afrikaans AND English
- Test INSIGHT and REASONING, not just calculation (calculator is allowed)
- Cover these categories (2 questions each): ${categories.join('; ')}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question_af": "Die Afrikaanse vraag hier...",
    "question_en": "The English question here...",
    "options": ["(A) 42", "(B) 48", "(C) 54", "(D) 60", "(E) 36"],
    "correct": 1,
    "category": "money"
  }
]

Where "correct" is the 0-based index of the correct option (0=A, 1=B, 2=C, 3=D, 4=E).

IMPORTANT:
- Make questions realistic and relatable to South African children (use Rands, SA place names, local context)
- Vary difficulty: first 10 easier, last 10 harder
- Each question must be solvable by a Grade ${grade} learner who THINKS carefully
- Do NOT include any text outside the JSON array`;

  try {
    // Call Gemini API directly (GEMINI_API_KEY in .env)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new AppError('GEMINI_API_KEY not configured', 500);
    }

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8 },
      },
      { timeout: 120000 }
    );

    const responseText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!responseText) {
      throw new AppError('Gemini returned empty response', 500);
    }

    // Parse JSON from response (strip markdown code blocks if present)
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    jsonStr = jsonStr.trim();
    const match = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) jsonStr = match[0];

    let questions: any[];
    try {
      questions = JSON.parse(jsonStr);
    } catch {
      throw new AppError('Failed to parse AI response', 500);
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new AppError('No questions generated', 500);
    }

    // Shuffle options so correct answer is randomly placed
    for (const q of questions) {
      if (!q.options || q.correct === undefined) continue;
      const correctOption = q.options[q.correct];
      for (let i = q.options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
      }
      q.correct = q.options.indexOf(correctOption);
      const labels = ['(A)', '(B)', '(C)', '(D)', '(E)'];
      q.options = q.options.map((opt: string, i: number) => {
        const text = opt.replace(/^\([A-E]\)\s*/, '');
        return `${labels[i]} ${text}`;
      });
    }

    // Save as template
    const template = await prisma.math_test_templates.create({
      data: {
        name: language === 'af' ? `Probleemoplossing Gr ${grade}` : `Problem Solving Gr ${grade}`,
        grade,
        operations: ['problem_solving'],
        time_limit_sec: 3600, // 60 minutes
        questions_json: questions as any,
        question_count: questions.length,
        language,
        created_by: req.userId || null,
      },
    });

    res.json({
      id: template.id,
      name: template.name,
      grade: template.grade,
      time_limit_sec: template.time_limit_sec,
      question_count: template.question_count,
      language: template.language,
      type: 'problem_solving',
      questions: questions.map((q: any) => ({
        question_af: q.question_af,
        question_en: q.question_en,
        options: q.options,
        category: q.category,
      })),
    });
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error('Problem generation error:', err.message);
    throw new AppError('Failed to generate problem-solving test. Please try again.', 500);
  }
});

// GET /api/math-tests/leaderboard — Global leaderboard by grade
// NOTE: Must be before /:id route to avoid "leaderboard" being parsed as an ID
router.get('/leaderboard', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const grade = parseInt(req.query.grade as string) || 4;

  const allAttempts = await prisma.math_test_attempts.findMany({
    where: {
      template: { grade },
    },
    orderBy: [{ percentage: 'desc' }, { time_used_sec: 'asc' }],
    take: 100,
  });

  const bestByPlayer = new Map<string, typeof allAttempts[0]>();
  for (const a of allAttempts) {
    const existing = bestByPlayer.get(a.player_name);
    if (!existing || Number(a.percentage) > Number(existing.percentage) ||
        (Number(a.percentage) === Number(existing.percentage) && a.time_used_sec < existing.time_used_sec)) {
      bestByPlayer.set(a.player_name, a);
    }
  }

  const leaderboard = Array.from(bestByPlayer.values())
    .sort((a, b) => Number(b.percentage) - Number(a.percentage) || a.time_used_sec - b.time_used_sec)
    .slice(0, 20)
    .map((a, i) => ({
      rank: i + 1,
      player_name: a.player_name,
      score: a.score,
      total: a.total,
      percentage: Number(a.percentage),
      time_used_sec: a.time_used_sec,
      date: a.created_at,
    }));

  res.json({ grade, leaderboard });
});

// GET /api/math-tests/history — Player's attempt history
// NOTE: Must be before /:id route
router.get('/history', optionalAuth, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const playerName = req.query.playerName as string;
  const playerId = req.userId;

  if (!playerName && !playerId) {
    throw new AppError('playerName query param or auth token required', 400);
  }

  const where: any = {};
  if (playerId) {
    where.player_id = playerId;
  } else {
    where.player_name = playerName;
  }

  const attempts = await prisma.math_test_attempts.findMany({
    where,
    include: { template: { select: { name: true, grade: true } } },
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  res.json({
    attempts: attempts.map(a => ({
      id: a.id,
      template_name: a.template.name,
      grade: a.template.grade,
      score: a.score,
      total: a.total,
      percentage: Number(a.percentage),
      time_used_sec: a.time_used_sec,
      completed: a.completed,
      date: a.created_at,
    })),
  });
});

// GET /api/math-tests/:id — Get template (without answers for test-taking)
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const id = parseInt(req.params.id);
  if (isNaN(id)) throw new AppError('Invalid template ID', 400);

  const template = await prisma.math_test_templates.findUnique({ where: { id } });
  if (!template) throw new AppError('Test not found', 404);

  const questions = template.questions_json as unknown as any[];
  const showAnswers = req.query.answers === 'true';
  const isProblemSolving = template.operations.includes('problem_solving') || template.operations.includes('multiple_choice');

  res.json({
    id: template.id,
    name: template.name,
    grade: template.grade,
    operations: template.operations,
    time_limit_sec: template.time_limit_sec,
    question_count: template.question_count,
    language: template.language,
    type: isProblemSolving ? 'problem_solving' : 'speed',
    questions: questions.map(q => {
      if (isProblemSolving) {
        return {
          question_af: q.question_af,
          question_en: q.question_en,
          options: q.options,
          category: q.category,
          ...(showAnswers ? { correct: q.correct } : {}),
        };
      }
      return {
        question: q.question,
        operation: q.operation,
        ...(showAnswers ? { answer: q.answer } : {}),
      };
    }),
  });
});

// POST /api/math-tests/:id/attempts — Submit and auto-mark a test attempt
router.post('/:id/attempts', optionalAuth, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const templateId = parseInt(req.params.id);
  if (isNaN(templateId)) throw new AppError('Invalid template ID', 400);

  const { playerName, answers, timeUsedSec, childId } = req.body;
  if (!playerName) throw new AppError('playerName is required', 400);
  if (!Array.isArray(answers)) throw new AppError('answers must be an array', 400);

  const template = await prisma.math_test_templates.findUnique({ where: { id: templateId } });
  if (!template) throw new AppError('Test not found', 404);

  // Auto-mark — supports both speed tests (number answer) and problem-solving (option index)
  const isProblemSolving = template.operations.includes('problem_solving') || template.operations.includes('multiple_choice');
  const questions = template.questions_json as unknown as any[];
  let score = 0;
  const markedAnswers = answers.map((a: { questionIndex: number; givenAnswer: number }) => {
    const q = questions[a.questionIndex];
    let correct = false;
    let correctAnswer: any = null;

    if (isProblemSolving) {
      correct = q ? a.givenAnswer === q.correct : false;
      correctAnswer = q?.options?.[q.correct] || q?.correct;
    } else {
      correct = q ? a.givenAnswer === q.answer : false;
      correctAnswer = q?.answer;
    }

    if (correct) score++;

    const givenAnswerDisplay = isProblemSolving
      ? (q?.options?.[a.givenAnswer] || a.givenAnswer)
      : a.givenAnswer;

    return {
      questionIndex: a.questionIndex,
      givenAnswer: givenAnswerDisplay,
      correctAnswer,
      correct,
      question: isProblemSolving ? (q?.question_af || q?.question_en) : q?.question,
    };
  });

  const total = questions.length;
  const percentage = total > 0 ? Math.round((score / total) * 10000) / 100 : 0;
  const completed = answers.length >= total;

  const attempt = await prisma.math_test_attempts.create({
    data: {
      template_id: templateId,
      player_name: playerName,
      player_id: req.userId || null,
      child_id: childId ? parseInt(childId) : null,
      score,
      total,
      percentage,
      time_used_sec: timeUsedSec || 0,
      completed,
      answers_json: markedAnswers as any,
    },
  });

  // Notify parent via email if child is linked (fire-and-forget)
  if (attempt.child_id) {
    (async () => {
      try {
        const child = await prisma.children.findUnique({ where: { id: attempt.child_id! } });
        if (!child) return;

        const parentEmail = child.parent_email || '';
        if (!parentEmail) return;

        const https = await import('https');
        const http = await import('http');

        // Fire-and-forget POST to n8n webhook for email notification
        const n8nUrl = process.env.N8N_WEBHOOK_URL || 'https://beegraded.co.za/webhook';
        const payload = JSON.stringify({
          parentEmail,
          parentId: child.parent_id,
          childName: child.name,
          testName: template.name,
          score,
          total,
          percentage,
          grade: template.grade,
          language: child.language || 'af',
        });
        const webhookUrl = new URL(`${n8nUrl}/bg-notify-parent`);
        const mod2 = webhookUrl.protocol === 'https:' ? https : http;
        const wr = mod2.request(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
        });
        wr.write(payload);
        wr.end();
      } catch { /* silent — notification is best-effort */ }
    })();
  }

  // Get personal best for this player + grade
  const personalBest = await prisma.math_test_attempts.findFirst({
    where: {
      player_name: playerName,
      template: { grade: template.grade },
    },
    orderBy: { percentage: 'desc' },
  });

  const isNewBest = personalBest?.id === attempt.id;

  res.json({
    id: attempt.id,
    score,
    total,
    percentage,
    time_used_sec: attempt.time_used_sec,
    completed,
    is_new_best: isNewBest,
    personal_best: personalBest ? {
      score: personalBest.score,
      total: personalBest.total,
      percentage: Number(personalBest.percentage),
    } : null,
    answers: markedAnswers,
    template_name: template.name,
    grade: template.grade,
  });
});

// GET /api/math-tests/:id/leaderboard — Top scores for a template's grade
router.get('/:id/leaderboard', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const templateId = parseInt(req.params.id);

  const template = await prisma.math_test_templates.findUnique({ where: { id: templateId } });
  if (!template) throw new AppError('Test not found', 404);

  // Get top 20 scores for this grade (best score per player)
  const allAttempts = await prisma.math_test_attempts.findMany({
    where: {
      template: { grade: template.grade },
    },
    orderBy: [{ percentage: 'desc' }, { time_used_sec: 'asc' }],
    take: 100,
  });

  // Deduplicate: best score per player name
  const bestByPlayer = new Map<string, typeof allAttempts[0]>();
  for (const a of allAttempts) {
    const existing = bestByPlayer.get(a.player_name);
    if (!existing || Number(a.percentage) > Number(existing.percentage) ||
        (Number(a.percentage) === Number(existing.percentage) && a.time_used_sec < existing.time_used_sec)) {
      bestByPlayer.set(a.player_name, a);
    }
  }

  const leaderboard = Array.from(bestByPlayer.values())
    .sort((a, b) => Number(b.percentage) - Number(a.percentage) || a.time_used_sec - b.time_used_sec)
    .slice(0, 20)
    .map((a, i) => ({
      rank: i + 1,
      player_name: a.player_name,
      score: a.score,
      total: a.total,
      percentage: Number(a.percentage),
      time_used_sec: a.time_used_sec,
      date: a.created_at,
    }));

  res.json({ grade: template.grade, leaderboard });
});

// DELETE /api/math-tests/history — Delete all attempts for a player
router.delete('/history', optionalAuth, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const playerName = req.query.playerName as string;
  const playerId = req.userId;

  if (!playerName && !playerId) {
    throw new AppError('playerName query param or auth token required', 400);
  }

  const where: any = {};
  if (playerId) {
    where.player_id = playerId;
  } else {
    where.player_name = playerName;
  }

  const result = await prisma.math_test_attempts.deleteMany({ where });

  res.json({ deleted: result.count });
});

// GET /api/math-tests/:id/attempt/:attemptId — Get a specific attempt with full details
router.get('/:id/attempt/:attemptId', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const attemptId = parseInt(req.params.attemptId);
  if (isNaN(attemptId)) throw new AppError('Invalid attempt ID', 400);

  const attempt = await prisma.math_test_attempts.findUnique({
    where: { id: attemptId },
    include: { template: true },
  });

  if (!attempt) throw new AppError('Attempt not found', 404);

  res.json({
    id: attempt.id,
    score: attempt.score,
    total: attempt.total,
    percentage: Number(attempt.percentage),
    time_used_sec: attempt.time_used_sec,
    completed: attempt.completed,
    answers: attempt.answers_json,
    date: attempt.created_at,
    template: {
      id: attempt.template.id,
      name: attempt.template.name,
      grade: attempt.template.grade,
      language: attempt.template.language,
    },
  });
});

export default router;
