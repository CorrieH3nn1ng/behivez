import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get reports
router.get(
  '/',
  authenticate,
  requireRole('ADMIN', 'MANAGER'),
  async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.locals.prisma;
    const { from, to } = req.query;

    const dateFrom = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = to ? new Date(to as string) : new Date();

    const branchFilter = req.userRole !== 'ADMIN' ? { branchId: req.branchId } : {};

    // Total rentals in period
    const totalRentals = await prisma.rental.count({
      where: {
        status: 'COMPLETED',
        actualEndDate: { gte: dateFrom, lte: dateTo },
        ...branchFilter,
      },
    });

    // Vehicles count
    const totalVehicles = await prisma.vehicle.count({
      where: {
        status: { not: 'INACTIVE' },
        ...branchFilter,
      },
    });

    // Rental days in period
    const rentals = await prisma.rental.findMany({
      where: {
        status: { in: ['ACTIVE', 'COMPLETED'] },
        actualStartDate: { lte: dateTo },
        OR: [
          { actualEndDate: null },
          { actualEndDate: { gte: dateFrom } },
        ],
        ...branchFilter,
      },
      select: {
        actualStartDate: true,
        actualEndDate: true,
      },
    });

    // Calculate utilization
    const periodDays = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    const totalPossibleDays = totalVehicles * periodDays;

    let totalRentalDays = 0;
    rentals.forEach((r) => {
      if (r.actualStartDate) {
        const start = r.actualStartDate > dateFrom ? r.actualStartDate : dateFrom;
        const end = r.actualEndDate && r.actualEndDate < dateTo ? r.actualEndDate : dateTo;
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        totalRentalDays += Math.max(0, days);
      }
    });

    const utilization = totalPossibleDays > 0
      ? Math.round((totalRentalDays / totalPossibleDays) * 100)
      : 0;

    // By category
    const categories = await prisma.vehicleCategory.findMany();
    const byCategory = await Promise.all(
      categories.map(async (cat) => {
        const catVehicles = await prisma.vehicle.count({
          where: { categoryId: cat.id, status: { not: 'INACTIVE' }, ...branchFilter },
        });

        const catRentals = await prisma.rental.findMany({
          where: {
            categoryId: cat.id,
            status: { in: ['ACTIVE', 'COMPLETED'] },
            actualStartDate: { lte: dateTo },
            OR: [
              { actualEndDate: null },
              { actualEndDate: { gte: dateFrom } },
            ],
            ...branchFilter,
          },
        });

        const catPossibleDays = catVehicles * periodDays;
        let catRentalDays = 0;
        catRentals.forEach((r) => {
          if (r.actualStartDate) {
            const start = r.actualStartDate > dateFrom ? r.actualStartDate : dateFrom;
            const end = r.actualEndDate && r.actualEndDate < dateTo ? r.actualEndDate : dateTo;
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            catRentalDays += Math.max(0, days);
          }
        });

        return {
          name: cat.name,
          utilization: catPossibleDays > 0
            ? Math.round((catRentalDays / catPossibleDays) * 100)
            : 0,
        };
      })
    );

    // Walk-ins
    const walkIns = await prisma.walkInLog.findMany({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
        ...branchFilter,
      },
    });

    const walkInStats = {
      total: walkIns.length,
      converted: walkIns.filter((w) => w.outcome === 'CONVERTED').length,
      lost: walkIns.filter((w) => w.outcome === 'LOST').length,
      conversionRate: walkIns.length > 0
        ? Math.round(
            (walkIns.filter((w) => w.outcome === 'CONVERTED').length / walkIns.length) * 100
          )
        : 0,
    };

    res.json({
      utilization,
      totalRentals,
      byCategory: byCategory.filter((c) => c.utilization > 0 || c.name),
      walkIns: walkInStats,
    });
  }
);

export default router;
