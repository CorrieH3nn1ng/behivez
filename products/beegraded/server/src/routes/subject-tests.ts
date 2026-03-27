import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { optionalAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// Subject-specific configs
interface SubjectConfig {
  questionCount: number;
  timeLimitSec: number;
  nameEn: string;
  nameAf: string;
  buildPrompt: (grade: number) => string;
}

function langPrompt(subjectLang: string, grade: number): string {
  const age = grade + 5;
  const isFoundation = grade <= 3;
  const qCount = isFoundation ? 20 : 30;

  // For language tests: questions AND options must be in the subject's language
  // The other field provides translation for parents/bilingual display
  const langConfig: Record<string, { name: string; primaryField: string; secondaryField: string; secondaryLang: string }> = {
    english: { name: 'English', primaryField: 'question_en', secondaryField: 'question_af', secondaryLang: 'Afrikaans' },
    afrikaans: { name: 'Afrikaans', primaryField: 'question_af', secondaryField: 'question_en', secondaryLang: 'English' },
    setswana: { name: 'Setswana', primaryField: 'question_en', secondaryField: 'question_af', secondaryLang: 'English' },
  };
  const cfg = langConfig[subjectLang] || langConfig.english;

  const categoryBlock = isFoundation ? `
  * Spelling — "Which word is spelled correctly?" (common Grade ${grade} words)
  * Vocabulary — "What does this word mean?" or "Which word matches the picture description?"
  * Phonics — "Which word rhymes with ___?" or "Which word starts with the same sound?"
  * Sentence completion — "Fill in the missing word"
` : `
  * Spelling — "Which word is spelled correctly?" (Grade ${grade} level words)
  * Vocabulary — word meanings, synonyms, antonyms
  * Grammar — Tenses, plurals, pronouns, sentence structure
  * Comprehension — Short sentence, answer a question about it
  * Idioms/Expressions — Common expressions and their meaning
`;

  return `You are a South African ${cfg.name} language teacher creating a practice test for Grade ${grade} learners (age ${age}).

Generate exactly ${qCount} multiple choice questions testing ${cfg.name} language skills.

CRITICAL RULES:
- ALL questions must be written IN ${cfg.name}
- ALL answer options (A), (B), (C), (D) must be IN ${cfg.name}
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be appropriate for Grade ${grade} ${cfg.name} CAPS curriculum

For the JSON output:
- "${cfg.primaryField}" = the question in ${cfg.name} (this is the MAIN question)
- "${cfg.secondaryField}" = translation in ${cfg.secondaryLang} (for parents who don't speak ${cfg.name})

Cover these categories evenly:
${categoryBlock}

Return ONLY a valid JSON array:
[
  {
    "${cfg.primaryField}": "Question in ${cfg.name} here...",
    "${cfg.secondaryField}": "Translation in ${cfg.secondaryLang} here...",
    "options": ["(A) option in ${cfg.name}", "(B) option in ${cfg.name}", "(C) option in ${cfg.name}", "(D) option in ${cfg.name}"],
    "correct": 0,
    "category": "spelling"
  }
]

Where "correct" is the 0-based index (0=A, 1=B, 2=C, 3=D).

IMPORTANT:
- EVERYTHING the learner sees (question + options) must be in ${cfg.name}
- The translation field is ONLY for parents, not shown to the child as the main question
- Use South African context and vocabulary
- Grade ${grade} appropriate difficulty
- Mix easy and harder questions
- Do NOT include any text outside the JSON array`;
}

const SUBJECT_CONFIGS: Record<string, SubjectConfig> = {
  english: {
    questionCount: 30, // overridden to 20 for Gr 1-3 in prompt
    timeLimitSec: 1800,
    nameEn: 'English',
    nameAf: 'Engels',
    buildPrompt: (grade: number) => langPrompt('english', grade),
  },
  afrikaans: {
    questionCount: 30,
    timeLimitSec: 1800,
    nameEn: 'Afrikaans',
    nameAf: 'Afrikaans',
    buildPrompt: (grade: number) => langPrompt('afrikaans', grade),
  },
  setswana: {
    questionCount: 20,
    timeLimitSec: 1800,
    nameEn: 'Setswana',
    nameAf: 'Setswana',
    buildPrompt: (grade: number) => langPrompt('setswana', grade),
  },
  natural_science: {
    questionCount: 40,
    timeLimitSec: 3600,
    nameEn: 'Natural Science',
    nameAf: 'Natuurwetenskap',
    buildPrompt: (grade: number) => `You are a South African Natural Science teacher creating a practice test similar to the SA Natural Science Olympiad.

Generate exactly 40 multiple choice questions for Grade ${grade}. Each question must:
- Be appropriate for the Grade ${grade} SA CAPS Natural Science and Technology curriculum
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH Afrikaans AND English
- Cover these topics proportionally:
  * Life and Living (plants, animals, ecosystems, food chains, life cycles)
  * Energy and Change (heat, light, sound, electricity, energy transfer)
  * Matter and Materials (states of matter, mixtures, materials, properties)
  * Planet Earth and Beyond (weather, seasons, the solar system, rocks, soil, water cycle)

Return ONLY a valid JSON array:
[
  {
    "question_af": "Die Afrikaanse vraag hier...",
    "question_en": "The English question here...",
    "options": ["(A) ...", "(B) ...", "(C) ...", "(D) ..."],
    "correct": 0,
    "category": "life_and_living"
  }
]

Where "correct" is the 0-based index (0=A, 1=B, 2=C, 3=D).

IMPORTANT:
- Use South African context (local animals like springbok, protea, Table Mountain, SA biomes, local weather)
- First 20 questions easier, last 20 harder
- Questions should test understanding and reasoning, not just recall
- Grade ${grade} appropriate vocabulary and concepts
- Do NOT include any text outside the JSON array`,
  },

  life_skills: {
    questionCount: 20,
    timeLimitSec: 1800,
    nameEn: 'Life Skills',
    nameAf: 'Lewensvaardighede',
    buildPrompt: (grade: number) => {
      const age = grade + 5;
      return `You are a South African Foundation Phase teacher creating a fun Beginning Knowledge quiz for Grade ${grade} children (age ${age}-${age + 1}).

Generate exactly 20 multiple choice questions. Each question must:
- Be appropriate for a Grade ${grade} child (age ${age}-${age + 1})
- Have exactly 4 options labeled (A), (B), (C), (D)
- Have exactly ONE correct answer
- Be in BOTH Afrikaans AND English
- Use SIMPLE language and SHORT sentences
- Cover these Beginning Knowledge topics (4 questions each):
  * Animals (farm animals, wild animals, pets, habitats, what animals eat)
  * Plants (parts of a plant, what plants need to grow, types of plants)
  * Weather and Seasons (rain, sun, wind, hot, cold, summer, winter, spring, autumn)
  * My Body and Health (body parts, healthy food, exercise, hygiene, senses)
  * Safety (road safety, stranger danger, fire safety, water safety, emergency numbers)

Return ONLY a valid JSON array:
[
  {
    "question_af": "Die Afrikaanse vraag hier...",
    "question_en": "The English question here...",
    "options": ["(A) ...", "(B) ...", "(C) ...", "(D) ..."],
    "correct": 0,
    "category": "animals"
  }
]

Where "correct" is the 0-based index (0=A, 1=B, 2=C, 3=D).

IMPORTANT:
- Keep language at Grade ${grade} reading level — simple words, short sentences
- Questions should be fun and relatable to a young South African child
- Use familiar SA context (mielies, braai, taxi, Kruger Park, Table Mountain)
- Grade 1: very simple recognition ("Which animal says 'moo'?"), Grade 2: slightly harder, Grade 3: beginning to reason ("Why do we wear a jacket in winter?")
- Do NOT include any text outside the JSON array`;
    },
  },
};

// POST /api/subject-tests/generate — Generate AI test for any subject
router.post('/generate', optionalAuth, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { subject_code, grade, language } = req.body;

  if (!subject_code || !grade) {
    throw new AppError('subject_code and grade are required', 400);
  }

  const config = SUBJECT_CONFIGS[subject_code];
  if (!config) {
    throw new AppError(`Unknown subject: ${subject_code}`, 400);
  }

  // Validate grade is valid for this subject
  const subject = await prisma.subjects.findUnique({ where: { code: subject_code } });
  if (!subject) throw new AppError(`Subject not found: ${subject_code}`, 404);
  if (!subject.grades.includes(parseInt(grade))) {
    throw new AppError(`Grade ${grade} is not available for ${subject_code}`, 400);
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new AppError('GEMINI_API_KEY not configured', 500);
  }

  const prompt = config.buildPrompt(parseInt(grade));

  try {
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
      throw new AppError('AI returned empty response', 500);
    }

    // Parse JSON (strip markdown code blocks if present)
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

    // Shuffle options for each question so correct answer isn't always B/C
    for (const q of questions) {
      if (!q.options || q.correct === undefined) continue;
      const correctOption = q.options[q.correct];
      // Fisher-Yates shuffle
      for (let i = q.options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
      }
      // Update correct index to new position
      q.correct = q.options.indexOf(correctOption);
      // Re-label options with (A), (B), (C), (D)
      const labels = ['(A)', '(B)', '(C)', '(D)', '(E)'];
      q.options = q.options.map((opt: string, i: number) => {
        // Strip existing label like "(A) " and add new one
        const text = opt.replace(/^\([A-E]\)\s*/, '');
        return `${labels[i]} ${text}`;
      });
    }

    const lang = language || 'en';
    const templateName = lang === 'af'
      ? `${config.nameAf} Gr ${grade}`
      : `${config.nameEn} Gr ${grade}`;

    const template = await prisma.math_test_templates.create({
      data: {
        name: templateName,
        grade: parseInt(grade),
        subject_code,
        operations: ['multiple_choice'],
        time_limit_sec: config.timeLimitSec,
        questions_json: questions as any,
        question_count: questions.length,
        language: lang,
        created_by: req.userId || null,
      },
    });

    res.json({
      id: template.id,
      name: template.name,
      grade: template.grade,
      subject_code,
      time_limit_sec: template.time_limit_sec,
      question_count: template.question_count,
      language: template.language,
      type: 'multiple_choice',
      questions: questions.map((q: any) => ({
        question_af: q.question_af,
        question_en: q.question_en,
        options: q.options,
        category: q.category,
      })),
    });
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error('Subject test generation error:', err.message);
    throw new AppError('Failed to generate test. Please try again.', 500);
  }
});

