import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticate);

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// SA tax year: March 1 - February 28/29
function getTaxYearDates(taxYear?: string): { start: Date; end: Date; label: string } {
  if (taxYear) {
    const [startYear] = taxYear.split('/').map(Number);
    return {
      start: new Date(`${startYear}-03-01`),
      end: new Date(`${startYear + 1}-02-28`),
      label: taxYear,
    };
  }
  const now = new Date();
  const year = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
  return {
    start: new Date(`${year}-03-01`),
    end: new Date(`${year + 1}-02-28`),
    label: `${year}/${year + 1}`,
  };
}

function daysBetween(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

// GET /api/sars/cost-scale?tax_year=2025/2026
router.get('/cost-scale', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { tax_year } = req.query;
  const { label } = getTaxYearDates(tax_year as string);

  const brackets = await prisma.sarsCostScale.findMany({
    where: { taxYear: label },
    orderBy: { minValue: 'asc' },
  });

  res.json({
    taxYear: label,
    brackets: brackets.map((b) => ({
      minValue: b.minValue,
      maxValue: b.maxValue,
      fixedCostPa: b.fixedCostPa,
      fuelCostPerKm: b.fuelCostPerKm,
      maintenanceCostPerKm: b.maintenanceCostPerKm,
    })),
  });
});

// GET /api/sars/vehicle/:id — SARS calculations for a specific vehicle
router.get('/vehicle/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { tax_year } = req.query;
  const { start, end, label } = getTaxYearDates(tax_year as string);

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  // Get trips for this vehicle in tax year
  const trips = await prisma.trip.findMany({
    where: { vehicleId: vehicle.id, date: { gte: start, lte: end } },
    select: { distanceKm: true, isBusiness: true },
  });

  const totalKm = trips.reduce((sum, t) => sum + t.distanceKm, 0);
  const businessKm = trips.filter((t) => t.isBusiness).reduce((sum, t) => sum + t.distanceKm, 0);
  const businessPercent = totalKm > 0 ? (businessKm / totalKm) * 100 : 0;

  // Calculate use days (pro-rata)
  const useStart = vehicle.useStartDate && vehicle.useStartDate >= start ? vehicle.useStartDate : start;
  const useEnd = vehicle.useEndDate && vehicle.useEndDate <= end ? vehicle.useEndDate : end;
  const useDays = daysBetween(useStart, useEnd);
  const totalDaysInYear = daysBetween(start, end);

  let fixedCostMethod = null;

  if (vehicle.type === 'OWNED' && vehicle.fixedCostPa) {
    // SARS Fixed Cost Method
    const proratedFixedCost = (vehicle.fixedCostPa * useDays) / totalDaysInYear;
    const fuelDeemed = (vehicle.fuelCostPerKm || 0) * totalKm;
    const maintDeemed = (vehicle.maintenanceCostPerKm || 0) * totalKm;
    const deemedCost = proratedFixedCost + fuelDeemed + maintDeemed;
    const deduction = deemedCost * (businessPercent / 100);

    fixedCostMethod = {
      fixedCostPa: vehicle.fixedCostPa,
      proratedFixedCost: Math.round(proratedFixedCost * 100) / 100,
      fuelCostPerKm: vehicle.fuelCostPerKm,
      fuelDeemed: Math.round(fuelDeemed * 100) / 100,
      maintenanceCostPerKm: vehicle.maintenanceCostPerKm,
      maintenanceDeemed: Math.round(maintDeemed * 100) / 100,
      deemedCost: Math.round(deemedCost * 100) / 100,
      businessPercent: Math.round(businessPercent * 10) / 10,
      deduction: Math.round(deduction * 100) / 100,
      useDays,
      totalDaysInYear,
    };
  }

  // SARS Actual Cost Method — sum all expenses for this vehicle
  const expenses = await prisma.vehicleExpense.findMany({
    where: { vehicleId: vehicle.id, date: { gte: start, lte: end } },
    select: { category: true, amount: true },
  });

  const actualCostByCategory: Record<string, number> = {};
  for (const e of expenses) {
    const cat = e.category.toLowerCase();
    actualCostByCategory[cat] = (actualCostByCategory[cat] || 0) + e.amount;
  }
  const totalActualCost = expenses.reduce((sum, e) => sum + e.amount, 0);
  const actualDeduction = totalActualCost * (businessPercent / 100);

  const actualCostMethod = {
    totalActualCost: Math.round(totalActualCost * 100) / 100,
    byCategory: actualCostByCategory,
    businessPercent: Math.round(businessPercent * 10) / 10,
    deduction: Math.round(actualDeduction * 100) / 100,
  };

  // Comparison — which method wins?
  const fixedDeduction = fixedCostMethod?.deduction || 0;
  const actualDeductionAmt = actualCostMethod.deduction;
  const winner = fixedDeduction >= actualDeductionAmt ? 'fixed_cost' : 'actual_cost';
  const difference = Math.abs(fixedDeduction - actualDeductionAmt);

  res.json({
    vehicle: {
      id: vehicle.id,
      name: vehicle.name,
      registration: vehicle.registration,
      type: vehicle.type.toLowerCase(),
      purchasePrice: vehicle.purchasePrice,
    },
    taxYear: label,
    km: {
      total: Math.round(totalKm * 10) / 10,
      business: Math.round(businessKm * 10) / 10,
      private: Math.round((totalKm - businessKm) * 10) / 10,
      businessPercent: Math.round(businessPercent * 10) / 10,
      tripCount: trips.length,
    },
    fixedCostMethod,
    actualCostMethod,
    comparison: {
      winner,
      fixedDeduction: Math.round(fixedDeduction * 100) / 100,
      actualDeduction: Math.round(actualDeductionAmt * 100) / 100,
      difference: Math.round(difference * 100) / 100,
      recommendation: winner === 'fixed_cost'
        ? `Fixed Cost Method wins by R${difference.toFixed(2)} — recommend Fixed Cost`
        : `Actual Cost Method wins by R${difference.toFixed(2)} — recommend Actual Cost`,
    },
  });
});

