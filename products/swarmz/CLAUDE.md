# CLAUDE.md — Swarmz

---
## ⚠️ CRITICAL RULES — READ BEFORE DOING ANYTHING ⚠️

### DO NOT TOUCH THE AUTH SYSTEM
The shared auth-api is deployed and working. See the root `CLAUDE.md` for details.
- DO NOT modify `packages/auth-api/`
- DO NOT seed users or reset passwords
- DO NOT restart `saas-auth-api-1`
- All 3 users exist with password `Beez2026!`

### MIDDLEWARE ARCHITECTURE
```
Frontend (Quasar SPA)
  ├── calls Express/Prisma API for ALL data operations
  └── n8n ONLY for AI calls (receipt OCR via Gemini) — no DB access from n8n
```
n8n does NOT touch the database. Express/Prisma handles ALL DB reads and writes.

### QUALITY STANDARDS
- Always handle loading states AND error states in UI
- Test before deploying — verify the feature works locally first
- Don't break what's already working — read existing code before changing it
- Keep it simple — no over-engineering, no premature abstractions
- No credentials in code — use .env files, never hardcode passwords/keys
- Pollenz handles all finance/accounting — Swarmz tracks vehicle costs ONLY for fleet ops, NOT general accounting

---

## Overview

**Swarmz** — Fleet operations management for South African vehicle owners and small fleet operators. Track vehicle status changes, scan receipts, monitor costs per vehicle.

- **Domain:** swarmz.co.za
- **Dev port:** 8092
- **Mode:** SPA (hash routing)

## Stack

| Layer | Tech | Location | Purpose |
|-------|------|----------|---------|
| Frontend | Quasar SPA (Vue 3 + TS) | `src/` | UI, user interaction |
| Backend API | Express + Prisma | `server/` (TBD) | DB operations |
| Auth | Shared auth-api | `packages/auth-api/` | JWT login/register/refresh |
| Database | PostgreSQL | `swarmz` DB | Vehicles, status logs, drivers, receipts |

## What's Built & Working

### Frontend Pages
| Page | Route | Status |
|------|-------|--------|
| Login | `/auth/login` | ✅ Working |
| Register | `/auth/register` | ✅ Working |
| Dashboard | `/` | ✅ Working |
| Add vehicle | `/vehicle/add` | ✅ Working |
| Vehicle detail | `/vehicle/:id` | ✅ Working |
| Status change | `/vehicle/:id/status` | ✅ Working |
| Receipt archive | `/vehicle/:id/receipts` | ✅ Working |
| Drivers | `/drivers` | ✅ Working |
| Profile | `/profile` | ✅ Working |

### Pinia Stores
| Store | Location | Purpose |
|-------|----------|---------|
| `auth.ts` | `src/stores/auth.ts` | Login, logout, refresh, user state |
| `vehicles.ts` | `src/stores/vehicles.ts` | Vehicle CRUD, status tracking |
| `statusLog.ts` | `src/stores/statusLog.ts` | Status change history |
| `drivers.ts` | `src/stores/drivers.ts` | Driver management |

## Auth Integration
- Pinia store: `src/stores/auth.ts`
- localStorage keys: `accessToken` (NOTE: not prefixed — consider migrating to `sz_access_token`)
- Boot file: `src/boot/axios.ts` attaches JWT
- Login/register pages in AuthLayout

## Key Concepts

- **Status-based tracking**: Every vehicle action is a status change: available, out, fueling, service, repair, cleaning, accident, towed
- **Receipt scanning**: Camera capture on status change, OCR via Gemini Vision (planned)
- **Cost dashboard**: Per-vehicle and fleet-wide cost breakdown by category
- **Solo vs Fleet**: Solo = 1 vehicle personal use, Fleet = multiple vehicles + driver management

## Build & Deploy
```bash
# Dev
pnpm dev:swarmz

# Build
cd products/swarmz && npx quasar build

# Deploy frontend
# SFTP dist/spa/ → /opt/saas/swarmz/frontend-dist/
```

## Server
- Frontend: `/opt/saas/swarmz/frontend-dist/` (nginx serves static)
- Backend: TBD (currently demo/mock mode — Express/Prisma backend not yet built)
- DB: `swarmz` schema on `saas-postgres-1` (not yet created)

## What Needs Building

### Backend (Priority)
- Express + Prisma API (follow Broodz pattern in `products/broodz/server/`)
- Prisma schema: Vehicle, StatusLog, Driver, Receipt, CostEntry
- REST endpoints: vehicles CRUD, status changes, driver assignment, receipt upload

### Frontend Enhancements
- Receipt OCR integration (Gemini Vision via n8n webhook)
- Cost dashboard with charts (per vehicle, per category, fleet totals)
- Fleet view — map or list of all vehicles with current status
- Driver assignment workflow
- Reporting / export

### Infrastructure
- Migrate localStorage keys from `accessToken` → `sz_access_token` pattern
- Set up pm2 process for backend API
- nginx proxy for `/api` → backend port

## Important Context
- Login and adding vehicles has been tested and works
- Currently runs in demo/mock mode — no persistent backend yet
- Pollenz handles accounting/finances — Swarmz only tracks fleet-related vehicle costs
- Swarmz was originally called "Fleetz" — that name is retired, use "Swarmz" everywhere
