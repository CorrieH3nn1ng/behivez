# PennyPilot Features

## Overview

PennyPilot is an AI-powered personal finance app designed for South African consumers, with offline-first architecture, intelligent transaction categorization, and comprehensive freelancer/sole proprietor support including invoicing, tax practice, travel logbook, receipt capture, and income tracking.

## Target Users

1. **Personal Finance Users** - Track spending, categorize transactions, budget
2. **Freelancers/Contractors** - Invoice clients, track income, provision for tax, travel deductions
3. **Sole Proprietors** - Manage business profile, clients, cash flow, and SARS compliance

---

## Core Features

### 1. CSV Import (Bank Statements)

Import bank statements directly from CSV files.

- **Supported Banks:** Nedbank (more coming soon)
- **Date Format:** Handles `ddMMMyyyy` format (e.g., `25Jan2025`)
- **Auto-detection:** Skips metadata rows and summary lines
- **Duplicate Prevention:** Composite key detection prevents duplicate imports

**Usage:**
1. Go to Import CSV
2. Select your Nedbank CSV file
3. Review the preview
4. Click Import

### 2. Dashboard

Real-time overview of your finances with flight-deck inspired design.

- **Current Balance:** Calculated from opening balance + transactions
- **Income/Expenses Summary:** Total income and expenses
- **Opening Balance:** Set your bank balance to calculate correct totals
- **Uncategorized Alert:** Shows count of transactions needing categorization
- **Penny Insight Card:** AI-powered proactive financial insights
- **Travel Summary Card:** Business km and tax deductible travel amount
- **Flight Briefing:** Quick financial status overview

#### Charts (Carousel)
- **Spending by Category:** Doughnut chart showing expense breakdown
- **Monthly Trend:** Bar chart comparing income vs expenses over 6 months
- **Flight Deck Grid:** Key financial metrics at a glance

### 3. Transaction Management

Full control over your transactions.

#### Tabs
- **All:** View all transactions with monthly summary cards
- **Uncategorized:** Focus on transactions needing categorization
- **Categorized:** View already categorized transactions

#### Monthly Summary Cards
- Click a month card to filter transactions
- Shows income, expenses, and transaction count per month

#### Quick Filters
- Quick filter tabs for fast transaction filtering

#### Filters
- Search by description
- Filter by category
- Date range filtering

#### Transfer Detection
- Mark transactions as transfers between accounts
- Transfers excluded from income/expense calculations

#### Global Transaction Rules
- Cross-month pattern matching for recurring transactions
- Auto-apply categories based on merchant patterns

### 4. Smart Categorization

#### Auto-Categorization
Automatically categorizes transactions based on merchant keywords.

**Built-in South African Merchants:**
| Category | Examples |
|----------|----------|
| Groceries | Checkers, Pick n Pay, Woolworths, Shoprite |
| Transport | Uber, Bolt, Gautrain, E-toll |
| Fuel | Engen, Shell, Caltex, Sasol |
| Dining Out | Uber Eats, Nandos, KFC, Steers |
| Entertainment | Netflix, DStv, Showmax |
| Software/AI | Claude AI, GitHub, AWS, Slack |
| Phone | MTN, Vodacom, Telkom |
| Hosting/Servers | Afrihost, Hetzner |
| ... | 25+ categories |

#### Learning Categorization
The system learns from your manual categorizations.

1. Categorize a transaction manually
2. Toggle "Apply to similar transactions"
3. Adjust the pattern if needed
4. All matching transactions are categorized
5. Rule is saved for future auto-categorization

#### Merchant Normalization
- **MerchantNormalizerService** standardizes merchant names for consistent categorization

### 5. Custom Categories

Create your own categories for specific tracking.

- **From Categories Page:** Full customization with icon and color
- **Quick Add:** Create categories while categorizing a transaction
- **Tax Deduction Settings:** Mark categories as tax-deductible with deduction type and percentage

