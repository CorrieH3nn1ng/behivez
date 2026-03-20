# PennyPilot

AI-powered personal finance app for South African consumers and freelancers. Built with an offline-first, privacy-centric architecture that puts users in control of their financial journey.

---

## Core Architectural Directives

These principles guide ALL code decisions in PennyPilot:

### 1. Modular Domain Logic (Pluggable Banks)
All bank-specific code is isolated behind interfaces, enabling future integration with any South African bank (FNB, Standard Bank, Capitec, Absa) without touching core business logic.

```
BankParser (Interface)
├── NedbankParser
├── FnbParser (future)
├── StandardBankParser (future)
└── CapitecParser (future)
```

### 2. Zero-Knowledge Security (POPIA Compliant)
- **Encrypted-at-rest**: All sensitive data encrypted before storage
- **Client-side encryption**: Keys never leave the user's device
- **12-word recovery phrase**: For key backup and restoration
- **No plaintext on server**: Server sees only encrypted blobs
- **POPIA compliance**: Full data portability and deletion rights

### 3. Oplog-Based Sync (Offline-First)
Instead of syncing full records, we sync **operations** (create, update, delete). This enables:
- Optimistic UI (instant feedback)
- Conflict resolution (last-write-wins or merge)
- Offline queue with automatic retry
- Data integrity across devices

```
User Action → Local Storage → Oplog Entry → Background Sync → Server
```

### 4. Penny's Soul (Fuzzy AI Persona)
Penny is not just an app - she's a financial companion with personality:
- **n8n Integration**: Webhook-based memory and context
- **Empathetic Responses**: Understands user frustration and celebrates wins
- **Proactive Insights**: "I noticed you spent more on dining this month..."
- **Gamified Guidance**: Quests and achievements delivered with personality

### 5. Financial Quests (Gamification-First)
Premium features are unlocked through engagement, not just payment:
- **Quests**: "Categorize 50 transactions" → Unlock insights
- **Streaks**: Daily login bonuses
- **Achievements**: Badges for financial milestones
- **Leaderboards**: Optional community comparison
- **Tier Unlocks**: Quest completion contributes to tier progression

---

## Features

- **Transaction Management** - Import bank statements, categorize transactions
- **Smart Categorization** - Auto-categorize with SA merchant keywords
- **Budgeting** - 50-30-20 budget methodology
- **Invoicing** - Create and manage invoices for clients
- **AI Extraction** - Extract invoice data from PDFs using AI
- **Tax Provisioning** - Track and provision for tax payments
- **Offline-First** - Works without internet, syncs when online

See **[docs/FEATURES.md](docs/FEATURES.md)** for complete feature documentation.

## Tech Stack

- **Frontend:** Vue.js 3 + Quasar Framework (TypeScript)
- **Backend:** Laravel 12 + PHP 8.4 + MySQL 8.0
- **Offline Storage:** LocalBase (IndexedDB)
- **AI:** Google Gemini Vision API

## Project Structure

```
pilot/
├── apps/
│   └── pennypilot/
│       ├── frontend/    # Quasar Vue.js PWA
│       └── backend/     # Laravel API
├── docs/                # Documentation
│   ├── FEATURES.md      # Feature documentation
│   └── CATEGORIZATION.md # Categorization rules
├── packages/            # Shared code
└── scripts/             # Setup scripts
```

## Getting Started

### Prerequisites

- Node.js 22+
- PHP 8.4+
- MySQL 8.0+
- Composer

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/pilot.git
cd pilot

# Install frontend dependencies
cd apps/pennypilot/frontend
npm install

# Install backend dependencies
cd ../backend
composer install

# Copy environment files
cp .env.example .env
# Edit .env with your database credentials and GEMINI_API_KEY

# Run database migrations
php artisan migrate

# Seed default categories
php artisan db:seed
```

### Development

```bash
# Terminal 1: Frontend (port 9000)
cd apps/pennypilot/frontend
npm run dev

# Terminal 2: Backend (port 8000)
cd apps/pennypilot/backend
php artisan serve
```

### Testing

```bash
# Frontend
cd apps/pennypilot/frontend
npm run lint              # Lint
npx vue-tsc --noEmit      # Type check

# Backend
cd apps/pennypilot/backend
php artisan test
```

## Documentation

| Document | Description |
|----------|-------------|
| **[PROGRESS.md](docs/PROGRESS.md)** | Build progress and roadmap |
| **[FEATURES.md](docs/FEATURES.md)** | Complete feature documentation |
| **[CATEGORIZATION.md](docs/CATEGORIZATION.md)** | How transaction categorization works |
| **[CLAUDE.md](CLAUDE.md)** | Context for Claude Code AI assistant |

## Environment Variables

### Backend (.env)
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=pennypilot
DB_USERNAME=root
DB_PASSWORD=

GEMINI_API_KEY=your_api_key   # For AI invoice extraction
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
```

## Git Workflow

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/PP-XXX-description` - New features
- `fix/PP-XXX-description` - Bug fixes

## License

Proprietary - All rights reserved