// POST /api/subject-tests/lesson — Generate a vocabulary lesson for language learning
router.post('/lesson', optionalAuth, async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { language, level } = req.body;

  if (!language) throw new AppError('language is required', 400);

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new AppError('GEMINI_API_KEY not configured', 500);

  const langNames: Record<string, string> = {
    setswana: 'Setswana',
    afrikaans: 'Afrikaans',
    english: 'English',
  };
  const targetLang = langNames[language] || language;
  const lvl = level || 'beginner';

  const prompt = `You are a friendly ${targetLang} language teacher for an adult South African learner at ${lvl} level.

Generate a vocabulary lesson with exactly 10 words/phrases. For each entry provide:
- The word/phrase in ${targetLang}
- English translation
- Afrikaans translation
- A detailed pronunciation guide written phonetically for English/Afrikaans speakers. Break each syllable with hyphens and use CAPITALS for the stressed syllable. Use familiar sounds (e.g. "doo-MEH-lah" not IPA symbols).
- A short example sentence in ${targetLang}
- English translation of the example sentence
- Afrikaans translation of the example sentence
- A category (greetings, numbers, food, animals, family, directions, shopping, weather, colors, body)

Return ONLY a valid JSON array:
[
  {
    "word": "Dumela",
    "translation_en": "Hello",
    "translation_af": "Hallo",
    "pronunciation": "doo-MEH-lah",
    "example": "Dumela, o kae?",
    "example_en": "Hello, how are you?",
    "example_af": "Hallo, hoe gaan dit?",
    "category": "greetings"
  }
]

IMPORTANT:
- Mix categories so the lesson is varied
- Start with common, everyday words
- For ${lvl} level: ${lvl === 'beginner' ? 'very basic greetings, numbers 1-10, simple nouns' : lvl === 'intermediate' ? 'conversational phrases, verbs, descriptive words' : 'complex sentences, idioms, formal language'}
- Use correct ${targetLang} spelling and grammar
- The pronunciation guide must be VERY detailed and accurate — this is the most important field
- Make it fun and practical for daily use in South Africa
- Do NOT include any text outside the JSON array`;

  try {
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9 },
      },
      { timeout: 60000 }
    );

    const responseText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!responseText) throw new AppError('AI returned empty response', 500);

    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    jsonStr = jsonStr.trim();
    const match = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) jsonStr = match[0];

    const words = JSON.parse(jsonStr);
    if (!Array.isArray(words) || words.length === 0) {
      throw new AppError('No words generated', 500);
    }

    res.json({ words, language, level: lvl });
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error('Lesson generation error:', err.message);
    throw new AppError('Failed to generate lesson. Please try again.', 500);
  }
});

export default router;
