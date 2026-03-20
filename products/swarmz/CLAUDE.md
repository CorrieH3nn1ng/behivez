# CLAUDE.md — Swarmz

## Overview
Swarmz is a personal/small fleet vehicle cost tracker for South African vehicle owners and small fleet operators. Track every status change, scan receipts, and see where your money goes.

## Development
- `pnpm dev:swarmz` — Start dev server on port 8092
- `quasar build` — Build SPA
- Deploy: `python scripts/deploy_swarmz.py`

## Architecture
- Quasar 2 + Vue 3 + TypeScript + Pinia
- Hash-mode SPA (no server-side routing needed)
- Demo mode with mock data (no backend required for MVP)
- @behivez/theme for shared branding

## Key Concepts
- **Status-based tracking**: Every vehicle action is a status change (available, out, fueling, service, repair, cleaning, accident, towed)
- **Receipt scanning**: Camera capture on status change, OCR via Gemini Vision (planned)
- **Cost dashboard**: Per-vehicle and fleet-wide cost breakdown by category
- **Solo vs Fleet**: Solo = 1 vehicle, Fleet = multiple vehicles + driver management
