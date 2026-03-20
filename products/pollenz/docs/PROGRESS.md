# PennyPilot Build Progress

## Core Architectural Directives

All code must adhere to these 5 pillars:

| Directive | Description | Status |
|-----------|-------------|--------|
| **1. Modular Domain Logic** | Pluggable bank integrations via interfaces | Complete |
| **2. Zero-Knowledge Security** | Encrypted-at-rest, POPIA compliant | Phase 3 |
| **3. Oplog Sync** | Operation Log for offline-first syncing | Complete |
| **4. Penny's Soul** | AI chat with hybrid privacy architecture | Complete |
| **5. Gamification** | Financial Quests to unlock premium features | Phase 2 |

---

## Phase 1: MVP - The Foundation (Complete)

### Core App
- [x] Basic Laravel Backend / Vue Frontend
- [x] User Authentication (Register, Login, Profile)
- [x] CSV Import for Nedbank
- [x] Transaction Management (List, Filter, Search)
- [x] Smart Categorization (SA Merchants, Learning Rules)
- [x] Custom Categories
- [x] Dashboard with Charts (Chart Carousel)
- [x] Offline-First Architecture (LocalBase/IndexedDB)
- [x] **Composite Key Duplicate Detection** (Prevents duplicate imports)
- [x] **Monthly Summary Cards** on Transactions page
- [x] **Quick Filter Tabs** on Transactions page
- [x] **Transfer Detection** (Mark transfers between accounts)

### Financial Setup
- [x] Income Sources Setup
- [x] Fixed Expenses Setup
- [x] Budget Setup UI (50/30/20 Rule)
- [x] Tax Settings & Provisioning (SA Provisional Tax Aug/Feb)

### Invoicing
- [x] Client Management (with billing settings)
- [x] Business Profile
- [x] Invoice Creation & Management
- [x] AI Invoice Extraction (Gemini Vision)
- [x] Invoice-Transaction Matching (Backend + Frontend)
- [x] PDF Invoice Generation (InvoicePdfService)
- [x] Unmatch All utility endpoint

### Sync Infrastructure (Directive #3: Oplog)
- [x] **Oplog table in LocalBase** (Operation Log for mutations)
- [x] **SyncManager.ts** (Optimistic UI, background sync)
- [x] **Backend sync/apply endpoint** (Oplog processing)
- [x] **Tier-based sync gating** (Free/Cruiser/Captain)

### Blockchain Prep ("Black Box" slots)
- [x] **metadata_hash field** on Transaction model
- [x] **Hash computation methods** (SHA-256)
- [x] **blockchain_anchor field** ready for future integration

### Pricing Tiers
- [x] **Updated tier system** (Free, Cruiser, Captain)
- [x] **Tier features configuration**
- [x] **Feature gating** (sync, OCR, limits)

### Modular Bank Support (Directive #1: Pluggable)
- [x] **BaseBankParser interface** (Abstract parser)
- [x] **NedbankParser implementation**
- [ ] **FnbParser** (Planned)
- [ ] **StandardBankParser** (Planned)
- [ ] **CapitecParser** (Planned)
- [ ] **AbsaParser** (Planned)

---

## Phase 1.5: Financial Intelligence (Complete)

### Blueprint System (Recurring Expense Management)
- [x] **Blueprint model** with expected amounts, due dates, tolerances
- [x] **BlueprintMatchingService** - Auto-match transactions to blueprints
- [x] **Global Transaction Rules** - Cross-month pattern matching
- [x] **Blueprint page** - Manage recurring expenses with match status
- [x] **TransactionRule model** - Rule-based categorization from server

### Audit Engine
- [x] **AuditEngineService** - Financial integrity verification
- [x] **TransactionAudit model** - Audit trail for all mutations
- [x] **AuditPage** - Audit dashboard with verification results
- [x] **AssignBlueprintModal** - Quick-assign blueprints from audit

