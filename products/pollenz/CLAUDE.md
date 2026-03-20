# Claude Code Context — Pollenz

This file provides context for Claude Code when working on the Pollenz product within the B-Keeperz monorepo.

## Project Overview

**Pollenz** (formerly PennyPilot) is the Accounting & SARS module of the B-Keeperz SaaS ecosystem. It handles finance, tax, bank reconciliation, and payroll for South African freelancers and sole proprietors.

- Offline-first architecture with cloud sync
- Intelligent transaction categorization (SA merchant keywords)
- CSV import from SA banks (Nedbank, more planned)
- SARS tax compliance (provisional tax, vehicle deductions, home office)
- Travel logbook with Google Timeline import
- Receipt capture with AI extraction
- Mobile-first PWA design

## B-Keeperz Ecosystem

| App | Domain | Purpose |
|-----|--------|---------|
| **Pollenz** (this) | pollenz.co.za | Accounting & SARS |
| **Kombz** | kombz.co.za | Business operations (clients, invoicing, quotes) |
| **Swarmz** | swarmz.co.za | Fleet/vehicle management |
| **Nectarz** | nectarz.co.za | Manufacturing/MRP |
| **Hivez** | hivez.co.za | Central ERP hub |

---

## INSTITUTIONAL STANDARDS

### Mission
**Financial inclusion and "Cradle to Grave" support.** Pollenz aims to serve users from their first paycheck through retirement.

### Security
- **POPIA Compliant** - South African data protection standards
- **Zero-Knowledge Encryption** - User data encrypted at rest; server cannot read financial details
- **Sensitive Data Handling** - Never log or expose transaction descriptions, amounts, or personal identifiers

### Data Integrity
- **Merkle-Tree Hashing** - Backend uses hash chains for transaction notarization
- **Immutable Audit Trail** - All financial mutations are logged and verifiable
- **Checksum Validation** - Oplog entries include checksums for sync integrity

### Sync Architecture
- **Offline-First** - App works fully offline; sync when connected
- **Operation Log (Oplog)** - All mutations recorded as operations for reliable sync
- **Conflict Resolution** - Server-wins strategy with local rollback support

---

## MOBILE-NATIVE UI (Quasar)

### Mindset
**Mobile-First PWA with Native Feel.** Every feature should feel like a native app, not a website crammed into a phone.

### Touch Standards
- **44px+ Touch Targets** - All buttons, inputs, and interactive elements minimum 44px
- **Thumb-Zone Placement** - Primary actions in bottom-right quadrant (natural thumb reach)
- **Swipe Gestures** - Use `q-slide-item` for list actions where appropriate

### Visual Style
| Element | Value |
|---------|-------|
| Primary Color | Forest Green `#3D7A4A` |
| Secondary Color | Honey Amber `#D4A843` |
| Card Border Radius | `12px` |
| Spacing Unit | `8px` grid |

### Dialog Patterns
```vue
<q-dialog
  v-model="showDialog"
  persistent
  maximized
  transition-show="slide-up"
  transition-hide="slide-down"
>
```

---

## Documentation

- **[Progress](docs/PROGRESS.md)** - Build progress and roadmap (phases 1-5)
- **[Features](docs/FEATURES.md)** - Complete feature documentation
- **[Categorization](docs/CATEGORIZATION.md)** - How transaction categorization works
- **[Global Rules](docs/GLOBAL_RULES.md)** - Pattern-based transaction-to-blueprint matching
- **[Kombz Spec](docs/KOMBZ.md)** - Kombz architecture (operations app)
- **[Memory](.claude/memory/MEMORY.md)** - Persistent project memory and decisions

## Architecture

### Frontend (this directory)
- **Location:** `src/` (Vue.js 3 + TypeScript + Quasar 2)
- **State Management:** Pinia stores in `src/stores/`
- **Offline Storage:** LocalBase (IndexedDB wrapper) in `src/services/storage/`
- **API Services:** `src/services/api/`
- **Dev Server:** Vite on port 9004

### Backend (separate repo/deploy)
- **Location:** `C:\projects\pilot\apps\pollenz\backend\` (Laravel 12, PHP 8.4)
- **Database:** PostgreSQL 16 (UUIDs for all models)
- **Auth:** Sanctum token auth (NOT stateful/CSRF)
- **Dev Server:** `php artisan serve` on port 8001

### Intelligence Layer
- **n8n** handles all AI calls, extraction, guardrails, business rules
- AI keys and prompts live only in n8n, not in codebase
- Frontend = user interaction only (no AI keys)
- Laravel = thin backend (auth, CRUD, file storage)

## Production

- **URL:** https://pollenz.co.za
- **Server:** hivebackbone02.dedicated.co.za (165.73.87.181)
- **Stack:** Docker + Nginx reverse proxy + PostgreSQL 16 + n8n
- **Deploy:** Build frontend locally, SCP `dist/spa/` to `/opt/saas/pollenz/frontend-dist/`
- **Deploy scripts:** `C:\projects\pilot\apps\pollenz\deploy\`

## Key Frontend Services

| Service | Location | Purpose |
|---------|----------|---------|
| `CategorizationService` | `src/services/categorization/` | Auto-categorize with SA merchant keywords |
| `LocalBaseService` | `src/services/storage/` | IndexedDB storage for offline-first |
| `NedbankParser` | `src/services/parsers/` | Parse Nedbank CSV format |
| `InvoicePdfService` | `src/services/pdf/` | Client-side PDF generation |

## Key Backend Services

| Service | Purpose |
|---------|---------|
| `GeminiService` | AI invoice/receipt extraction via Google Gemini |
| `TaxPracticeService` | Monthly tax calculation engine |
| `TaxShieldService` | Tax deduction optimization |
| `TaxPackService` | Annual tax pack PDF generation |
| `BlueprintMatchingService` | Auto-match transactions to recurring expenses |
| `TelemetryImportService` | Google Timeline import for travel logbook |

## API Endpoints

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /auth/user` - Get current user
- `PUT /auth/profile` - Update profile

