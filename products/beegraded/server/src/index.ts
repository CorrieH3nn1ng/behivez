import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import evaluationRoutes from './routes/evaluations.js';
import paperRoutes from './routes/papers.js';
import comparisonRoutes from './routes/comparisons.js';
import rubricRoutes from './routes/rubrics.js';
import tokenRoutes from './routes/tokens.js';
import couponRoutes from './routes/coupons.js';
import paymentRoutes from './routes/payments.js';
import freeSampleRoutes from './routes/free-samples.js';
import mathTestRoutes from './routes/math-tests.js';
import childrenRoutes from './routes/children.js';
import profileRoutes from './routes/profile.js';
import subjectTestRoutes from './routes/subject-tests.js';
import subscriptionRoutes from './routes/subscription.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAdmin } from './middleware/auth.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Make prisma available to routes
app.locals.prisma = prisma;

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'beegraded-api', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/comparisons', comparisonRoutes);
app.use('/api/rubrics', rubricRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/free-samples', freeSampleRoutes);
app.use('/api/math-tests', mathTestRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/subject-tests', subjectTestRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', requireAdmin, adminRoutes);

// Error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

const SUBJECTS_SEED = [
  { code: 'maths',           name_en: 'Mathematics',     name_af: 'Wiskunde',           name_tn: 'Mmetse',         grades: [1,2,3,4,5,6,7,8,9,10,11,12], test_types: ['speed','problem_solving'] },
  { code: 'english',         name_en: 'English',          name_af: 'Engels',             name_tn: 'Sekgoa',         grades: [1,2,3,4,5,6,7,8,9,10,11,12], test_types: ['comprehension','vocabulary'] },
  { code: 'afrikaans',       name_en: 'Afrikaans',        name_af: 'Afrikaans',          name_tn: null,             grades: [1,2,3,4,5,6,7,8,9,10,11,12], test_types: ['comprehension','vocabulary'] },
  { code: 'setswana',        name_en: 'Setswana',         name_af: 'Setswana',           name_tn: 'Setswana',       grades: [1,2,3,4,5,6,7,8,9,10,11,12], test_types: ['comprehension','vocabulary'] },
  { code: 'natural_science', name_en: 'Natural Sciences', name_af: 'Natuurwetenskap',    name_tn: 'Saense ya Tlhago', grades: [4,5,6,7,8,9],              test_types: ['multiple_choice'] },
  { code: 'life_skills',     name_en: 'Life Skills',      name_af: 'Lewensvaardighede',  name_tn: 'Bokgoni jwa Botshelo', grades: [1,2,3],                test_types: ['multiple_choice'] },
];

async function seedSubjectsIfEmpty() {
  const count = await prisma.subjects.count();
  if (count > 0) return;
  for (const s of SUBJECTS_SEED) {
    await prisma.subjects.upsert({
      where: { code: s.code },
      update: {},
      create: { ...s, active: true },
    });
  }
  console.log('Seeded subjects table with', SUBJECTS_SEED.length, 'subjects');

  // Retroactively enroll existing children
  const allChildren = await prisma.children.findMany();
  for (const child of allChildren) {
    const matching = await prisma.subjects.findMany({
      where: { active: true, grades: { has: child.grade } },
    });
    for (const subj of matching) {
      await prisma.child_subjects.upsert({
        where: { child_id_subject_id: { child_id: child.id, subject_id: subj.id } },
        update: {},
        create: { child_id: child.id, subject_id: subj.id, status: 'active' },
      });
    }
  }
  console.log('Retroactively enrolled subjects for', allChildren.length, 'children');
}

app.listen(PORT, async () => {
  console.log(`BeeGraded API server running on port ${PORT}`);
  await seedSubjectsIfEmpty().catch(err => console.error('Subject seed error:', err));
});

export { prisma };
