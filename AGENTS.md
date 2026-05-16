# 3DM Store - Multi-Vendor .3DM Marketplace

A production-ready marketplace for buying and selling Rhino 3D (.3dm) files, built with Next.js, TypeScript, Tailwind CSS, PostgreSQL, and Stripe Connect.

## Quick Start

### Prerequisites
- Node.js 18+ 
- Docker Desktop (for PostgreSQL)
- Stripe account (for payments)

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Start Database
```bash
docker compose up -d
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Stripe test keys
```

### 4. Setup Database
```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

## Test Accounts (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@3dmstore.com | admin123456 |
| Designer | designer@example.com | designer123456 |
| Buyer | buyer@example.com | buyer123456 |

## Architecture

### Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend:** Next.js API Routes (Route Handlers)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js v5 (Auth.js) with JWT + Credentials
- **Payments:** Stripe Connect (Express accounts)
- **File Storage:** Local filesystem (swappable to S3/R2)

### Key Architecture Decisions
- **App Router** with route groups for auth, marketplace, dashboard, admin
- **API Routes** for all backend logic (no separate Express server needed)
- **Prisma** for type-safe database access and migrations
- **NextAuth.js** with JWT strategy (no database sessions needed)
- **Stripe Connect Express** for marketplace payment flows
- **Middleware** for route protection
- **Local uploads** for development, architected for S3/R2 migration

## Project Structure

```
├── prisma/                    # Database schema & migrations
│   ├── schema.prisma          # Full data model
│   └── seed.ts                # Test data seeder
├── src/
│   ├── app/
│   │   ├── (auth)/auth/       # Login, register, password reset
│   │   ├── (legal)/           # Terms, Privacy, DMCA, Designer Agreement
│   │   ├── (marketplace)/     # Browse, product detail, categories
│   │   ├── admin/             # Admin panel pages
│   │   ├── api/               # All API route handlers
│   │   │   ├── admin/         # Admin API (users, listings, stats)
│   │   │   ├── auth/          # Auth API (register, verify, reset)
│   │   │   ├── listings/      # Marketplace CRUD API
│   │   │   ├── payments/      # Stripe payment & webhook API
│   │   │   └── ...            # Reviews, favorites, uploads, etc.
│   │   ├── dashboard/         # User dashboards
│   │   │   ├── designer/      # Designer studio, upload, earnings
│   │   │   ├── purchases/     # Purchase history
│   │   │   └── favorites/     # Saved items
│   │   └── page.tsx           # Homepage
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   └── layout/            # Header, Footer, Providers
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── stripe.ts          # Stripe helpers & commission logic
│   │   ├── upload.ts          # File upload utilities
│   │   ├── email.ts           # Email service abstraction
│   │   └── utils.ts           # Shared utilities
│   └── types/                 # TypeScript type definitions
├── uploads/                   # Local file storage
│   ├── models/                # Uploaded .3dm files
│   ├── previews/              # Uploaded preview images
│   └── temp/                  # Temporary uploads
├── middleware.ts              # Route protection
├── docker-compose.yml         # PostgreSQL for local dev
├── .env.example               # Environment template
└── package.json               # Dependencies & scripts
```

## Database Schema (29 models)

Core entities:
- **User** - Buyers, designers, admins with role-based access
- **Listing** - .3dm file listings with status workflow (draft → pending → approved/rejected)
- **Category** - Hierarchical categories with parent/child relationships
- **Transaction** - Payment records with commission tracking
- **Review** - Buyer reviews for purchased items
- **Favorite** - User wishlists
- **Download** - Download audit log
- **Earnings** - Designer earning balances
- **Withdrawal** - Payout requests
- **Dispute** - Buyer/designer dispute management
- **DMCAReport** - Copyright infringement reports
- **DesignerApplication** - Designer onboarding flow
- **PayoutMethod** - Designer payout configuration
- **EmailVerification** - Email verification tokens
- **PasswordReset** - Password reset tokens
- **Account, Session** - NextAuth required models

## API Routes (33 endpoints)

### Authentication
- `POST /api/auth/register` - Create account
- `GET /api/auth/verify?token=` - Verify email
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Execute reset
- `GET/POST /api/auth/[...nextauth]` - NextAuth handler

### Marketplace
- `GET /api/listings` - Browse with filters, search, pagination
- `GET /api/listings/:id` - Single listing detail
- `GET /api/listings/by-slug?slug=` - Listing by slug
- `POST /api/listings` - Create listing (designer only)
- `PATCH /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Archive listing
- `GET /api/categories` - All categories with counts
- `GET /api/uploads/:path*` - Serve uploaded files

