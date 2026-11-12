# Gym Management App

Multi-tenant gym management platform: a Node.js REST API (`backend/`), a React + Vite web client (`frontend/`), shared Zod schemas and types (`shared/`) and a planned mobile app (`mobile/`). See `ARCHITECTURE.md` for the design and `PRODUCT_REQUIREMENTS.md` for requirements.

## Roles

- **Super Admin**: platform owner; manages gyms and platform subscriptions
- **Gym Admin**: manages one gym (clients, memberships, attendance, products, programs)
- **Client**: gym member (membership, attendance, balance, programs)

## Tech Stack

| Layer      | Technology                                                    |
| ---------- | ------------------------------------------------------------- |
| Backend    | Node.js, Express 5, TypeScript (strict)                       |
| Database   | PostgreSQL + Prisma                                           |
| Auth       | Better Auth (cookie web, bearer mobile)                       |
| Validation | Zod (`shared/`)                                               |
| Frontend   | React 19, Vite, react-router, TanStack Query, React Hook Form |
| Styling    | Tailwind CSS                                                  |
| Quality    | ESLint, Prettier, Vitest                                      |

## Getting Started

Requires Node 20.11+ (Vite 6, Prisma 6 and Vitest 3 are the pinned majors for it; Vite 7 needs Node 20.19+) and Docker.

```bash
npm install
cp backend/.env.example backend/.env   # then fill in values
npm run db:up                          # start Postgres (Docker, host port 5433)
npm run db:migrate
npm run db:seed
npm run dev:backend                    # API on http://localhost:4000
npm run dev:frontend                   # web app on http://localhost:5173
```

Seeded accounts use the password `Password123!` (for example `owner@platform.test`, `admin@alpha.test`, `client@alpha.test`). Re-run `npm run db:seed` after schema changes. If `prisma generate` fails with EPERM on Windows, stop the API first.

Check it works: `GET http://localhost:4000/health` returns `{ "status": "ok" }`, the seeded super admin, gym admin and client can sign in, and Gym A's admin cannot see Gym B's data.

## Commands (repo root)

```bash
npm run dev:backend    npm run lint         npm run db:up
npm run dev:frontend   npm run type-check   npm run db:migrate
npm run build          npm run test         npm run db:seed
```

Tests use a separate database: create `gym_app_test`, set its URL in `backend/.env.test`, run `npm run db:test:setup -w backend`, then `npm run test`.

## Project Docs

- `ARCHITECTURE.md` - design, layers, tenancy rules
- `claude.md` - quick project reference
- `mobile/README.md`, `mobile/API_CONTRACT.md` - how mobile consumes the API
- `.github/instructions/` - code rules per folder (backend, frontend, shared, mobile)
- `.github/skills/SKILLS.md` - code templates

## Environment Variables

| Variable             | Where    | Purpose                                   |
| -------------------- | -------- | ----------------------------------------- |
| `DATABASE_URL`       | backend  | PostgreSQL connection string              |
| `BETTER_AUTH_SECRET` | backend  | Secret used to sign sessions              |
| `BETTER_AUTH_URL`    | backend  | Public base URL of the API                |
| `PORT`               | backend  | API port (default 4000)                   |
| `CORS_ORIGINS`       | backend  | Comma-separated web origins (credentials) |
| `VITE_API_BASE_URL`  | frontend | API origin; empty uses the dev proxy      |