### Financial Intelligence
- [x] **IntelligencePage** - AI-powered financial insights
- [x] **MerchantNormalizerService** - Standardize merchant names
- [x] **FinancialCalculator** - Complex financial computations

### Goals
- [x] **GoalsPage** - Financial goal tracking (emergency fund, savings, debt payoff)

### Groups
- [x] **Group model** - Transaction grouping/tagging
- [x] **GroupController** - CRUD for groups

### Penny AI Chat (Directive #4: Soul)
- [x] **PennyController** - AI chat backend with hybrid privacy architecture
- [x] **PennyMemory model** - Conversation memory storage
- [x] **PennyInsightCard** - Proactive insight display on dashboard

### Budget Card
- [x] **BudgetCardPage** - Visual budget card view
- [x] **BudgetCard / BudgetCardItem models** - Card-based budget tracking

### Onboarding
- [x] **OnboardingWizard** - Guided setup flow for new users
- [x] **OnboardingController** - Backend onboarding support

---

## Phase 2: Tax Practice System (Complete)

### 2A. SARS Vehicle Cost Scale
- [x] **CountryConfig model** - Single source for all SARS rates
- [x] **Vehicle cost brackets** in CountryConfig (R0-R100k through R800k+)
- [x] **CountryConfigSeeder** - SARS 2025/26 bracket data

### 2B. Vehicle Configuration (SARS Fixed Cost Method)
- [x] **VehicleConfig model** - Vehicle details, auto bracket selection
- [x] **VehicleConfigController** - CRUD + bracket calc + logbook sync
- [x] **VehicleConfigTab.vue** - Vehicle form, bracket display, deduction calc
- [x] **vehicleConfig.api.ts** - Frontend API service
- [x] **Auto-sync from logbook** - Pull total/business km from Trip database
- [x] **Bracket preview** - Live preview when entering purchase price

### 2C. Home Office Configuration
- [x] **HomeOfficeConfig model** - Property measurements, auto % calc
- [x] **HomeOfficeConfigController** - CRUD
- [x] **HomeOfficeConfigTab.vue** - Dynamic structure list, auto percentage
- [x] **homeOffice.api.ts** - Frontend API service

### 2D. Tax-Aware Categories
- [x] **Deduction metadata on categories** - `is_tax_deductible`, `deduction_type`, `default_deduction_pct`
- [x] **CategorySeeder updated** - Deduction info per category + new business categories
- [x] **CategoriesPage updated** - Show/edit deduction settings
- [x] **Deduction types**: full, home_office_pct, vehicle, custom, none

### 2E. Monthly Tax Practice Engine
- [x] **MonthlyTaxPractice model** - Monthly snapshot (income, deductions, provision, available cash)
- [x] **TaxPracticeService** - Core calculation engine
- [x] **TaxPracticeController** - Current/historical/YTD endpoints
- [x] **MonthlyPracticeTab.vue** - Monthly dashboard (Income, Deductions, Tax Position, Cash Position)
- [x] **taxPractice.api.ts / taxPractice.store.ts** - Frontend API + state

### 2F. Tax Page Tabs
- [x] **TaxLedgerTab** - Tax transaction ledger
- [x] **TaxShieldTab** - Tax deduction shield analysis
- [x] **TaxProjectionTab** - Annual tax projection
- [x] **TaxShieldService** - Deduction optimization backend

### 2G. Tax Calculator
- [x] **TaxCalculatorService** - SA tax bracket calculations with rebates
- [x] **Provisional tax payment tracking** (August/February)

---

## Phase 3: Travel & Telemetry (Complete)

### 3A. Google Timeline Import
- [x] **TelemetryImportService** - Parse Google Takeout data
- [x] **Three format support**: `semanticSegments`, `timelineEdits`, `timelineObjects`
- [x] **ZIP file support** - Extract Timeline JSON from Google Takeout .zip
- [x] **TelemetryController** - Upload, parse, import endpoints
- [x] **TelemetryImportPage.vue** - Upload UI with geofence config + preview
- [x] **Dry run mode** - Preview trips before importing
- [x] **Duplicate detection** - Prevent re-importing same trips

