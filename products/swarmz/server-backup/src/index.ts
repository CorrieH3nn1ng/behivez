import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import vehicleRoutes from './routes/vehicles.js';
import rentalRoutes from './routes/rentals.js';
import inspectionRoutes from './routes/inspections.js';
import walkInRoutes from './routes/walkins.js';
import reportRoutes from './routes/reports.js';
import syncRoutes from './routes/sync.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make prisma available to routes
app.locals.prisma = prisma;

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/walkins', walkInRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sync', syncRoutes);

// Error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Fleetz API server running on port ${PORT}`);
});

export { prisma };
