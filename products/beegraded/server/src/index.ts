import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import evaluationRoutes from './routes/evaluations.js';
import paperRoutes from './routes/papers.js';
import comparisonRoutes from './routes/comparisons.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
