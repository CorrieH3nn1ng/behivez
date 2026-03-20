# CLAUDE.md — BeeGraded

---
## ⚠️ CRITICAL ARCHITECTURE RULES — READ BEFORE DOING ANYTHING ⚠️

### n8n DOES NOT TOUCH THE DATABASE. EVER.

This is the middleware architecture. It is final. Do not deviate.

```
Frontend (Quasar SPA)
  ├── calls n8n webhooks for AI processing (Gemini, extraction, grading)
  │     └── n8n receives data, calls AI APIs, returns JSON. NO DB ACCESS.
  │
  └── calls Express/Prisma API for all data operations
        └── Express reads/writes to PostgreSQL. This is the ONLY DB layer.
```

**What n8n does:**
- Receives webhook calls from the frontend
- Calls Gemini or other AI APIs
- Processes/transforms data
- Returns JSON to the frontend
- That's it. Nothing else.

**What n8n MUST NEVER do:**
- Query PostgreSQL directly
- Insert, update, or delete database rows
- Store evaluation results (that's the Express API's job)
- Manage users, tokens, or subscriptions
- Access Prisma or any ORM

**What Express/Prisma does:**
- ALL database reads and writes
- Paper CRUD, evaluation storage, token management
- JWT validation (via shared auth-api tokens)
- Serves `/api/*` endpoints

**If you need to save AI results to the database:**
1. n8n processes the AI call and returns JSON to the frontend
2. Frontend receives the JSON and calls the Express API to save it
3. Express/Prisma writes to PostgreSQL

DO NOT shortcut this by having n8n write to the DB directly. The three-layer separation exists for a reason.

---

### DO NOT TOUCH THE AUTH SYSTEM

The shared auth-api is deployed and working. See the root `CLAUDE.md` for details.

- DO NOT modify `packages/auth-api/`
- DO NOT seed users or reset passwords
- DO NOT restart `saas-auth-api-1`
- All 3 users exist with password `Beez2026!`

---

## Overview

BeeGraded — AI-powered academic paper evaluation platform. Quasar SPA + Express/Prisma backend + n8n AI orchestration.

**Domain:** beegraded.co.za
**Dev port:** 8090 (frontend), 3001 (backend API)

## Stack

| Layer | Tech | Location | Purpose |
|-------|------|----------|---------|
| Frontend | Quasar SPA (Vue 3) | `src/` | UI, user interaction |
| Backend API | Express + Prisma | `server/` | DB operations, `/api/*` |
| AI Orchestration | n8n webhooks | n8n server | Gemini calls, returns JSON |
| Auth | Shared auth-api | `packages/auth-api/` | JWT login/register/refresh |
| Database | PostgreSQL | `beegraded` DB | Papers, evaluations, tokens |

## API Endpoints

### Express API (`/api/*`)
- `GET/POST /api/papers` — paper CRUD
- `GET/POST /api/evaluations` — evaluation tracking & results

### n8n Webhooks (prefix: `bg-`)
- Paper upload & parsing (Gemini)
- Evaluation pipeline (Gemini grading)
- Quick assessment
- Report generation
- Token validation
- Rubric management

All webhook calls go through `VITE_API_URL` (n8n base URL).
All data calls go through `VITE_BACKEND_URL` (Express API).

## Auth Integration
- Pinia store: `src/stores/auth.ts`
- localStorage keys: `bg_access_token`, `bg_refresh_token`, `bg_user`
- Boot file: `src/boot/axios.ts` attaches JWT to all requests
- Login page: `src/pages/GetStartedPage.vue`

## Build & Deploy
```bash
# Frontend
VITE_API_URL=https://beegraded.co.za/webhook npx quasar build
# Deploy dist/spa/ → /opt/saas/beegraded/frontend-dist/

# Backend
cd server && npm run build
# Deploy to /opt/saas/beegraded/server/ → runs as saas-beegraded-api-1
```

## Server
- Frontend: `/opt/saas/beegraded/frontend-dist/` (nginx serves static)
- Backend: port 3001, nginx proxies `/api` to it
- n8n: shared instance, webhooks prefixed `bg-`
- DB: `beegraded` schema on `saas-postgres-1`
