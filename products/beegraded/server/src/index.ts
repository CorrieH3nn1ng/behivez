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
import { errorHandler } from './middleware/errorHandler.js';

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

// Error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`BeeGraded API server running on port ${PORT}`);
});

export { prisma };