### Payments (Stripe Connect)
- `POST /api/payments/create-payment-intent` - Create payment
- `POST /api/payments/stripe-connect` - Designer Stripe onboarding
- `POST /api/payments/webhook` - Stripe webhook handler

### User
- `GET/PATCH /api/users/profile` - Profile management
- `GET/POST /api/users/designer-application` - Designer onboarding
- `GET /api/purchases` - User purchase history
- `GET /api/purchases/check?listingId=` - Check purchase status

### Reviews & Favorites
- `POST /api/reviews` - Submit review
- `GET/POST /api/favorites` - Manage favorites

### Downloads
- `GET /api/downloads/:transactionId` - Secure file download

### Dashboard
- `GET /api/dashboard/designer/stats` - Designer analytics
- `GET /api/dashboard/designer/sales` - Designer sales history

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/listings` - All listings management
- `GET /api/admin/users` - User management
- `GET /api/admin/applications` - Designer applications
- `PATCH /api/admin/applications/:id` - Approve/reject application
- `GET /api/admin/disputes` - Dispute management
- `GET /api/admin/dmca` - DMCA report management
- `GET/POST /api/admin/commission` - Commission settings

### Legal
- `POST /api/dmca` - Submit DMCA report
- `POST /api/disputes` - Submit dispute

## Payment Flow

1. **Buyer clicks "Buy Now"** → Creates Stripe PaymentIntent with platform fee
2. **Stripe Checkout / Elements** → Buyer enters payment
3. **Stripe Webhook** → `payment_intent.succeeded` updates transaction status
4. **Earnings credited** → Designer's available balance increases
5. **Download access** → Buyer can download file immediately
6. **Payout** → Designer requests withdrawal → Stripe transfer

### Commission Logic
- Platform takes configurable % (default 15%) from each sale
- Commission is calculated server-side via `calculateCommission()`
- Stripe Connect `application_fee_amount` handles automatic deduction
- Designer receives `amount - commission` directly via Stripe

## Security Features

- **Password hashing** with bcryptjs (12 rounds)
- **JWT sessions** via NextAuth.js
- **File validation** - Only .3dm files allowed, max 500MB
- **File hash** - SHA-256 hash stored for integrity verification
- **Download authentication** - Protected download endpoints
- **Role-based access** - Admin/Designer/Buyer authorization checks
- **API validation** - Zod schemas for all inputs
- **Stripe webhook verification** - Signature validation
- **CORS headers** on upload routes
- **SQL injection prevention** via Prisma parameterized queries

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Vercel Deployment
1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy

### Database Migration
```bash
npx prisma migrate deploy  # For production
npx prisma migrate dev     # For development
```

### File Storage Migration to S3/R2
1. Replace `upload.ts` lib with S3 SDK (`@aws-sdk/client-s3`)
2. Update `saveModelFile()` and `savePreviewImage()` to upload to S3
3. Update `/api/uploads/[...path]` route to generate signed URLs
4. Add S3 bucket configuration to `.env`

## Stripe Setup

1. Create Stripe account and get API keys
2. Enable Stripe Connect in Dashboard
3. Set up webhook endpoint pointing to `/api/payments/webhook`
4. Configure Connect platform settings (branding, etc.)
5. Add Stripe keys to `.env`

## Key Environment Variables

```
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-secret-32-chars-min"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
PLATFORM_COMMISSION_PERCENT=15
```

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to DB |
| `npm run db:migrate` | Create migration |
| `npm run db:seed` | Seed test data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run setup` | Generate + push + seed |
