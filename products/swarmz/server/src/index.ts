import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import vehicleRoutes from './routes/vehicles.js';
import statusLogRoutes from './routes/statusLog.js';
import driverRoutes from './routes/drivers.js';
import tripRoutes from './routes/trips.js';
import vehicleExpenseRoutes from './routes/vehicleExpenses.js';
import sarsRoutes from './routes/sars.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Make prisma available to routes
app.locals.prisma = prisma;

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
// Auth handled by shared auth-api (saas-auth-api-1) — nginx proxies /auth/* to port 3100
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/status-log', statusLogRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/vehicle-expenses', vehicleExpenseRoutes);
app.use('/api/sars', sarsRoutes);

// Error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Swarmz API server running on port ${PORT}`);
});

export { prisma };
