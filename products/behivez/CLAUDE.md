# CLAUDE.md — BeHivez (Admin Dashboard)

---
## ⚠️ CRITICAL RULES — READ BEFORE DOING ANYTHING ⚠️

### DO NOT TOUCH THE AUTH SYSTEM
The shared auth-api is deployed and working. See the root `CLAUDE.md` for details.
- DO NOT modify `packages/auth-api/`
- DO NOT seed users or reset passwords
- DO NOT restart `saas-auth-api-1`

### THIS IS THE HEAD OFFICE
BeHivez at behivez.co.za is the central admin dashboard for ALL products. It manages users, subscriptions, health monitoring, and cross-product oversight. Changes here affect the entire ecosystem.

### QUALITY STANDARDS
- Always handle loading states AND error states in UI
- Test before deploying — verify the feature works locally first
- Don't break what's already working — read existing code before changing it
- Keep it simple — no over-engineering, no premature abstractions

---

## Overview

**BeHivez** — Central admin dashboard and public landing page for the BeHivez SaaS ecosystem.

- **Domain:** behivez.co.za
- **Dev port:** 8095
- **Mode:** SPA (hash routing)

## Stack

| Layer | Tech | Purpose |
|-------|------|---------|
| Frontend | Quasar SPA (Vue 3 + TS) | Admin UI + landing page |
| Auth | Shared auth-api | JWT login, role-gated access |
| Admin API | auth-api `/admin/*` endpoints | User CRUD, stats, health, subscriptions |

No dedicated backend — all admin endpoints are on the shared auth-api.

## Routes

### Public
| Route | Page | Purpose |
|-------|------|---------|
| `/` | LandingPage | Product showcase, public |

### Admin (requires OWNER or ADMIN role)
| Route | Page | Purpose |
|-------|------|---------|
| `/admin/login` | LoginPage | Admin login (no layout) |
| `/admin/dashboard` | DashboardPage | Stats, health overview |
| `/admin/users` | UsersPage | User list with search/filter |
| `/admin/users/:id` | UserDetailPage | Edit user, manage subscriptions |
| `/admin/health` | HealthPage | Product health monitoring |

## Auth Integration
- Pinia store: `src/stores/auth.ts`
- localStorage keys: `bh_access_token`, `bh_refresh_token`, `bh_user`
- Boot file: `src/boot/auth.ts` — axios interceptors for JWT + refresh
- Router guard: checks localStorage for token + OWNER/ADMIN role
- Only OWNER and ADMIN roles can access `/admin/*` routes

## Key Stores
- `src/stores/auth.ts` — Login, logout, refresh, isAdmin getter
- `src/stores/admin.ts` — All admin API calls (users, stats, health, subscriptions)

## Admin API Endpoints (on auth-api)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/stats` | Dashboard statistics |
| GET | `/admin/health` | Product health pings |
| GET | `/admin/users` | List users (search, role, product filters) |
| GET | `/admin/users/:id` | User detail with subscriptions |
| PATCH | `/admin/users/:id` | Update user role/name |
| POST | `/admin/users` | Create new user |
| POST | `/admin/users/:id/subscriptions` | Add subscription |
| PATCH | `/admin/users/:id/subscriptions/:subId` | Update subscription |
| DELETE | `/admin/users/:id/subscriptions/:subId` | Remove subscription |

## Build & Deploy
```bash
# Dev
pnpm dev:landing

# Build
cd products/behivez && npx quasar build

# Deploy frontend
# SFTP dist/spa/ → /opt/saas/behivez/frontend-dist/
```

## Important Notes
- The landing page at `/` is public and shows all 5 products
- Admin routes are behind role-based guards — non-admin users see "Access denied"
- Health monitoring auto-refreshes every 30 seconds
- The admin store re-fetches user data after subscription changes to stay in sync
- Quasar app-vite v2 requires `src/stores/index.ts` to bootstrap Pinia — do NOT delete this file
