# 3DM Store — Multi-Vendor .3DM Marketplace

A production-ready marketplace for buying and selling Rhino 3D (.3dm) files. Built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, Prisma ORM, and Coinbase Commerce (crypto payments).

## Quick Start (SQLite — no Docker needed)

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Setup database (creates SQLite file + seeds test data)
npm run setup:sqlite

# 3. Start dev server
npm run dev
```

Visit **http://localhost:3000**

### Test Accounts

| Role     | Email                       | Password         |
|----------|-----------------------------|------------------|
| Admin    | admin@3dmstore.com       | admin123456      |
| Designer | designer@example.com        | designer123456   |
| Buyer    | buyer@example.com           | buyer123456      |

## Features

- **Auth** — Register, login, email verification, password reset
- **Roles** — Buyer, Designer, Admin with full RBAC
- **Marketplace** — Browse, search, filter, paginate, categories
- **Listings** — Upload .3dm files with preview images, license selection
- **Payments** — Coinbase Commerce (USDC/BTC/ETH) with configurable platform commission (15%)
- **Downloads** — Secure file access only after payment
- **Designer Studio** — Dashboard, analytics, earnings, wallet setup
- **Admin Panel** — Manage users, listings, disputes, applications
- **Legal** — Terms of Service, Privacy Policy, DMCA, Designer Agreement

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend  | Next.js API Routes (Route Handlers) |
| Database | Prisma ORM + SQLite (dev) / PostgreSQL (prod) |
| Auth     | NextAuth.js v5 (Auth.js) with JWT |
| Payments | Coinbase Commerce (crypto) |
| Storage  | Local filesystem (swappable to AWS S3 / Cloudflare R2) |

## Project Structure

```
├── prisma/                    # Database schema & seed
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, register, password reset
│   │   ├── (legal)/           # Terms, Privacy, DMCA, Agreement
│   │   ├── (marketplace)/     # Browse, product detail, categories
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # 33 REST API endpoints
│   │   └── dashboard/         # User & designer dashboards
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Auth, DB, Coinbase, upload, email utilities
│   └── types/                 # TypeScript type definitions
├── uploads/                   # Local file storage
├── docker-compose.yml         # PostgreSQL (optional)
├── setup-local.bat            # One-click Windows setup
└── AGENTS.md                  # Full technical documentation
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run setup:sqlite` | Initialize SQLite DB + seed |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed test data |
| `npm run db:studio` | Open Prisma Studio (GUI) |
| `setup-local.bat` | Full Windows setup (one click) |

## Switching to PostgreSQL (Production)

1. Install PostgreSQL or use Neon.tech (free cloud)
2. Run: `npm run db:use-postgres`
3. Update `DATABASE_URL` in `.env`
4. Run: `npm run db:generate && npm run db:push`

## API Overview (33 endpoints)

- `POST /api/auth/register` — Create account
- `GET /api/listings?query=&category=&sort=&page=` — Browse marketplace
- `POST /api/listings` — Create listing (designer)
- `POST /api/payments/create-payment-intent` — Purchase
- `POST /api/payments/webhook` — Coinbase Commerce webhook
- `GET /api/purchases` — Purchase history
- `GET /api/downloads/:transactionId` — Secure file download
- `GET /api/admin/stats` — Platform analytics

Full API documentation in `AGENTS.md`.

## Architecture

No separate backend server — all logic runs in Next.js API routes (Route Handlers). This makes deployment trivial on Vercel. The Prisma ORM abstracts the database layer, Coinbase Commerce handles crypto payments, and local file storage is architected for easy S3/R2 migration.

## License

Built for the Rhino 3D community. MIT.
