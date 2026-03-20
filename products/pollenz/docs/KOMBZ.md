# Kombz — Business Operations Hub

> **Kombz** (Honeycomb) = Structured cells, each holding value. The central business operations platform in the B-Keeperz ecosystem.

**Status:** Architecture planned. Build after Pollenz is stable on pollenz.co.za.

---

## What Is Kombz?

Kombz is a **multi-industry business operations platform** with a shared core and pluggable industry modules. Every business — freelancer, contractor, manufacturer, retailer, courier — shares the same client management, invoicing, and quoting core, but gets industry-specific operational tools via modules.

Kombz handles **the work**. Pollenz handles **the books**.

**Domain:** kombz.co.za (check availability before registering)

---

## B-Keeperz Product Ecosystem

| Product | Domain | Status | Purpose |
|---------|--------|--------|---------|
| BeHivez | behivez.co.za | Future | Master landing page |
| BeeGraded | beegraded.co.za | MVP | Academic paper evaluation |
| **Pollenz** | pollenz.co.za | Active | **Accounting & SARS** — books, tax, bank reconciliation, payroll |
| **Kombz** | kombz.co.za | **Planned** | **Operations** — clients, invoicing, quotes, jobs + industry modules |
| Swarmz | swarmz.co.za | Future | Vehicle/fleet management → pushes billable trips to Kombz |
| Dronz | dronz.co.za | Future | Automation services |
| Talentz | talentz.co.za | Future | Recruitment platform |
| Hivez | hivez.co.za | Future | Central integration hub |

---

## Pollenz vs Kombz: The Split

> **Pollenz** = Your accountant's view (the books, compliance, SARS)
> **Kombz** = Your day-to-day business view (clients, work, invoicing)

### Pollenz — Accounting Pack & SARS

The financial brain. Everything money, tax, and compliance.

- **Bank imports** — CSV import (Nedbank, future banks), transaction matching
- **Transaction categorization** — auto-categorize, rules engine, category management
- **Chart of accounts** — categories as simplified chart of accounts
- **Bank reconciliation** — match bank transactions to invoices/expenses
- **Budgets** — monthly budgets, spending tracking
- **Salary & payroll** — salary profiles, payslip extraction (n8n/AI), IRP5 tracking
- **SARS tax** — tax packs, provisional tax (IRP6), PAYE/UIF/SDL
- **Tax deductions** — home office, vehicle (SARS rates), business expenses
- **VAT** — VAT calculations, input/output VAT tracking, VAT201 returns
- **Financial reports** — income statement, balance sheet, trial balance
- **Receipt storage** — receipts linked to transactions for SARS audit trail
- **Vendor/supplier expenses** — expense capture, categorization, deductibility
- **Personal finance** — savings goals, spending overview, category charts

### Kombz — Business Operations

The operational engine. Doing the work, managing clients, getting paid.

- **Client/customer database** — name, code, contact, billing info, history
- **Income invoices** — create, edit, send, PDF generation, payment tracking
- **Products & services catalog** — reusable line items, rates, units
- **Quotes & proposals** — create, send, convert to invoice on acceptance
- **Business profile** — company details, VAT number, bank details, logo
- **Operational dashboard** — outstanding invoices, pipeline, client activity
- **Industry modules** — specialized tools per business type (see below)

### The Bridge: Kombz ↔ Pollenz Sync

Kombz creates operational documents. Pollenz records the financial impact.

```
KOMBZ (Operations)                    POLLENZ (Accounting)
──────────────────                    ────────────────────
Invoice created & sent    ──────►    Revenue entry created
Invoice marked paid       ──────►    Payment recorded, bank matched
Quote accepted            ──────►    (no financial impact yet)
Expense logged in job     ──────►    Expense entry, VAT input claimed
Time entry billed         ──────►    Revenue via invoice sync

Bank statement imported   ◄──────    Unmatched deposits flagged
Tax summary requested     ◄──────    Aggregated from all entries
```

**Payment tracking lives in BOTH:**
- **Kombz** tracks payment status operationally (sent → paid → overdue) for the business owner
- **Pollenz** records the accounting entry (revenue recognized, VAT liability, bank reconciliation)
- Status syncs between them via integration API

