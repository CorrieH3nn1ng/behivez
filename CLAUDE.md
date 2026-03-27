# CLAUDE.md — BeHivez Monorepo

---
## ⚠️ CRITICAL — READ BEFORE DOING ANYTHING ⚠️

### DO NOT TOUCH THE AUTH SYSTEM
**It is working. It is deployed. It is live.**

- DO NOT run any scripts against the `behivez_auth` database
- DO NOT reset passwords, seed users, or modify the `User` table
- DO NOT redeploy, restart, or modify `saas-auth-api-1`
- DO NOT create scripts that touch auth
- If login doesn't work, it's a frontend/cache issue, NOT a DB issue

**All users exist. All passwords are `Beez2026!`. Auth login returns 200 with valid JWT. CONFIRMED.**

### MIDDLEWARE ARCHITECTURE — ALL PRODUCTS

```
Frontend (Quasar SPA/SSR)
  ├── calls n8n webhooks for AI processing ONLY
  │     └── n8n calls AI APIs (Gemini, Claude), returns JSON. NO DB ACCESS. EVER.
  │
  └── calls Express/Prisma API (or Laravel for Pollenz) for ALL data operations
        └── Backend reads/writes to PostgreSQL. This is the ONLY DB layer.
```

**n8n MUST NEVER:** query the database, insert/update/delete rows, or store data.
**n8n ONLY:** receives data, calls AI APIs, transforms/processes, returns JSON.

This applies to ALL products. No exceptions.

### NO DESTRUCTIVE DATABASE OPERATIONS WITHOUT PERMISSION

**NEVER execute any of these without the user's explicit approval:**
- `DROP TABLE`, `TRUNCATE`, `DELETE FROM` (bulk deletes)
- `prisma migrate reset`, `prisma db push --force-reset`
- `php artisan migrate:fresh`, `php artisan db:seed` (full reseed)
- Python/bash scripts that clear or flush databases
- Any operation that destroys existing data

**If something is broken, INVESTIGATE — don't wipe and start over.** Read the error, check the schema, debug the query. "Starting fresh" is not a fix — it destroys test data and real work that takes hours to rebuild.

If you genuinely believe a reset is the only option, **explain why and ask first.** This applies to ALL databases: `behivez_auth`, `beegraded`, `broodz`, `swarmz`, `pollenz`.

### BUILD FOR SERVER FIRST — NO LOCAL-ONLY CODE

**There are no local users. The server is the only environment that matters right now.**

