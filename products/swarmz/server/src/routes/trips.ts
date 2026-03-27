import { Router, Response } from 'express';
import { PrismaClient, TripCategory, TripSource } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticate);

function getPrisma(req: AuthRequest): PrismaClient {
  return req.app.locals.prisma;
}

// SA tax year: March 1 - February 28/29
function getTaxYearDates(taxYear?: string): { start: Date; end: Date } {
  if (taxYear) {
    const [startYear] = taxYear.split('/').map(Number);
    return {
      start: new Date(`${startYear}-03-01`),
      end: new Date(`${startYear + 1}-02-28`),
    };
  }
  // Default to current tax year
  const now = new Date();
  const year = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1; // March = month 2
  return {
    start: new Date(`${year}-03-01`),
    end: new Date(`${year + 1}-02-28`),
  };
}

// GET /api/trips — list trips with filtering
router.get('/', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { category, tax_year, vehicle_id, source, limit, offset } = req.query;

  const { start, end } = getTaxYearDates(tax_year as string);

  const where: any = {
    userId: req.userId!,
    date: { gte: start, lte: end },
  };

  if (category) where.category = (category as string).toUpperCase();
  if (vehicle_id) where.vehicleId = vehicle_id as string;
  if (source) where.source = (source as string).toUpperCase();

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit as string) : 100,
      skip: offset ? parseInt(offset as string) : 0,
      include: {
        vehicle: { select: { id: true, name: true, registration: true } },
      },
    }),
    prisma.trip.count({ where }),
  ]);

  // Summary stats
  const allTrips = await prisma.trip.findMany({
    where: { userId: req.userId!, date: { gte: start, lte: end } },
    select: { distanceKm: true, isBusiness: true },
  });

  const totalKm = allTrips.reduce((sum, t) => sum + t.distanceKm, 0);
  const businessKm = allTrips.filter((t) => t.isBusiness).reduce((sum, t) => sum + t.distanceKm, 0);
  const privateKm = totalKm - businessKm;

  res.json({
    trips: trips.map((t) => ({
      id: t.id,
      vehicleId: t.vehicleId,
      vehicle: t.vehicle,
      date: t.date.toISOString().split('T')[0],
      origin: t.origin,
      destination: t.destination,
      distanceKm: t.distanceKm,
      category: t.category.toLowerCase(),
      isBusiness: t.isBusiness,
      odometerStart: t.odometerStart,
      odometerEnd: t.odometerEnd,
      purpose: t.purpose,
      client: t.client,
      startTime: t.startTime?.toISOString() || null,
      endTime: t.endTime?.toISOString() || null,
      durationMin: t.durationMin,
      source: t.source.toLowerCase(),
      fareAmount: t.fareAmount,
      originLat: t.originLat,
      originLng: t.originLng,
      destLat: t.destLat,
      destLng: t.destLng,
      createdAt: t.createdAt.toISOString(),
    })),
    total,
    summary: {
      totalTrips: allTrips.length,
      businessTrips: allTrips.filter((t) => t.isBusiness).length,
      privateTrips: allTrips.filter((t) => !t.isBusiness).length,
      totalKm: Math.round(totalKm * 10) / 10,
      businessKm: Math.round(businessKm * 10) / 10,
      privateKm: Math.round(privateKm * 10) / 10,
      businessPercent: totalKm > 0 ? Math.round((businessKm / totalKm) * 1000) / 10 : 0,
    },
  });
});

