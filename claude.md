# Gym Management App - Claude Instructions

## Project Overview

Multi-tenant gym management platform. See `ARCHITECTURE.md` for the design and `PRODUCT_REQUIREMENTS.md` for requirements.

- **Super Admin**: platform owner; manages gyms, gym admins, platform subscriptions
- **Gym Admin**: manages one gym with one or more locations ("My gyms"); clients, memberships, attendance, products, programs are gym-wide
- **Client**: gym member; own membership, attendance, balance, programs (web now, mobile app planned)

The backend exposes a REST API used by both the web SPA and the mobile app.

## Monorepo Layout (npm workspaces)

```
backend/    Node.js + Express 5 + Prisma + Better Auth  (REST API on :4000)
frontend/   React 19 + Vite SPA + react-router          (dev server on :5173, proxies /api)
shared/     @gym/shared - Zod schemas + entity types used by backend and frontend
mobile/     README + API_CONTRACT.md (app not scaffolded yet)
docker-compose.yml   Postgres (host port 5433)
```

### backend/

```
prisma/               schema, migrations, seed
src/
  index.ts, app.ts    bootstrap, middleware order
  config/env.ts       PORT, CORS_ORIGINS, BETTER_AUTH_URL
  auth/               Better Auth (cookie + bearer plugin)
  db/                 Prisma singleton
  tenant/             session, context (requireTenant), scopedDb
  http/               withTenant/withPlatform/ok/parseBody, errorHandler
  routes/v1/<domain>.ts   thin Express routers
  services/<domain>/index.ts   business rules (+ tests beside)
  payments/, utils/, errors.ts
```

### frontend/

```
src/
  main.tsx, routes/index.tsx   router, role shells, guards
  views/<area>/[<domain>/]     pages (+ their drawers): gym, super-admin, client, auth, landing
  components/                  ui/ (Drawer, Modal, Table), common/, landing/, shared domain UI
  layouts/ hooks/<domain>/ services/<domain>/ providers/ styles/ utils/constants/
```

### shared/

`src/types/<domain>/index.ts` (+ barrel) and `src/validation/<domain>/index.ts`; imported as `@gym/shared/types` and `@gym/shared/validation/<domain>`.

Domain-first rule: one kebab-case plural domain name (`clients`, `gym-admins`, `memberships`, ...) is reused in every layer. Single-purpose modules are `<domain>/index.ts`; components are `<domain>/<Name>.tsx`. Never put multiple domains in one file. Rules: `.github/instructions/{backend,frontend,shared,mobile}.instructions.md`.

## Code Guidelines

- Strict TypeScript, no `any`. Functional components with hooks, no Next.js APIs or `'use client'`
- Business rules and DB access only in `backend/src/services/<domain>/index.ts`; routes stay thin
- Frontend data flow: React Query hooks (`hooks/<domain>`) -> fetchers (`services/<domain>`) -> `/api/v1`
- Forms: React Hook Form + Zod resolver using schemas from `@gym/shared`
- Name pages by domain (`GymAdminsPage`), never by role prefix
- Every API result shows a toast: each `useMutation` sets `meta: { success: '...' }` and `providers/QueryProvider` shows it (errors toast automatically; `components/ui/Toaster`, `utils/toast`). No duplicate success banners
- Long histories (balance, attendance, membership history) are cursor-paged and lazy-loaded: `useInfiniteQuery` + `components/ui/LoadMore` inside a scrolling container; the backend returns `{ <items>, nextCursor }`. Filters (transactions: date and amount range; membership history: status and period) use `components/ui/FilterBar`, debounced state and the same query

## Tenancy and Security (always)

- `gymId` comes from the session (cookie on web, bearer token on mobile), never from client input
- Services use the tenant-scoped db from `TenantContext`, never raw Prisma
- Check role and ownership on the server for every request (`withTenant`/`withPlatform`)
- Money is `Decimal`; client balance is a ledger sum; payment success is decided by the server
- Card payments use the `CardFields` form (Visa or Mastercard); the full card never leaves the browser, only `{ brand, last4 }` is sent. A member's card payment also needs a one-time code (`/payment-challenges`, `CardVerificationDialog`) before it is charged. Top-up amounts have no cap
- Platform subscription (Super Admin -> Gym) and gym membership (Gym -> Client) are separate concepts
- Any endpoint change must update `mobile/API_CONTRACT.md`

## Membership Plans and Pricing

- Plans are per gender (`male`/`female`) and weekly frequency (`weeklyVisits`: 3x, 4x, 5x, 6x, 0 = unlimited); the term (`type`: monthly, 3, 6, 12 months) makes the offers. Prices are in ALL (Albanian lek)
- Gym admins configure them on Membership > Configuration (`PriceMatrixEditor`, with extras, notes and photos); clients see the same prices (`PriceMatrix`) on their Membership page with the uploaded photos and subscribe by tapping a price (`SubscribeDialog`) with credit or card (cash is gym staff only); only active plans of their own gender show
- Check-in enforces `Membership.weeklyVisits` per local week. Full rules: `ARCHITECTURE.md` ("Membership plans and pricing")
- Memberships queue: `placeMembership` starts every new membership (self-service, staff assign, renew) the day after the client's last paid one ends, so a client can hold several (for example 4x for 1 month, then another, then a 4x 6-month offer). `upcoming` is the derived status of a paid membership that has not started; only the `active` one allows check-in. The client Membership page shows the queue (`MembershipQueue`) with each start and end date
- Changing any of this touches: `shared` (types/schemas), backend plan/membership/attendance services + tests, seed, `PriceMatrix`/`PriceMatrixEditor`, `mobile/API_CONTRACT.md`, and these docs

## Commands (run from the repo root)

```bash
npm run dev:backend    # API on http://localhost:4000
npm run dev:frontend   # SPA on http://localhost:5173
npm run build          # backend + frontend production builds
npm run lint           # ESLint (shared, backend, frontend)
npm run type-check     # tsc for all workspaces
npm run test           # backend Vitest (needs the test DB)
npm run db:up          # start Postgres (docker compose)
npm run db:migrate     # prisma migrate dev
npm run db:seed        # seed demo data
```

## When Helping

1. Inspect existing code first and reuse patterns
2. Keep changes small and scoped to the request
3. Follow the matching `.github/instructions/*.instructions.md`
4. Use `.github/skills/SKILLS.md` for templates