**Deduction Types:**
| Type | Description | Example |
|------|-------------|---------|
| `full` | 100% deductible | Software/AI subscriptions |
| `home_office_pct` | Home office percentage | Fibre, Electricity |
| `vehicle` | Handled by Fixed Cost method | Fuel |
| `custom` | Custom percentage | Mixed-use expenses |
| `none` | Not deductible | Personal expenses |

### 6. Sync to Server (Premium)

Push local transactions to the backend for backup and multi-device access.

- Click sync icon in header
- Pull from server to restore data
- Transactions marked as synced
- Duplicate detection prevents double-syncing

---

## Financial Setup

### 7. Income Sources

Define your expected income streams for budgeting.

**Income Types:**
- Salary (fixed monthly)
- Freelance/Contract (hourly, daily, or fixed rates)
- Investment income
- Rental income
- Side hustle
- Other

**Features:**
- Set gross amount and frequency
- Calculate estimated monthly income
- Track net amount after deductions
- Support for hourly/daily rate calculation
- Activate/deactivate income sources

### 8. Fixed Expenses

Track recurring monthly expenses for budgeting.

- Rent/mortgage
- Insurance premiums
- Subscriptions
- Loan payments

**Features:**
- Set due day of month
- Assign to budget bucket (Needs/Wants/Savings)
- Link to categories
- Monthly and annual totals

### 9. Blueprint System (Recurring Expenses)

Advanced recurring expense management with auto-matching.

**Features:**
- Define expected monthly expenses with amounts and tolerances
- Auto-match transactions to blueprints using BlueprintMatchingService
- Track match status (matched, unmatched, over/under budget)
- Due date tracking with alerts
- Blueprint page with visual match status

**Usage:**
1. Create blueprints for recurring expenses (rent, insurance, subscriptions)
2. Set expected amount and tolerance (e.g., R1,500 +/- R50)
3. Transactions auto-match to blueprints each month
4. Dashboard shows unmatched blueprints requiring attention

---

## Tax & SARS Compliance

### 10. Tax Settings & Provisioning

Configure tax provisioning for freelancers and self-employed.

**Employment Types:**
- Employed (PAYE handled by employer)
- Self-employed (need to provision for tax)
- Mixed (both employment and freelance income)

**Features:**
- Set estimated annual income
- Calculate provisional tax payments
- Track monthly tax provisions
- SA tax bracket calculations with rebates (TaxCalculatorService)
- Provisional payment reminders (August/February)
- Vehicle method selection: Flat Rate or Fixed Cost

### 11. Tax Page (Tabbed Interface)

Comprehensive tax management with six tabs:

| Tab | Component | Purpose |
|-----|-----------|---------|
| **Ledger** | TaxLedgerTab | Tax transaction ledger view |
| **Shield** | TaxShieldTab | Tax deduction shield analysis |
| **Projection** | TaxProjectionTab | Annual tax projection |
| **Vehicle** | VehicleConfigTab | SARS Fixed Cost vehicle configuration |
| **Home Office** | HomeOfficeConfigTab | Home office deduction setup |
| **Monthly Practice** | MonthlyPracticeTab | Monthly tax practice dashboard |

### 12. Vehicle Configuration (SARS Fixed Cost Method)

Vehicle details and automatic SARS bracket calculation for travel deductions.

**Features:**
- Enter vehicle details (make, model, year, registration, purchase price)
- Auto-select SARS cost bracket based on purchase price
- Calculate deemed cost: `(Fixed Cost PA x days/365) + (Fuel c/km x Total KM) + (Maint c/km x Total KM)`
- Calculate deduction: `Deemed Cost x Business %`
- Live bracket preview when entering purchase price
- Sync from Logbook: Auto-pull total/business km from Trip database
- Business use percentage calculation

**SARS Brackets (2025/26):**
Stored in CountryConfig as single source of truth. Brackets from R0-R100k through R800k+, each with fixed cost, fuel c/km, and maintenance c/km values.

### 13. Home Office Configuration