// GET /api/trips/summary — dashboard summary
router.get('/summary', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { tax_year, vehicle_id } = req.query;
  const { start, end } = getTaxYearDates(tax_year as string);

  const where: any = {
    userId: req.userId!,
    date: { gte: start, lte: end },
  };
  if (vehicle_id) where.vehicleId = vehicle_id as string;

  const trips = await prisma.trip.findMany({
    where,
    select: { distanceKm: true, isBusiness: true, date: true, vehicleId: true },
  });

  const totalKm = trips.reduce((sum, t) => sum + t.distanceKm, 0);
  const businessKm = trips.filter((t) => t.isBusiness).reduce((sum, t) => sum + t.distanceKm, 0);

  // Per-vehicle breakdown
  const vehicleMap = new Map<string, { total: number; business: number; trips: number }>();
  for (const t of trips) {
    if (!t.vehicleId) continue;
    const v = vehicleMap.get(t.vehicleId) || { total: 0, business: 0, trips: 0 };
    v.total += t.distanceKm;
    if (t.isBusiness) v.business += t.distanceKm;
    v.trips++;
    vehicleMap.set(t.vehicleId, v);
  }

  res.json({
    totalTrips: trips.length,
    totalKm: Math.round(totalKm * 10) / 10,
    businessKm: Math.round(businessKm * 10) / 10,
    privateKm: Math.round((totalKm - businessKm) * 10) / 10,
    businessPercent: totalKm > 0 ? Math.round((businessKm / totalKm) * 1000) / 10 : 0,
    byVehicle: Object.fromEntries(
      Array.from(vehicleMap.entries()).map(([vid, stats]) => [
        vid,
        {
          totalKm: Math.round(stats.total * 10) / 10,
          businessKm: Math.round(stats.business * 10) / 10,
          businessPercent: stats.total > 0 ? Math.round((stats.business / stats.total) * 1000) / 10 : 0,
          trips: stats.trips,
        },
      ])
    ),
  });
});

// POST /api/trips — create a trip
router.post('/', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const {
    vehicleId, date, origin, destination, distanceKm, category,
    odometerStart, odometerEnd, purpose, client,
    startTime, endTime, durationMin, source,
    originLat, originLng, destLat, destLng, routePolyline,
    fareAmount, fareCurrency,
  } = req.body;

  if (!date || !origin || !destination || !distanceKm) {
    throw new AppError('date, origin, destination, and distanceKm are required', 400);
  }

  // Auto-assign default vehicle if none provided
  let assignVehicleId = vehicleId;
  if (!assignVehicleId) {
    const defaultVehicle = await prisma.vehicle.findFirst({
      where: { userId: req.userId!, isDefault: true, isActive: true },
    });
    assignVehicleId = defaultVehicle?.id || null;
  }

  const cat = (category || 'BUSINESS').toUpperCase() as TripCategory;
  const isBusiness = cat === 'BUSINESS';

  const trip = await prisma.trip.create({
    data: {
      userId: req.userId!,
      vehicleId: assignVehicleId,
      date: new Date(date),
      origin,
      destination,
      distanceKm: parseFloat(distanceKm),
      category: cat,
      isBusiness,
      odometerStart: odometerStart ? parseInt(odometerStart) : null,
      odometerEnd: odometerEnd ? parseInt(odometerEnd) : null,
      purpose: purpose || null,
      client: client || null,
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      durationMin: durationMin ? parseInt(durationMin) : null,
      source: (source || 'MANUAL').toUpperCase() as TripSource,
      originLat: originLat ? parseFloat(originLat) : null,
      originLng: originLng ? parseFloat(originLng) : null,
      destLat: destLat ? parseFloat(destLat) : null,
      destLng: destLng ? parseFloat(destLng) : null,
      routePolyline: routePolyline || null,
      fareAmount: fareAmount ? parseFloat(fareAmount) : null,
      fareCurrency: fareCurrency || 'ZAR',
    },
  });

  res.status(201).json({
    id: trip.id,
    vehicleId: trip.vehicleId,
    date: trip.date.toISOString().split('T')[0],
    origin: trip.origin,
    destination: trip.destination,
    distanceKm: trip.distanceKm,
    category: trip.category.toLowerCase(),
    isBusiness: trip.isBusiness,
    source: trip.source.toLowerCase(),
    createdAt: trip.createdAt.toISOString(),
  });
});