---

## Architecture: Shared Core + Industry Modules

```
SHARED CORE (every Kombz user gets this)
├── Clients / Customers
├── Income Invoices (create, send, PDF, payment tracking)
├── Quotes & Proposals (create, send, convert to invoice)
├── Products & Services catalog
├── Business Profile (company details, VAT, banking, logo)
└── Operations Dashboard (pipeline, outstanding, client activity)

SHARED MODULES (optional, cross-industry)
├── Inventory / Stock
├── Time Tracking
├── Job / Project Management
└── Document Management

INDUSTRY MODULES (user activates what they need)
├── Freelancer/Services  → time tracking, project billing, hourly rates
├── General Contractor   → job costing, quotes, subcontractors, progress billing
├── Buy & Sell (Retail)  → stock levels, purchase orders, markup/margin
├── Courier/Logistics    → jobs, routes, proof of delivery, per-km costing
├── Manufacturing        → BOM, production orders, WIP, raw materials inventory
└── (Future modules from ecosystem — Swarmz fleet data, etc.)
```

### Module Priority

1. **Freelancer/Services** — closest to existing Pollenz features, fastest to build
2. **General Contractor** — natural extension (quotes → jobs → invoices), strong SA market demand
3. Buy & Sell (Retail) — future
4. Courier — future (or via Swarmz integration)
5. Manufacturing — future (most complex)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + Quasar 2 + TypeScript |
| Backend | Laravel 12, PHP 8.4 |
| Auth | Sanctum token auth |
| Database | PostgreSQL 16 (schemas per module) |
| AI / Extraction | n8n webhooks (no AI keys in codebase) |
| Deploy | Docker on hivebackbone02 |
| Colors | Primary `#3D7A4A` (forest green), Secondary `#D4A843` (honey amber) |

### Database Credentials (Planned)

- **DB name:** kombz
- **DB user:** kombz / K0mbz@2026
- **Local port:** 5434 (shared PG instance)
- **Prod port:** 5432 (Docker)

---

## Code Structure

### Backend

```
apps/kombz/backend/
├── app/
│   ├── Core/                              # Shared core (always loaded)
│   │   ├── Models/
│   │   │   ├── Client.php
│   │   │   ├── Invoice.php
│   │   │   ├── InvoiceItem.php
│   │   │   ├── Quote.php
│   │   │   ├── QuoteItem.php
│   │   │   ├── BusinessProfile.php
│   │   │   └── Service.php                # Products/services catalog
│   │   ├── Controllers/
│   │   │   ├── ClientController.php
│   │   │   ├── InvoiceController.php
│   │   │   ├── QuoteController.php
│   │   │   └── BusinessProfileController.php
│   │   ├── Services/
│   │   │   ├── PdfService.php
│   │   │   └── PollenzSyncService.php     # Pushes financial data to Pollenz
│   │   └── routes.php
│   │
│   ├── Modules/
│   │   ├── Freelancer/                    # Module: Freelancer/Services
│   │   │   ├── Models/
│   │   │   │   ├── Project.php
│   │   │   │   └── TimeEntry.php
│   │   │   ├── Controllers/
│   │   │   │   ├── ProjectController.php
│   │   │   │   └── TimeTrackingController.php
│   │   │   ├── Migrations/
│   │   │   └── routes.php
│   │   │
│   │   ├── Contractor/                    # Module: General Contractor
│   │   │   ├── Models/
│   │   │   │   ├── Job.php
│   │   │   │   ├── Subcontractor.php
│   │   │   │   └── ProgressClaim.php
│   │   │   ├── Controllers/
│   │   │   │   ├── JobController.php
│   │   │   │   └── ProgressClaimController.php
│   │   │   ├── Migrations/
│   │   │   └── routes.php
│   │   │
│   │   ├── Retail/                        # Future: Buy & Sell
│   │   └── Manufacturing/                 # Future: Manufacturing
│   │
│   └── Support/
│       └── ModuleServiceProvider.php      # Auto-discovers and loads active modules
│
├── database/
│   ├── migrations/                        # Core schema migrations
│   └── schemas/                           # PostgreSQL schema setup scripts
```

### Frontend