Property measurements and automatic office percentage calculation.

**Features:**
- Enter total property area (m2)
- Add office/study room area (m2)
- Auto-calculate percentage: `office area / total area x 100`
- Used by tax-aware categories with `home_office_pct` deduction type
- Dynamic structure list for multiple rooms

### 14. Monthly Tax Practice Engine

Monthly snapshot system tracking income, deductions, tax provision, and available cash.

**Calculation Flow:**
1. Sum income transactions for the month
2. Sum deductible expenses by category deduction type
3. Add prorated vehicle deduction (VehicleConfig / 12)
4. Calculate taxable income = gross - deductions
5. Project annual tax from YTD cumulative
6. Calculate monthly provision = annual_tax / 12
7. Determine available_cash = income - provision - blueprint_commitments

**Endpoints:**
- `GET /tax-practice/current` - Current month
- `GET /tax-practice/{year}/{month}` - Specific month
- `GET /tax-practice/year/{taxYear}` - Full year
- `POST /tax-practice/{year}/{month}/recalculate` - Force recalc
- `POST /tax-practice/{year}/{month}/close` - Close month
- `GET /tax-practice/ytd-summary` - YTD summary

**Dashboard (4 Quadrants):**
- Income summary
- Deductions breakdown
- Tax position (provision vs actual)
- Cash position (available after tax + commitments)

### 15. Tax Shield Analysis

Tax deduction optimization analysis via TaxShieldService.

- Identifies potential deductions you may be missing
- Categorizes deductions by type (full, home office, vehicle)
- Tracks total deduction shield value

### 16. Tax Pack Generator

Generate an annual SARS-ready tax submission pack as PDF.

**Sections:**
1. Income Summary
2. Deduction Summary
3. Expense Breakdown by Category
4. Vehicle Calculation (SARS Fixed Cost Method)
5. Home Office Calculation
6. Tax Calculation (brackets, rebates)
7. Provisional Tax Payments
8. Monthly Breakdown
9. Checklist & Declaration

**Endpoint:** `GET /tax-pack/{taxYear}/pdf`

---

## Travel & Logbook

### 17. Google Timeline Import

Import trip data from Google Takeout for automatic travel logbook.

**Supported Formats:**
- `timelineEdits` (Google Takeout 2025+ format)
- `semanticSegments` (older format)
- `timelineObjects` (legacy format)

**Features:**
- Upload `.zip` (Google Takeout archive) or `.json` files
- Auto-extract Timeline JSON from Takeout ZIP
- Configure geofence locations (home + multiple business sites)
- Preview import (dry run) before committing
- Auto-categorize trips: Business, Commute, Private
- Duplicate detection prevents re-importing
- Mirror trip creation (detect return journeys)
- GPS road distance when available

**Usage:**
1. Configure home location (GPS coordinates)
2. Add business locations (e.g., "Nucleus Mining", lat/lng)
3. Upload Google Takeout .zip file
4. Preview results (dry run)
5. Import trips

### 18. Travel Logbook (SARS Compliant)

Printable logbook for SARS travel deduction claims.

**Features:**
- SARS-compliant format with date, time, origin, destination, distance, purpose
- Filter by category (Business, Commute, Private)
- Total distance and trip count
- Tax deductible amount calculation (km x SARS rate)
- Vehicle Fixed Cost calculation display
- Business use percentage

### 19. Vehicle Config Logbook Sync

Auto-update vehicle configuration from travel data.

- Pull total km and business km from Trip database
- Auto-calculate business use percentage
- Covers current SA tax year (March - February)
- One-click "Sync from Logbook" button

---

## Receipt Management

### 20. Receipt Capture with AI

Photograph and extract data from receipts using Google Gemini AI.

**Features:**
- Upload receipt photo or PDF
- AI extraction via GeminiService: vendor, amount, date, VAT, category suggestion
- Match receipts to existing transactions
- Receipt gallery with match status
- Unmatch capability