// POST /api/trips/bulk — bulk import trips
router.post('/bulk', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { trips, vehicleId, source } = req.body;

  if (!Array.isArray(trips) || trips.length === 0) {
    throw new AppError('trips array is required', 400);
  }

  // Auto-assign default vehicle if none provided
  let assignVehicleId = vehicleId;
  if (!assignVehicleId) {
    const defaultVehicle = await prisma.vehicle.findFirst({
      where: { userId: req.userId!, isDefault: true, isActive: true },
    });
    assignVehicleId = defaultVehicle?.id || null;
  }

  const created = await prisma.trip.createMany({
    data: trips.map((t: any) => {
      const cat = (t.category || 'BUSINESS').toUpperCase() as TripCategory;
      return {
        userId: req.userId!,
        vehicleId: t.vehicleId || assignVehicleId,
        date: new Date(t.date),
        origin: t.origin,
        destination: t.destination,
        distanceKm: parseFloat(t.distanceKm),
        category: cat,
        isBusiness: cat === 'BUSINESS',
        odometerStart: t.odometerStart ? parseInt(t.odometerStart) : null,
        odometerEnd: t.odometerEnd ? parseInt(t.odometerEnd) : null,
        purpose: t.purpose || null,
        client: t.client || null,
        startTime: t.startTime ? new Date(t.startTime) : null,
        endTime: t.endTime ? new Date(t.endTime) : null,
        durationMin: t.durationMin ? parseInt(t.durationMin) : null,
        source: ((t.source || source || 'IMPORTED').toUpperCase()) as TripSource,
        originLat: t.originLat ? parseFloat(t.originLat) : null,
        originLng: t.originLng ? parseFloat(t.originLng) : null,
        destLat: t.destLat ? parseFloat(t.destLat) : null,
        destLng: t.destLng ? parseFloat(t.destLng) : null,
        fareAmount: t.fareAmount ? parseFloat(t.fareAmount) : null,
        fareCurrency: t.fareCurrency || 'ZAR',
      };
    }),
  });

  res.status(201).json({
    imported: created.count,
    vehicleId: assignVehicleId,
    source: (source || 'IMPORTED').toUpperCase(),
  });
});

// PUT /api/trips/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const existing = await prisma.trip.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) throw new AppError('Trip not found', 404);

  const { date, origin, destination, distanceKm, category, vehicleId, purpose, client, isBusiness } = req.body;

  const cat = category ? (category as string).toUpperCase() as TripCategory : undefined;

  const trip = await prisma.trip.update({
    where: { id: req.params.id },
    data: {
      ...(date && { date: new Date(date) }),
      ...(origin && { origin }),
      ...(destination && { destination }),
      ...(distanceKm !== undefined && { distanceKm: parseFloat(distanceKm) }),
      ...(cat && { category: cat, isBusiness: cat === 'BUSINESS' }),
      ...(isBusiness !== undefined && { isBusiness, category: isBusiness ? 'BUSINESS' : 'PRIVATE' }),
      ...(vehicleId !== undefined && { vehicleId }),
      ...(purpose !== undefined && { purpose }),
      ...(client !== undefined && { client }),
    },
  });

  res.json({
    id: trip.id,
    date: trip.date.toISOString().split('T')[0],
    origin: trip.origin,
    destination: trip.destination,
    distanceKm: trip.distanceKm,
    category: trip.category.toLowerCase(),
    isBusiness: trip.isBusiness,
  });
});

// DELETE /api/trips/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const existing = await prisma.trip.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) throw new AppError('Trip not found', 404);

  await prisma.trip.delete({ where: { id: req.params.id } });
  res.json({ message: 'Trip deleted' });
});

// POST /api/trips/bulk-assign-vehicle — assign unassigned trips to a vehicle
router.post('/bulk-assign-vehicle', async (req: AuthRequest, res: Response) => {
  const prisma = getPrisma(req);
  const { vehicleId } = req.body;

  if (!vehicleId) throw new AppError('vehicleId is required', 400);

  const result = await prisma.trip.updateMany({
    where: { userId: req.userId!, vehicleId: null },
    data: { vehicleId },
  });

  res.json({ updated: result.count });
});

export default router;