- ALL API URLs must work on the **server** (production domains via nginx proxy), not `localhost`
- Auth calls go to `/auth/*` (relative path — nginx proxies to `saas-auth-api-1:3100`)
- Backend API calls go to `/api/*` (relative path — nginx proxies to the product's Express server)
- **DO NOT** hardcode `localhost:3000`, `localhost:3100`, or any local port in production code
- **DO NOT** create separate local auth servers when the shared auth API already handles it
- `.env` files with `VITE_API_URL=http://localhost:...` are for **future local dev only** — the deployed build must use relative paths or production URLs
- If something works on the server, **leave it alone**. Local dev setup comes later.

**The pattern that works (Broodz, Pollenz):**
```
axios baseURL = '/auth'    ← nginx proxies to shared auth API
axios baseURL = '/api'     ← nginx proxies to product backend
```

**The pattern that breaks (Swarmz currently):**
```
axios baseURL = 'http://localhost:3000/api'  ← doesn't exist on server
```

### QUALITY STANDARDS — DEADLINE APRIL 1, 2026

Every change must follow these rules:

1. **Error states are mandatory.** If an API call can fail, show the user an error message — not a blank screen or infinite spinner. Use `q-banner` with `bg-red-1 text-red-8` or `Notify.create({ type: 'negative' })`.

2. **Test before you deploy.** After building, verify the core user flow works locally before pushing to production. Don't deploy blind.

3. **Don't break what works.** Before modifying a working feature, understand the existing code first. Read the file before editing.

4. **Keep it simple.** Don't over-engineer. Don't add abstractions, utilities, or config for hypothetical futures. Build what's needed now.

5. **No credentials in code.** Server passwords, API keys, DB connection strings go in `.env` files (gitignored). Never hardcode them.

6. **Commit after milestones.** When a feature works, commit it. Don't accumulate hours of uncommitted work.

---

## Overview
BeHivez — a hive of SaaS tools for South African entrepreneurs. pnpm workspace monorepo.

## Products — Current Status (March 2026)

| Product | Package | Port | Domain | Mode | Status |
|---------|---------|------|--------|------|--------|
| BeeGraded | @behivez/beegraded | 8090 | beegraded.co.za | SPA | **Deployed** — upload/eval works, comparison/guide in progress |
| Pollenz | @behivez/pollenz | 8091 | pollenz.co.za | SPA | **Deployed** — invoicing works |
| Swarmz | @behivez/swarmz | 8092 | swarmz.co.za | SPA | **Deployed** — login/vehicles work, more features needed |
| Broodz | @behivez/broodz | 8093 | broodz.co.za | SSR | **Deployed** — full MVP, gallery/video editing in progress |
| BeHivez | @behivez/landing | 8095 | behivez.co.za | SPA | **Deployed** — landing + admin dashboard live |

## Product-Specific Instructions

Each product has its own `CLAUDE.md` in its folder. **When working on a specific product, read that file first.** It contains:
- Architecture specific to that product
- What's working and what's not
- Backend details (Express/Prisma, Laravel, n8n webhooks)
- Deploy instructions

## Commands

```bash
pnpm dev:beegraded     # Start BeeGraded on port 8090
pnpm dev:pollenz       # Start Pollenz on port 8091
pnpm dev:swarmz        # Start Swarmz on port 8092
pnpm dev:broodz        # Start Broodz SSR on port 8093
pnpm dev:landing       # Start landing page on port 8095
```

## Structure

```
products/          # Each product is a Quasar app (with its own CLAUDE.md)
packages/          # Shared code
  auth-api/        # Shared auth service (Express + Prisma, port 3100)
  auth-client/     # Shared auth client library
  behivez-theme/   # Shared brand/styles (amber/cream theme)
server-config/     # nginx configs, docker-compose, SSL scripts
```

## Server (165.73.87.181 / hivebackbone02.dedicated.co.za)

- Docker proxy handles ALL domains on ports 80/443
- Shared PostgreSQL (`saas-postgres-1`), one DB per product
- Shared n8n instance (webhook prefixes: bg-, pz-, sz-, bz-)
- SPAs served from `/opt/saas/{product}/frontend-dist/`
- Broodz SSR: `/opt/saas/broodz/ssr-dist/` (Node.js + nginx proxy)
- Auth API: `saas-auth-api-1` (port 3100)

### Server Connection (USE THIS — DO NOT GUESS)

**SSH (via paramiko in Python):**
```python
import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('hivebackbone02.dedicated.co.za', username='root', password='$a7CZbe?D4bf')
```

**PostgreSQL (inside Docker — NOT exposed to host):**
```
Host:     saas-postgres-1 (container name, only reachable from other containers)
Port:     5432
User:     saas_admin
Password: SaasAdmin2026!
```

To run SQL from SSH, use:
```bash
docker exec saas-postgres-1 psql -U saas_admin -d <db_name> -c "SELECT ..."
```

**Databases:**
| DB Name | Product | Notes |
|---------|---------|-------|
| behivez_auth | Shared Auth | Users, tokens, subscriptions — DO NOT TOUCH |
| beegraded | BeeGraded | Evaluations, papers |
| broodz | Broodz | Artists, profiles, gallery |
| swarmz | Swarmz | Vehicles, trips, fleet |
| pollenz | Pollenz | Managed by Laravel, separate backend |

**Deploy paths (SCP/SFTP via paramiko):**
```
/opt/saas/beegraded/frontend-dist/   → beegraded.co.za
/opt/saas/pollenz/frontend-dist/     → pollenz.co.za
/opt/saas/swarmz/frontend-dist/      → swarmz.co.za
/opt/saas/broodz/ssr-dist/           → broodz.co.za (SSR, Node.js)
/opt/saas/behivez/frontend-dist/     → behivez.co.za
/opt/saas/auth-api/                  → auth API source
```

**Docker containers (DO NOT restart without permission):**
| Container | Purpose | Port |
|-----------|---------|------|
| saas-proxy-1 | nginx reverse proxy | 80, 443 |
| saas-postgres-1 | PostgreSQL 16 | 5432 (internal) |
| saas-n8n-1 | n8n workflows | 5678 |
| saas-auth-api-1 | Auth API | 3100 |
| beegraded-api | Text extraction | 5001 |

**Port 80/443 is Docker proxy. Do NOT try to start host nginx. Do NOT kill Docker containers to free ports.**

## Shared Auth API — LIVE, DO NOT RECREATE

- **Container:** `saas-auth-api-1` (Express + Prisma, port 3100)
- **Database:** `behivez_auth` on `saas-postgres-1`
- **Source:** `packages/auth-api/` (local) → `/opt/saas/auth-api/` (server)

### Auth Endpoints (available on ALL product domains via nginx proxy)

| Method | Path | Auth? | Purpose |
|--------|------|-------|---------|
| POST | `/auth/login` | No | `{ email, password }` → `{ accessToken, refreshToken, user }` |
| POST | `/auth/register` | No | `{ name, email, password, product? }` → same as login |
| POST | `/auth/refresh` | No | `{ refreshToken }` → new tokens |
| POST | `/auth/logout` | No | `{ refreshToken }` → revokes token |
| POST | `/auth/change-password` | Yes | `{ currentPassword, newPassword }` |
| GET | `/auth/me` | Yes | Returns user profile + subscriptions |
| POST | `/auth/forgot-password` | No | `{ email }` → sends reset email |
| POST | `/auth/reset-password` | No | `{ token, newPassword }` → resets password |

### Admin Endpoints (behivez.co.za only, OWNER/ADMIN role required)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/users` | List users with subscriptions |
| GET | `/admin/users/:id` | User detail |
| PATCH | `/admin/users/:id` | Update user role/name |
| POST | `/admin/users` | Create user |
| POST/PATCH/DELETE | `/admin/users/:id/subscriptions` | Manage subscriptions |
| GET | `/admin/stats` | Dashboard statistics |
| GET | `/admin/health` | Product health pings |

### Existing Users (DO NOT CREATE NEW ONES without asking)

| Name | Email | Role | Products |
|------|-------|------|----------|
| Corrie Henning | corrie.henning@gmail.com | OWNER | all |
| Dayna | gagedp19@gmail.com | OWNER | all |
| Innocentia Kambule | kambuleinnocentia1@gmail.com | AFFILIATE | beegraded |

All passwords: `Beez2026!` — mustChangePassword is OFF.

### JWT Token Claims
```json
{ "sub": "user-uuid", "email": "...", "name": "...", "role": "OWNER|ADMIN|USER|AFFILIATE", "products": ["beegraded", ...] }
```
Access token: 15 min. Refresh token: 7 days, rotated on use.

### Auth Integration Pattern (same for all products)

1. Pinia auth store with login/register/refresh/logout
2. localStorage keys: `{prefix}_access_token`, `{prefix}_refresh_token`, `{prefix}_user`
3. Login/register page calling `/auth/login` and `/auth/register`
4. Router guards checking the access token
5. Axios interceptor: attach `Authorization: Bearer <token>`, handle 401 with refresh

| Product | Prefix | Reference Store |
|---------|--------|-----------------|
| BeeGraded | `bg_` | `products/beegraded/src/stores/auth.ts` |
| Pollenz | `pz_` | `products/pollenz/src/stores/user.store.ts` |
| Swarmz | `sz_` | `products/swarmz/src/stores/auth.ts` |
| Broodz | `bz_` | `products/broodz/src/stores/auth.ts` |
| BeHivez | `bh_` | `products/behivez/src/stores/auth.ts` |

## Quasar Notes

- **Pinia required:** Every product MUST have `src/stores/index.ts` that exports a Pinia instance via `defineStore` from `#q-app/wrappers`. Without this, all stores fail with `_s` undefined.
- **Theme:** Import `@behivez/theme/brand` in `quasar.config.ts`, `@use '@behivez/theme/base'` in `app.scss`, `@forward '@behivez/theme/variables'` in `quasar.variables.scss`.
- **Build:** `npx quasar build` for SPA, `npx quasar build -m ssr` for Broodz.

## Rules

- **Port conflicts:** If a port is busy, tell the user — do NOT kill processes
- **No shared package until needed** — only create when code is duplicated across 2+ products
- **Laravel backends** live inside their product folder (e.g. Pollenz backend is separate repo)
- **n8n workflows** stay per product in n8n-workflows/ folders
- **Express/Prisma backends** live inside their product folder (e.g. products/swarmz/server/)
- **Finances belong to Pollenz** — do NOT build expense/income tracking into other products