**Endpoints:**
- `POST /receipts/upload` - Upload and extract
- `GET /receipts` - List receipts
- `POST /receipts/{id}/match` - Match to transaction

---

## Invoicing (Freelancers)

### 21. Clients

Manage your client database.

**Client Information:**
- Name and contact details
- Client code (for invoice numbering)
- Email and phone

**Billing Settings:**
- Billing period (e.g., 1st to last day of month)
- Payment day (e.g., 25th)
- Payment terms (e.g., 30 days)
- Default hourly/daily rate

### 22. Business Profile

Configure your business details for invoices.

**Business Information:**
- Business/trading name
- Registration number
- Tax number (for SARS)
- VAT number (if registered)

**Contact Details:**
- Business email and phone
- Website
- Physical address

**Banking Details:**
- Bank name and branch
- Account number
- Account type

**Invoice Settings:**
- Invoice prefix
- Default tax rate (e.g., 15% VAT)
- Payment terms text
- Default notes

### 23. Invoices

Create and manage invoices for clients.

**Invoice Types:**
- **Regular:** Create new invoices with line items
- **Historical:** Upload existing PDF invoices

**Invoice Lifecycle:**
- Draft -> Sent -> Paid (or Overdue -> Paid)
- Auto-detect overdue invoices

**Features:**
- Auto-generated invoice numbers (YYMMDDCCC-NNN format)
- Line items with quantity, unit price, descriptions
- Service-linked line items (from Service model)
- Tax calculation (VAT)
- PDF upload for historical invoices
- PDF generation (client-side via InvoicePdfService)
- Notes and payment terms

### 24. Services

Reusable service definitions for invoicing.

- Define services with description, rate, and unit
- Link to invoice line items for quick entry
- CRUD management via ServiceController

### 25. AI Invoice Extraction

Extract data from uploaded invoice PDFs using AI.

**Powered by:** Google Gemini Vision AI

**Extracted Fields:**
- Invoice number
- Invoice date and due date
- Client name and email
- Total amount
- Line items

**Features:**
- Upload PDF or image
- Auto-match to existing clients
- Pre-fill invoice form
- Suggest potential transaction matches

### 26. Invoice-Transaction Matching

Link invoices to bank transactions to track payments.

**Auto-Matching:**
- Match by amount (exact or within tolerance)
- Match by invoice number in description
- Match by client name in description
- Score-based confidence ranking

**Manual Matching:**
- View potential matches for an invoice
- Select correct transaction
- Unmatch if needed

**When Matched:**
- Invoice marked as paid
- Payment date recorded
- Income entry created

---

## Budgeting

### 27. Budget (50-30-20 Methodology)

Create monthly budgets using the 50-30-20 rule.

**Buckets:**
- **Needs (50%):** Essential expenses (rent, utilities, groceries)
- **Wants (30%):** Discretionary spending (entertainment, dining out)
- **Savings (20%):** Savings, investments, debt repayment

**Features:**
- Auto-populate from fixed expenses
- Track actual vs planned spending
- Visual progress indicators
- Rollover options for unused budget
- Link budget items to categories

### 28. Budget Cards

Visual card-based budget tracking.

- Card view of budget items
- BudgetCard / BudgetCardItem models
- Quick visual spending overview

### 29. Goals

Set and track financial goals.

- Emergency fund targets
- Savings goals
- Debt payoff tracking
- Progress visualization

---

## Intelligence & AI

### 30. Financial Intelligence

AI-powered financial insights and analysis.

- **IntelligencePage** - Insights dashboard
- Pattern detection in spending
- Anomaly alerts
- Spending trend analysis

### 31. Penny AI Chat

AI-powered financial assistant with hybrid privacy architecture.

- Contextual financial advice
- Natural language queries about your finances
- Proactive insights displayed on dashboard (PennyInsightCard)
- Conversation memory (PennyMemory model)
- Privacy-first: sensitive data processed locally where possible

### 32. Audit Engine