### 3B. Travel Logbook
- [x] **Trip model** - Trip records with category, distance, origin/destination
- [x] **TransportMethod model** - Transport types
- [x] **TravelLogbookPage.vue** - SARS-compliant logbook view
- [x] **Business trip classification** - Auto-categorize using geofence locations
- [x] **Mirror trips** - Detect and create return journeys
- [x] **Tax deduction display** - Show SARS rate deductible amount

### 3C. Geofence Configuration
- [x] **Home location** - GPS coordinates for home address
- [x] **Business locations** - Multiple client/work sites with names
- [x] **Auto-categorization** - Home↔Business = Business, Home↔Home = Private

---

## Phase 4: Receipt Capture & Tax Pack (Complete)

### 4A. Receipt Capture with AI
- [x] **Receipt model** - File storage, AI-extracted fields, match status
- [x] **ReceiptController** - Upload, list, match/unmatch endpoints
- [x] **GeminiService.extractReceipt()** - AI extraction (vendor, amount, date, VAT, category)
- [x] **ReceiptsPage.vue** - Receipt gallery with match status
- [x] **receipt.api.ts** - Frontend API service

### 4B. Tax Pack Generator
- [x] **TaxPackService** - Generate annual tax pack data
- [x] **tax-pack Blade template** - PDF layout with 9 sections
- [x] **PDF endpoint** - `GET /tax-pack/{taxYear}/pdf` using DomPDF
- [x] Sections: Income Summary, Deduction Summary, Expense Breakdown, Vehicle Calc, Home Office, Tax Calc, Provisional Tax, Monthly Breakdown, Checklist & Declaration

---

## Phase 5: Services & Invoicing Enhancements

### Services
- [x] **Service model** - Reusable service definitions for invoicing
- [x] **ServiceController** - CRUD for services
- [x] **services.api.ts** - Frontend API service

### Invoice Enhancements
- [x] **Service-linked line items** - Link invoice items to services
- [x] **Invoice PDF generation** - Client-side PDF via InvoicePdfService

---

## Remaining / Future Work

### Bank Parsers
- [ ] FNB CSV parser
- [ ] Standard Bank CSV parser
- [ ] Capitec CSV parser
- [ ] ABSA CSV parser

### Gamification (Directive #5)
- [ ] Quest system backend
- [ ] Quest UI components
- [ ] Achievement badges
- [ ] Streak tracking

### Zero-Knowledge Security (Directive #2)
- [ ] Client-side encryption (Web Crypto API)
- [ ] 12-word recovery phrase
- [ ] Encrypt before sync
- [ ] POPIA data export/deletion

### Platform
- [ ] PWA installation flow
- [ ] Push notifications
- [ ] Mobile app (Capacitor)

### Planned Features
- [ ] Subscription upgrade UI
- [ ] Multi-currency support
- [ ] Reports & export (beyond tax pack)
- [ ] Shared budgets
- [ ] Email invoice sending
- [ ] Recurring transaction detection

---

## Tier Features Matrix

| Feature | Free | Cruiser | Captain |
|---------|------|---------|---------|
| Local Storage | Yes | Yes | Yes |
| CSV Import | Yes | Yes | Yes |
| Categorization | Yes | Yes | Yes |
| Budgeting | Yes | Yes | Yes |
| Tax Practice | Yes | Yes | Yes |
| Travel Logbook | Yes | Yes | Yes |
| Cloud Sync | - | Yes | Yes |
| Multi-Device | - | Yes | Yes |
| PDF Export | - | Yes | Yes |
| Receipt AI | - | - | Yes |
| Penny AI Chat | - | Basic | Full |
| OCR/AI Extraction | - | - | Yes |
| Priority Support | - | - | Yes |
| Max Transactions | 500 | Unlimited | Unlimited |
| Max Invoices | 10 | 100 | Unlimited |

---

## Legend
- [x] Complete
- [ ] Pending
- **Bold** = Recently completed or priority item