```
apps/kombz/frontend/
├── src/
│   ├── core/                              # Shared pages & components
│   │   ├── pages/
│   │   │   ├── DashboardPage.vue          # Operations dashboard
│   │   │   ├── ClientsPage.vue
│   │   │   ├── InvoicesPage.vue
│   │   │   ├── InvoiceEditPage.vue
│   │   │   ├── InvoiceViewPage.vue
│   │   │   ├── QuotesPage.vue
│   │   │   └── QuoteEditPage.vue
│   │   ├── stores/
│   │   │   ├── invoice.store.ts
│   │   │   ├── client.store.ts
│   │   │   └── quote.store.ts
│   │   ├── services/
│   │   │   ├── api/                       # API layer per resource
│   │   │   ├── pdf/                       # PDF generation
│   │   │   └── sync/                      # Pollenz sync service
│   │   └── components/
│   │       └── ...                        # Shared UI components
│   │
│   ├── modules/
│   │   ├── freelancer/
│   │   │   ├── pages/
│   │   │   │   ├── ProjectsPage.vue
│   │   │   │   └── TimeTrackingPage.vue
│   │   │   ├── stores/
│   │   │   │   ├── project.store.ts
│   │   │   │   └── timeEntry.store.ts
│   │   │   └── routes.ts
│   │   │
│   │   └── contractor/
│   │       ├── pages/
│   │       │   ├── JobsPage.vue
│   │       │   └── ProgressClaimsPage.vue
│   │       ├── stores/
│   │       │   ├── job.store.ts
│   │       │   └── progressClaim.store.ts
│   │       └── routes.ts
│   │
│   ├── router/
│   │   └── index.ts                       # Merges core + active module routes
│   ├── layouts/
│   │   └── MainLayout.vue                 # Nav adapts to active modules
│   └── types/
│       └── index.ts
```

---

## Database: PostgreSQL Schemas

Each module gets its own PostgreSQL schema. Core tables are always present. Module schemas are created when a module is activated for a user/business.

### Core Schema (Operations)

```sql
CREATE SCHEMA IF NOT EXISTS core;

-- core.clients
CREATE TABLE core.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    vat_number VARCHAR(50),
    billing_address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- core.invoices
CREATE TABLE core.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    client_id UUID REFERENCES core.clients(id),
    invoice_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',  -- draft, sent, paid, overdue, cancelled
    issue_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    vat_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    pollenz_synced BOOLEAN DEFAULT false,  -- has this been pushed to Pollenz?
    pollenz_ref UUID,                       -- reference ID in Pollenz
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- core.invoice_items
CREATE TABLE core.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES core.invoices(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 15.00,
    line_total DECIMAL(12,2) NOT NULL,
    service_id UUID,                        -- optional link to services catalog
    source_app VARCHAR(50),                 -- 'swarmz', 'kombz', etc.
    source_ref UUID,                        -- reference in source app
    created_at TIMESTAMP DEFAULT NOW()
);

-- core.quotes
CREATE TABLE core.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    client_id UUID REFERENCES core.clients(id),
    quote_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',  -- draft, sent, accepted, rejected, expired
    title VARCHAR(255),
    valid_until DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    vat_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    converted_invoice_id UUID REFERENCES core.invoices(id),  -- when accepted → invoice
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- core.quote_items
CREATE TABLE core.quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES core.quotes(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'each',
    unit_price DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    category VARCHAR(50),  -- labour, materials, equipment, subcontractor
    created_at TIMESTAMP DEFAULT NOW()
);

-- core.services (products/services catalog)
CREATE TABLE core.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_rate DECIMAL(12,2),
    unit VARCHAR(50) DEFAULT 'each',  -- each, hour, day, km, etc.
    vat_inclusive BOOLEAN DEFAULT true,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- core.business_profiles
CREATE TABLE core.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    company_name VARCHAR(255) NOT NULL,
    trading_as VARCHAR(255),
    registration_number VARCHAR(50),
    vat_number VARCHAR(50),
    tax_number VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_branch_code VARCHAR(20),
    logo_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Freelancer Schema

```sql
CREATE SCHEMA IF NOT EXISTS freelancer;