Financial integrity verification and audit trail.

- **AuditEngineService** - Automated audit checks
- **TransactionAudit model** - Complete audit trail
- **AuditPage** - Dashboard with verification results
- Blueprint matching verification
- Exception detection and reporting
- Assign blueprints from audit view

---

## Settings & Account

### 33. User Account

- Profile management (name, email)
- Password change
- Logout
- Country configuration (SA defaults)

### 34. Subscription Tiers

**Free Tier:**
- Local storage only
- All core features
- Single device

**Premium Tier:**
- Cloud sync and backup
- Multi-device access
- AI features (Receipt extraction, Penny Chat)

### 35. Onboarding Wizard

Guided setup flow for new users.

- Step-by-step profile and financial setup
- Income source configuration
- Budget initialization

### 36. Groups

Transaction grouping and tagging system.

- Create custom groups for organizing transactions
- Tag transactions with multiple groups
- Group-based reporting

---

## Technical Architecture

### Offline-First

- All data stored locally in IndexedDB (LocalBase)
- Works without internet connection
- Sync when online (Premium)

### Mobile-First Design

- PWA (Progressive Web App) ready
- Responsive layouts for all screen sizes
- Full-screen dialogs on mobile
- Touch-friendly interactions (44px+ targets)
- Deep Teal primary color (#004D40)

### Data Flow

1. **Import:** CSV -> Parse -> LocalBase
2. **Categorize:** Auto-rules -> User confirmation -> Save
3. **Sync:** LocalBase -> API -> PostgreSQL (Premium)
4. **Invoicing:** Create -> Send -> Match to Transaction -> Mark Paid
5. **Tax Practice:** Transactions -> Categorize -> Deductions -> Provision -> Available Cash
6. **Travel:** Google Takeout -> Parse -> Trips -> Logbook -> Vehicle Config Sync

### Backend Services

| Service | Purpose |
|---------|---------|
| GeminiService | AI extraction (invoices, receipts) |
| InvoiceMatchingService | Match invoices to transactions |
| TaxCalculatorService | SA tax bracket calculations |
| TaxPracticeService | Monthly tax practice engine |
| TaxShieldService | Tax deduction optimization |
| TaxPackService | Annual tax pack generation |
| TelemetryImportService | Google Timeline import |
| AuditEngineService | Financial integrity checks |
| BlueprintMatchingService | Recurring expense matching |
| MerchantNormalizerService | Standardize merchant names |
| FinancialCalculator | Complex financial computations |
| UserResetService | Account data reset |

### Database (PostgreSQL)

| Domain | Models |
|--------|--------|
| **Core** | User, Transaction, Category, TransactionRule, TransactionAudit, Oplog |
| **Invoicing** | Client, Invoice, InvoiceItem, BusinessProfile, Service |
| **Budget** | BudgetPeriod, BudgetItem, BudgetCard, BudgetCardItem |
| **Financial** | IncomeSource, FixedExpense, Blueprint, Milestone, Liability, Group |
| **Tax** | TaxSetting, TaxProvision, MonthlyTaxPractice, CountryConfig |
| **Vehicle/Travel** | VehicleConfig, HomeOfficeConfig, Trip, TransportMethod |
| **AI/Receipts** | Receipt, PennyMemory |
| **Account** | Account |

---

## Categories Reference

### Expense Categories
- Groceries
- Transport
- Fuel
- Utilities
- Entertainment
- Dining Out
- Healthcare
- Shopping
- Insurance
- Bank Fees
- Subscriptions
- Medical Aid
- Pension
- Domestic Help
- Rates & Taxes
- Gambling/Lotto
- Business Expenses
- Software/AI
- Phone
- Hosting/Servers
- Fibre/Internet
- Electricity
- Vehicle Repairs
- Car Rental
- Office Supplies
- Professional Fees
- Other Expense

### Income Categories
- Salary
- Freelance/Contract
- Investment
- Refund
- Interest
- Other Income
