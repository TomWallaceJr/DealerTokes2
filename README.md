# DealerTokes

DealerTokes is a Next.js + Prisma web app for poker dealers to log shifts and tokes, and see hourly trends.

## Stack
- **Next.js + TypeScript** (App Router)
- **Tailwind CSS**
- **Prisma** ORM
- **PostgreSQL** (via Docker for local dev)

## Quick Start

```bash
# 1) Get the code
unzip DealerTokes.zip && cd DealerTokes

# 2) Install deps
npm install

# 3) Start local Postgres
docker compose up -d

# 4) Set env
cp .env.example .env

# 5) Initialize Prisma & seed
npx prisma db push
npm run seed

# 6) Run dev server
npm run dev
```

App runs at http://localhost:3000

## Deployment

Environment variables (set in your hosting platform):

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Public site URL (e.g. https://your-domain.com)
- `NEXTAUTH_SECRET`: Strong random secret (generate with `openssl rand -hex 32`)
- `NEXT_PUBLIC_APP_NAME`: Branding name (e.g. DownCount)
- `NEXT_PUBLIC_DEMO_EMAIL`: Demo account email for the Try Demo button
- `NEXT_PUBLIC_DEMO_PASSWORD`: Demo account password
- `NEXT_PUBLIC_SENTRY_DSN` (optional): Sentry Browser DSN for client errors

Database + Prisma:

```bash
# run once per environment
npx prisma migrate deploy

# (optional) seed demo data — creates/updates demo user and generates shifts
npm run seed
```

Build & run:

```bash
npm run build
npm run start
```

Health check:

```
GET /api/health  -> { "status": "ok", "time": "..." }
```

## GitHub Repo (init & first push)

```bash
git init
git add .
git commit -m "feat: initial DealerTokes scaffold"
# create a repo on GitHub named DealerTokes, then:
git branch -M main
git remote add origin https://github.com/<YOUR-USER>/DealerTokes.git
git push -u origin main
```

## Roadmap (next steps)
- Auth (NextAuth or Clerk), user-specific data
- Import/export CSV
- Monthly/weekly stats, filters, room breakdowns
- Mobile-first PWA + offline queue
- Multi-user roles (dealer vs admin), room presets
- Automated backups