-- freelancer.projects
CREATE TABLE freelancer.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    client_id UUID REFERENCES core.clients(id),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',  -- active, completed, on_hold, archived
    hourly_rate DECIMAL(10,2),
    budget_hours DECIMAL(10,2),
    budget_amount DECIMAL(12,2),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- freelancer.time_entries
CREATE TABLE freelancer.time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES freelancer.projects(id),
    user_id UUID NOT NULL REFERENCES users(id),
    description TEXT,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration_minutes INTEGER,  -- calculated or manual
    billable BOOLEAN DEFAULT true,
    invoiced BOOLEAN DEFAULT false,
    invoice_item_id UUID REFERENCES core.invoice_items(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Contractor Schema

```sql
CREATE SCHEMA IF NOT EXISTS contractor;

-- contractor.jobs
CREATE TABLE contractor.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    client_id UUID REFERENCES core.clients(id),
    quote_id UUID REFERENCES core.quotes(id),  -- quotes are in core now
    job_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, in_progress, completed, invoiced
    site_address TEXT,
    start_date DATE,
    end_date DATE,
    budget_amount DECIMAL(12,2),
    actual_cost DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- contractor.subcontractors
CREATE TABLE contractor.subcontractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    trade VARCHAR(100),          -- electrician, plumber, painter, etc.
    phone VARCHAR(50),
    email VARCHAR(255),
    daily_rate DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- contractor.progress_claims
CREATE TABLE contractor.progress_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES contractor.jobs(id),
    claim_number INTEGER NOT NULL,
    description TEXT,
    percentage_complete DECIMAL(5,2),
    amount DECIMAL(12,2) NOT NULL,
    invoice_id UUID REFERENCES core.invoices(id),  -- linked when invoiced
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Module Loading

### Backend: ModuleServiceProvider

```php
// app/Support/ModuleServiceProvider.php
//
// On boot:
// 1. Read user's active modules from DB (or subscription tier)
// 2. For each active module:
//    - Register module routes (prefixed: /api/freelancer/*, /api/contractor/*)
//    - Ensure PostgreSQL schema exists (CREATE SCHEMA IF NOT EXISTS)
//    - Register module migrations path
// 3. Inactive modules are completely invisible — no routes, no overhead
```

### Frontend: Dynamic Route Registration

```typescript
// router/index.ts
//
// 1. Always load core routes (dashboard, clients, invoices, quotes)
// 2. Fetch user's active modules from API on auth
// 3. Dynamically import and register module route files
// 4. MainLayout nav adapts: only shows menu items for active modules
```

---

## Cross-Product Integration

### Kombz ↔ Pollenz Sync API

The primary integration. Kombz pushes financial events to Pollenz for the books.

```
POST /api/integration/financial-event
{
  "source_app": "kombz",
  "event_type": "invoice_created",    // invoice_created, invoice_paid, expense_logged
  "ref_id": "invoice-uuid",
  "client_name": "Acme Corp",
  "amount": 11500.00,
  "vat_amount": 1500.00,
  "date": "2026-03-05",
  "description": "Invoice #INV-0042 — Web development",
  "category": "business_income"        // maps to Pollenz chart of accounts
}
```

Pollenz receives this and:
1. Creates a transaction entry in the books
2. Records VAT output liability
3. When bank import matches the deposit → reconciles automatically

### Other Product → Kombz

```
POST /api/integration/line-items
{
  "source_app": "swarmz",
  "source_ref": "trip-uuid",
  "client_id": "uuid",
  "description": "Trip: Sandton → OR Tambo, 45km",
  "quantity": 45,
  "unit": "km",
  "unit_price": 4.84,
  "total": 217.80
}
```

Kombz receives this as a draft invoice line item, ready to add to an invoice.

### Integration Summary

| Source | Target | Data Flow |
|--------|--------|-----------|
| Kombz | Pollenz | Invoices/payments → revenue entries, VAT, bank reconciliation |
| Kombz | Pollenz | Operational expenses → expense entries, deductions |
| Swarmz | Kombz | Billable trips → invoice line items |
| Kombz | Pollenz | Income/expense totals → financial reports, tax packs |
| All products | Hivez | Central authentication, user management |

---

## Migration Strategy (from Pollenz)

### Phase 1: Scaffold Kombz

- Create `apps/kombz/` with the folder structure above
- Set up Laravel backend with core schema migrations
- Set up Quasar frontend with B-Keeperz theme
- Deploy skeleton to server alongside Pollenz

### Phase 2: Migrate Operational Features to Kombz

- Copy invoice, client, quote, services, business profile from Pollenz
- Adapt to core schema structure (add `pollenz_synced`, `source_app` fields)
- Copy corresponding frontend pages, stores, API services
- Set up data migration script for existing Pollenz users

### Phase 3: Strengthen Pollenz as Accounting Pack

- Add chart of accounts / enhanced categories
- Build bank reconciliation (match transactions to invoices)
- Add financial reports (income statement, balance sheet, trial balance)
- Build VAT return preparation (VAT201)
- Enhance salary/payroll features (payslip extraction, IRP5)
- Build integration receiver (accept financial events from Kombz)

### Phase 4: Build Priority Modules in Kombz

- **Freelancer module:** projects, time tracking, billable hours → invoice
- **Contractor module:** jobs, subcontractors, progress claims → invoice

### Phase 5: Clean & Connect

- Remove operational features from Pollenz (invoicing, clients, quotes)
- Keep accounting features (tax, expenses, bank imports, budgets, salary)
- Wire up Kombz → Pollenz sync
- Redeploy both apps

### Phase 6: Cross-Product Integration

- Define API contracts for Swarmz → Kombz
- Implement integration endpoints
- Shared auth via Hivez (or token exchange)

---

## Key Files to Migrate from Pollenz

### To Kombz (Operational)

#### Backend (apps/pollenz/backend/)

| Feature | Source Files |
|---------|------------|
| Invoices | `Controllers/Api/InvoiceController.php`, `Models/Invoice.php`, `Models/InvoiceItem.php` |
| Clients | `Controllers/Api/ClientController.php`, `Models/Client.php` |
| Business Profile | `Controllers/Api/BusinessProfileController.php`, `Models/BusinessProfile.php` |
| Services/Products | `Controllers/Api/ServiceController.php`, `Models/Service.php` |

#### Frontend (apps/pollenz/frontend/src/)

| Feature | Source Files |
|---------|------------|
| Invoices | `pages/InvoicesPage.vue`, `pages/InvoiceEditPage.vue`, `pages/InvoiceViewPage.vue` |
| Clients | `pages/ClientsPage.vue` |
| Stores | `stores/invoice.store.ts`, `stores/client.store.ts` |
| API | `services/api/invoices.api.ts`, `services/api/clients.api.ts` |
| PDF | `services/pdf/InvoicePdfService.ts` |

### Stays in Pollenz (Accounting & Tax)

| Feature | Files |
|---------|-------|
| Tax | `Controllers/Api/TaxController.php`, `Models/TaxSetting.php`, `Services/TaxPackService.php` |
| Vendor Expenses | `Controllers/Api/VendorInvoiceController.php`, `Models/VendorInvoice.php` |
| Travel Deductions | `Controllers/Api/VehicleController.php`, `Models/Vehicle.php`, `Models/Trip.php` |
| Receipts | `Controllers/Api/ReceiptController.php`, `Models/Receipt.php` |
| Bank Import | `services/parsers/NedbankParser.ts`, import flow |
| Categories | `stores/categories.store.ts`, categorization service |
| Budgets | Budget pages and stores |
| Salary | Salary/payroll features |

---

## Notes

- **Kombz** = Honeycomb — structured cells, each holding value. Fits structured operations.
- **Pollenz** = Pollen gatherer — collecting financial data. Fits accounting/tax.
- Quotes moved to Kombz core (not contractor-specific — any business quotes).
- PostgreSQL schemas give clean module isolation while allowing cross-module foreign keys.
- Feature folders are right-sized for now; can extract to Laravel packages later if needed.
- Travel expenses stay in Pollenz (SARS deduction = accounting concern). Swarmz handles fleet ops.
- All UUIDs, all Sanctum token auth, same patterns as Pollenz.
- Payment tracking syncs both ways: Kombz (operational status) ↔ Pollenz (accounting entry).