### Transactions
- `GET /transactions` - List transactions
- `POST /transactions` - Create transaction
- `POST /transactions/sync` - Sync from local
- `GET /transactions/summary` - Get category summary

### Categories
- `GET /categories` - List categories
- `POST /categories` - Create custom category

### Invoices
- `GET /invoices` - List invoices
- `POST /invoices` - Create invoice
- `POST /invoices/upload-historical` - Upload PDF invoice
- `GET /invoices/{id}/matches` - Find transaction matches
- `POST /invoices/{id}/match` - Link to transaction

### Tax
- `GET /tax/settings` - Get tax settings
- `GET /tax/summary/{year}` - Tax year summary
- `GET /tax-practice/current` - Current month practice
- `GET /tax-practice/ytd` - Year-to-date practice
- `GET /tax-pack/{taxYear}/pdf` - Annual tax pack PDF

### Travel
- `GET /trips` - List trips
- `POST /trips` - Create trip
- `GET /vehicles` - List vehicles
- `GET /vehicle-expenses` - List vehicle expenses
- `POST /telemetry/upload` - Upload Google Timeline data

### Receipts
- `POST /receipts/upload` - Upload receipt with AI extraction
- `GET /receipts` - List receipts

## Database Tables

### Core
- `users` - User accounts with subscription tier and admin role
- `categories` - Transaction categories (system + custom, tax deduction metadata)
- `transactions` - Financial transactions with sync support
- `groups` - Transaction grouping/tagging

### Invoicing
- `clients` - Client database with billing settings
- `invoices` - Invoices with transaction matching
- `invoice_items` - Line items (linked to services)
- `services` - Reusable service definitions
- `business_profiles` - Business details for invoicing

### Financial Setup
- `income_sources` - Expected income streams
- `fixed_expenses` - Recurring monthly expenses
- `budget_periods` / `budget_items` - Monthly budgets
- `tax_settings` - Tax configuration
- `tax_provisions` - Monthly tax provisions
- `monthly_tax_practices` - Monthly tax snapshots

### Travel & Vehicles
- `trips` - Trip records with GPS, category, vehicle link
- `transport_methods` - Transport types
- `vehicles` - Multi-vehicle support with SARS brackets
- `vehicle_expenses` - Fuel, service, insurance, etc.
- `vehicle_configs` - Legacy vehicle config (migrated to vehicles)
- `home_office_configs` - Property measurements for home office deduction

### Tax & Audit
- `country_configs` - SARS rates, vehicle cost brackets
- `receipts` - Captured receipts with AI-extracted data

### Local Only (IndexedDB)
- `category_rules` - User-defined categorization rules

## Common Tasks

### Adding a new category
1. Update `CategorySeeder.php` in backend for default categories
2. Add keywords to `CategorizationService.ts` for auto-categorization

### Adding a new bank parser
1. Create parser in `src/services/parsers/`
2. Extend `BaseBankParser` pattern
3. Register in import flow

### Adding a new API endpoint
1. Create/update controller in backend `app/Http/Controllers/Api/`
2. Add route in backend `routes/api.php`
3. Add frontend service in `src/services/api/`
4. Update types in `src/types/index.ts`

## Running the App

```bash
# Frontend (this directory)
pnpm install
npx quasar dev

# Backend (separate location)
cd C:\projects\pilot\apps\pollenz\backend
php artisan serve --port=8001
```

## Testing

```bash
# Frontend lint
pnpm run lint

# Type check
npx vue-tsc --noEmit

# Backend tests
cd C:\projects\pilot\apps\pollenz\backend
php artisan test
```

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:8001/api
```

### Production build
```bash
VITE_API_URL=https://pollenz.co.za/api npx quasar build
```

## Mobile-First Guidelines

- All dialogs should be full-screen on mobile (`maximized` or `$q.screen.lt.sm`)
- Use `q-scroll-area` for scrollable content
- Keep forms compact with dense inputs
- Primary actions in thumb-zone (bottom-right) or sticky bottom bar
- Test on 412x915 viewport (mobile developer tools)
- Minimum 44px touch targets on all interactive elements

## Build Progress Summary

- **Phase 1** (Complete): MVP — auth, CSV import, categorization, dashboard, invoicing, sync
- **Phase 1.5** (Complete): Financial intelligence — blueprints, audit engine, Penny AI chat, goals
- **Phase 2** (Complete): Tax practice — SARS vehicle cost, home office, monthly tax engine
- **Phase 3** (Complete): Travel & telemetry — Google Timeline import, travel logbook, geofencing
- **Phase 4** (Complete): Receipt capture with AI, tax pack PDF generator
- **Phase 5** (Complete): Services & invoice enhancements
- **Remaining**: More bank parsers, gamification, zero-knowledge encryption, PWA install, mobile app
