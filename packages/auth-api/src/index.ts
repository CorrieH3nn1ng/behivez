import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3100;

// Middleware
app.use(cors());
app.use(express.json());

// Make prisma available to routes
app.locals.prisma = prisma;

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-api', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`BeHivez Auth API running on port ${PORT}`);
});

export { prisma };
