# CLAUDE.md — BeHivez Monorepo

---
## ⚠️ CRITICAL — READ BEFORE DOING ANYTHING ⚠️

**DO NOT TOUCH THE AUTH SYSTEM. IT IS WORKING. IT IS DEPLOYED. IT IS LIVE.**

- DO NOT run any scripts against the `behivez_auth` database
- DO NOT reset passwords, seed users, or modify the `User` table
- DO NOT redeploy, restart, or modify `saas-auth-api-1`
- DO NOT create `reset_password.py` or any script that touches auth
- DO NOT ask the user to create new accounts — they already exist
- If login doesn't work, it's a frontend/cache issue, NOT a DB issue

**All 3 users exist. All passwords are `Beez2026!`. Auth login endpoint returns 200 with valid JWT. CONFIRMED AND TESTED.**

If you need user data, call `POST /auth/login` or `GET /auth/me` — do not query the DB directly.

---

## Overview
BeHivez — a hive of SaaS tools for South African entrepreneurs. pnpm workspace monorepo.

## Products

| Product | Package | Port | Mode | Status |
|---------|---------|------|------|--------|
| BeeGraded | @behivez/beegraded | 8090 | SPA | MVP |
| Pollenz | @behivez/pollenz | 8091 | SPA | In progress |
| Swarmz | @behivez/swarmz | 8092 | SPA | In progress |
| Broodz | @behivez/broodz | 8093 | SSR | Scaffolded |
| BeHivez | @behivez/landing | 8095 | SPA | Scaffolded |

## Commands

```bash
pnpm dev:beegraded     # Start BeeGraded on port 8090
pnpm dev:pollenz       # Start Pollenz on port 8091
pnpm dev:swarmz        # Start Swarmz on port 8092
pnpm dev:broodz        # Start Broodz SSR on port 8093
pnpm dev:landing       # Start landing page on port 8095
pnpm build:all         # Build all products
pnpm deploy:beegraded  # Deploy BeeGraded to server
```

## Structure

```
products/          # Each product is a Quasar app
packages/          # Shared code (create when needed)
server-config/     # nginx, docker-compose, deploy scripts
```

## Server (165.73.87.181)

- nginx reverse proxy, one domain per product
- Shared n8n (webhook prefixes: bg-, pz-, sz-, bz-)
- Shared PostgreSQL, one DB per product
- SPAs served from `/opt/saas/{product}/frontend-dist/`
- Broodz SSR: `/opt/saas/broodz/ssr-dist/` (Node.js + nginx proxy)

## Shared Auth API — ALREADY DEPLOYED, DO NOT RECREATE

**The auth system is LIVE. Do NOT create new users, seed databases, or redeploy the auth-api.**

- **Container:** `saas-auth-api-1` on the server (Express + Prisma, port 3100)
- **Database:** `behivez_auth` on `saas-postgres-1`
- **Source:** `packages/auth-api/` (local) → `/opt/saas/auth-api/` (server)
- **Client lib:** `packages/auth-client/`

### Auth Endpoints (available on ALL product domains via nginx proxy)

| Method | Path | Auth? | Purpose |
|--------|------|-------|---------|
| POST | `/auth/login` | No | `{ email, password }` → `{ accessToken, refreshToken, user }` |
| POST | `/auth/register` | No | `{ name, email, password, product? }` → same as login |
| POST | `/auth/refresh` | No | `{ refreshToken }` → new tokens |
| POST | `/auth/logout` | No | `{ refreshToken }` → revokes token |
| POST | `/auth/change-password` | Yes | `{ currentPassword, newPassword }` |
| GET | `/auth/me` | Yes | Returns user profile + subscriptions |

### How to call from any product frontend
```
POST https://{product}.co.za/auth/login
Content-Type: application/json
{ "email": "user@example.com", "password": "..." }

→ { accessToken, refreshToken, user: { id, email, name, role, products, mustChangePassword } }
```
For authenticated requests, send: `Authorization: Bearer <accessToken>`

### Existing Users (DO NOT CREATE NEW ONES — ask the user if they want new users)

| Name | Email | Role | Products |
|------|-------|------|----------|
| Corrie Henning | corrie.henning@gmail.com | OWNER | all |
| Dayna | gagedp19@gmail.com | OWNER | all |
| Innocentia Kambule | kambuleinnocentia1@gmail.com | AFFILIATE | beegraded |

All passwords: `Beez2026!` — mustChangePassword is OFF for all users.

### JWT Token Claims
```json
{ "sub": "user-uuid", "email": "...", "name": "...", "role": "OWNER|ADMIN|USER|AFFILIATE", "products": ["beegraded", ...] }
```
Access token: 15 min expiry. Refresh token: 7 days, rotated on use.

### Auth Flows for Product Integration