// GET /api/sars/summary — year-end summary across all vehicles
router.get('/summary', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { tax_year } = req.query;
  const { start, end, label } = getTaxYearDates(tax_year as string);

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: req.userId! },
    orderBy: { isActive: 'desc' },
  });

  const vehicleSummaries = [];
  let totalDeduction = 0;

  for (const v of vehicles) {
    const trips = await prisma.trip.findMany({
      where: { vehicleId: v.id, date: { gte: start, lte: end } },
      select: { distanceKm: true, isBusiness: true },
    });

    if (trips.length === 0 && v.type === 'OWNED' && !v.rentalTotal) continue;

    const totalKm = trips.reduce((sum, t) => sum + t.distanceKm, 0);
    const businessKm = trips.filter((t) => t.isBusiness).reduce((sum, t) => sum + t.distanceKm, 0);
    const businessPercent = totalKm > 0 ? (businessKm / totalKm) * 100 : 0;

    let deduction = 0;
    let method = 'none';

    if (v.type === 'OWNED' && v.fixedCostPa) {
      const useStart = v.useStartDate && v.useStartDate >= start ? v.useStartDate : start;
      const useEnd = v.useEndDate && v.useEndDate <= end ? v.useEndDate : end;
      const useDays = daysBetween(useStart, useEnd);
      const totalDays = daysBetween(start, end);

      const proratedFixed = (v.fixedCostPa * useDays) / totalDays;
      const fuel = (v.fuelCostPerKm || 0) * totalKm;
      const maint = (v.maintenanceCostPerKm || 0) * totalKm;
      const deemed = proratedFixed + fuel + maint;
      const fixedDeduction = deemed * (businessPercent / 100);

      // Also check actual cost
      const expenses = await prisma.vehicleExpense.findMany({
        where: { vehicleId: v.id, date: { gte: start, lte: end } },
        select: { amount: true },
      });
      const actualTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
      const actualDeduction = actualTotal * (businessPercent / 100);

      if (fixedDeduction >= actualDeduction) {
        deduction = fixedDeduction;
        method = 'fixed_cost';
      } else {
        deduction = actualDeduction;
        method = 'actual_cost';
      }
    } else if (v.type === 'RENTAL' && v.rentalTotal) {
      // Rental: full cost × business %
      deduction = v.rentalTotal * (businessPercent / 100);
      method = 'rental';
    }

    totalDeduction += deduction;

    vehicleSummaries.push({
      id: v.id,
      name: v.name,
      registration: v.registration,
      type: v.type.toLowerCase(),
      isActive: v.isActive,
      totalKm: Math.round(totalKm * 10) / 10,
      businessKm: Math.round(businessKm * 10) / 10,
      businessPercent: Math.round(businessPercent * 10) / 10,
      method,
      deduction: Math.round(deduction * 100) / 100,
    });
  }

  // Add standalone expenses (not tied to vehicle deduction, e.g. roadworthy for new vehicle)
  const standaloneExpenses = await prisma.vehicleExpense.findMany({
    where: {
      userId: req.userId!,
      date: { gte: start, lte: end },
      vehicle: { type: 'OWNED', fixedCostPa: null },
    },
    select: { amount: true },
  });
  const standaloneTotal = standaloneExpenses.reduce((sum, e) => sum + e.amount, 0);

  res.json({
    taxYear: label,
    vehicles: vehicleSummaries,
    totalVehicleDeduction: Math.round(totalDeduction * 100) / 100,
    additionalExpenses: Math.round(standaloneTotal * 100) / 100,
    grandTotal: Math.round((totalDeduction + standaloneTotal) * 100) / 100,
  });
});

// POST /api/sars/lookup-bracket — find SARS bracket for a vehicle value
router.post('/lookup-bracket', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { purchasePrice, taxYear } = req.body;

  if (!purchasePrice) throw new AppError('purchasePrice is required', 400);

  const price = parseFloat(purchasePrice);
  const year = taxYear || getTaxYearDates().label;

  const bracket = await prisma.sarsCostScale.findFirst({
    where: {
      taxYear: year,
      minValue: { lte: price },
      OR: [
        { maxValue: { gte: price } },
        { maxValue: null },
      ],
    },
  });

  if (!bracket) throw new AppError('No SARS bracket found for this value', 404);

  res.json({
    taxYear: year,
    purchasePrice: price,
    bracket: {
      minValue: bracket.minValue,
      maxValue: bracket.maxValue,
      fixedCostPa: bracket.fixedCostPa,
      fuelCostPerKm: bracket.fuelCostPerKm,
      maintenanceCostPerKm: bracket.maintenanceCostPerKm,
    },
  });
});

export default router;
