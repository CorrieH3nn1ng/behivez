# CLAUDE.md — Broodz

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
  └── n8n ONLY for AI calls (if any) — no DB access from n8n
```
n8n does NOT touch the database. Express/Prisma handles ALL DB reads and writes.

### QUALITY STANDARDS
- Always handle loading states AND error states in UI
- Test before deploying — verify the feature works locally first
- Don't break what's already working — read existing code before changing it
- Keep it simple — no over-engineering, no premature abstractions
- No credentials in code — use .env files, never hardcode passwords/keys

---

## Overview

**Broodz** — South African talent marketplace. Artists create profiles, showcase services, build galleries/shops, and get discovered by clients.

- **Domain:** broodz.co.za
- **Dev port:** 8093 (frontend), 3200 (backend API)
- **Mode:** SPA (hash routing) — SSR planned for SEO on public profile pages

## Stack

| Layer | Tech | Location | Purpose |
|-------|------|----------|---------|
| Frontend | Quasar SPA (Vue 3 + TS) | `src/` | UI, user interaction |
| Backend API | Express + Prisma | `server/` | ALL DB operations, `/api/*` |
| Auth | Shared auth-api | `packages/auth-api/` | JWT login/register/refresh |
| Database | PostgreSQL | `broodz` DB | Talents, services, media, products, enquiries |

## What's Built & Working

### Frontend Pages
| Page | Route | Status |
|------|-------|--------|
| Landing | `/` | ✅ Live |
| Category browse | `/category/:slug` | ✅ Live |
| Talent profile (public) | `/:slug` | ✅ Live |
| Talent gallery | `/:slug/gallery` | ✅ Live |
| Login | `/login` | ✅ Live |
| Forgot/Reset password | `/forgot-password`, `/reset-password` | ✅ Live |
| Change password | `/change-password` | ✅ Live (auth required) |
| Dashboard home | `/dashboard` | ✅ Live |
| Profile editor | `/dashboard/profile` | ✅ Live |
| Services editor | `/dashboard/services` | ✅ Live |
| Portfolio editor | `/dashboard/portfolio` | ✅ Live |
| Shop editor | `/dashboard/shop` | ✅ Live |
| Enquiries | `/dashboard/enquiries` | ✅ Live |
| Account settings | `/dashboard/account` | ✅ Live |

### Backend API Routes
| Route file | Endpoints | Purpose |
|------------|-----------|---------|
| `server/src/routes/talent.ts` | Talent CRUD | Profile management |
| `server/src/routes/services.ts` | Service CRUD | Service listings |
| `server/src/routes/media.ts` | Media upload/manage | Gallery & portfolio |
| `server/src/routes/products.ts` | Product CRUD | Shop items |
| `server/src/routes/enquiries.ts` | Enquiry handling | Client enquiries |
| `server/src/routes/public.ts` | Public endpoints | Profile views, search |

## Auth Integration
- Pinia store: `src/stores/auth.ts`
- localStorage keys: `bz_access_token`, `bz_refresh_token`, `bz_user`
- Boot file: `src/boot/axios.ts` attaches JWT
- Login/register: `/login` page
- Password flows: forgot, reset, change — all integrated

## Key Stores
- `src/stores/auth.ts` — Login, logout, refresh, user state
- `src/stores/talent.ts` — Talent profile CRUD, services, media

## Build & Deploy
```bash
# Dev
pnpm dev:broodz

# Build
cd products/broodz && npx quasar build

# Deploy frontend
# SFTP dist/spa/ → /opt/saas/broodz/frontend-dist/

# Backend runs as pm2 process 'broodz-api' on port 3200
# nginx proxies /api → port 3200
```

## Server
- Frontend: `/opt/saas/broodz/frontend-dist/` (nginx serves static)
- Backend: port 3200, pm2 process `broodz-api`, nginx proxies `/api`
- DB: `broodz` schema on `saas-postgres-1`

## What Needs Building
- **Gallery & video editing** — enhanced media management for talent portfolios
- **SSR for public profiles** — SEO: server-rendered artist pages with meta tags, structured data, sitemap
- **Content pipeline** — automated content creation for artists
- **WhatsApp integration** — enquiry notifications via WhatsApp

## Important Context
- Maggie (test talent) can log in, edit her profile — this is confirmed working
- Public profile pages need SEO (SSR migration planned)
- The Express/Prisma backend at `server/` is the ONLY data layer — no n8n DB access