**How to integrate auth into ANY product (Broodz, Pollenz, Swarmz, etc.):**

1. Create a Pinia auth store (see `products/beegraded/src/stores/auth.ts` as reference)
2. Store tokens in localStorage: `{prefix}_access_token`, `{prefix}_refresh_token`, `{prefix}_user`
3. Add login/register page calling `POST /auth/login` and `POST /auth/register`
4. Add router guards checking the access token
5. Add axios interceptor to attach `Authorization: Bearer <token>` to API calls

**Password Reset flow (forgot password):**
```
1. User clicks "Forgot password" → frontend calls:
   POST /auth/forgot-password  { "email": "user@example.com" }
   → Auth API sends reset email with token link

2. User clicks email link → lands on your reset page with ?token=xxx

3. Frontend calls:
   POST /auth/reset-password  { "token": "xxx", "newPassword": "NewPass123!" }
   → Password updated, all sessions revoked, user must log in again
```

**Change Password flow (logged-in user):**
```
POST /auth/change-password
Header: Authorization: Bearer <accessToken>
Body: { "currentPassword": "old", "newPassword": "new" }
→ 200 OK, mustChangePassword flag cleared
```

**Profile page:**
```
GET /auth/me
Header: Authorization: Bearer <accessToken>
→ { id, email, name, role, products, subscriptions }
```
Note: There is NO profile update endpoint yet (no way to change name/email). If needed, ask Corrie and the auth terminal will add it.

**Token refresh (handle 401s):**
```
POST /auth/refresh  { "refreshToken": "stored-refresh-token" }
→ { accessToken, refreshToken } (new pair — old refresh token is revoked)
```
Add an axios response interceptor: on 401, call refresh, retry the original request. If refresh fails, log user out.

### BeeGraded Auth Integration (ALREADY DONE — use as reference)
- `stores/auth.ts` — Pinia store with login/register/refresh/logout
- `pages/GetStartedPage.vue` — login/register form
- `router/index.ts` — guards checking `bg_access_token`
- `boot/axios.ts` — JWT interceptor for n8n webhook calls
- Token stored in localStorage as `bg_access_token`, `bg_refresh_token`, `bg_user`

**DO NOT rebuild or redeploy auth-api. DO NOT re-seed the database. DO NOT ask the user to create accounts. The auth system is working.**

## Broodz — Talent Marketplace (SSR + SEO)

Broodz is SSR (Quasar SSR mode, Node.js server) — this is critical for SEO.

### Requirements
- **Auth:** Use the shared auth-api (see above). Same endpoints, same pattern.
- **Artist profile pages:** Each artist gets a public URL like `broodz.co.za/artist/{slug}`
  - These pages MUST be server-side rendered (full HTML for crawlers)
  - Each page needs: `<title>`, `<meta name="description">`, Open Graph tags (`og:title`, `og:description`, `og:image`)
  - Add JSON-LD structured data (`@type: Person` or `PerformingArtist`) for Google rich results
- **Sitemap:** Auto-generate `sitemap.xml` at `broodz.co.za/sitemap.xml` listing all artist profile URLs
- **Robots.txt:** Serve at `broodz.co.za/robots.txt` — allow all crawlers, point to sitemap
- **Google indexing:** After deploy, submit `broodz.co.za/sitemap.xml` to Google Search Console
- The main `broodz.co.za` landing page also needs proper meta tags and structured data

### SSR Deploy
- Build: `quasar build -m ssr` in `products/broodz/`
- Deploy to `/opt/saas/broodz/ssr-dist/` on server
- Runs as Node.js process, nginx proxies to it

## BeeGraded Terminal

This terminal handles **BeeGraded only**. Do not touch other products, Docker infrastructure, or shared services.

### BeeGraded Architecture — MANDATORY

```
Frontend (Vue/Quasar) → Backend (Express/Prisma, port 3001) → n8n (AI only) → Backend saves to DB
```

- **n8n** = AI middleware ONLY. Calls Claude + Gemini, returns JSON. **NO SQL INSERT/UPDATE/DELETE. NO database writes. EVER.**
- **Backend** (Express/Prisma at `/opt/saas/beegraded/server/`) = ALL database operations. Reads, writes, deletes.
- **Frontend** = renders UI, calls backend API for data, calls n8n only for AI trigger.

If you catch yourself adding a Postgres node to n8n or letting n8n write to the DB, STOP. You are doing it wrong.

## Rules

- **Port conflicts:** If a port is busy, tell the user — do NOT kill processes or auto-bump
- **No shared package until needed** — only create packages/shared/ when code is duplicated across 2+ products
- **Laravel backends** live inside their product folder (e.g. products/pollenz/backend/)
- **n8n workflows** stay per product in n8n-workflows/ folders
- **Express/Prisma backends** live inside their product folder (e.g. products/swarmz/server/)
