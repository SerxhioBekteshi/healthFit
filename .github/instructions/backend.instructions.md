---
description: Backend rules (Express + Prisma + Better Auth REST API for web and mobile). Applies when editing backend source or Prisma files.
applyTo: 'backend/{src,prisma}/**'
---

# Backend Instructions

Role, tenancy and billing rules apply whenever a task touches those domains. System design: `ARCHITECTURE.md`. Endpoint list for clients: `mobile/API_CONTRACT.md`.

---

## Architecture

- Node.js + Express 5 + TypeScript (strict, ESM). Entry `src/index.ts`, app factory `src/app.ts`.
- Layers: route (`src/routes/v1/<domain>.ts`) -> service (`src/services/<domain>/index.ts`) -> tenant-scoped Prisma.
- The API serves the Vite web app (session cookie) and mobile (bearer token). Never write logic that assumes a browser.
- Business rules and DB access live only in `src/services/<domain>/index.ts`. Routes stay thin: auth wrapper, parse, call service, `ok()`.
- Zod schemas and entity types come from `@gym/shared` (`@gym/shared/validation/<domain>`, `@gym/shared/types`). Do not redefine them here.

## Folder Structure

```
prisma/                      schema.prisma, migrations, seed.ts
src/
  index.ts, app.ts           bootstrap, middleware order
  config/env.ts              env parsing (PORT, CORS_ORIGINS, BETTER_AUTH_URL)
  auth/                      Better Auth config (cookie + bearer plugin)
  db/client.ts               Prisma singleton
  tenant/                    session, context (requireTenant/requirePlatform), scopedDb
  http/                      withTenant/withPlatform/ok/parseBody, errorHandler
  routes/v1/<domain>.ts      one Router per domain, mounted in routes/v1/index.ts
  services/<domain>/         index.ts (+ index.test.ts)
  payments/, utils/, errors.ts
```

- One kebab-case plural domain name is reused across layers (`clients`, `gym-admins`, ...). Never put several domains in one file or add flat files next to unrelated ones.
- Import with the `@/` alias (maps to `backend/src`) and by folder (`@/services/clients`). Keep files under 300 lines.

## Tenancy and Security

- Every tenant table has `gymId`; indexes start with `gymId`.
- `gymId` and `role` come from the session (cookie or bearer), never from body, query, URL or client headers.
- Services take a `TenantContext` and use `ctx.db` (tenant-scoped Prisma). Never import the raw Prisma client in a service.
- On creates pass `gymId: ctx.gymId` explicitly; the scoped db also forces it.
- Login accounts (User/Account) are not reachable through `ctx.db`; use the helpers in `src/tenant/` (`clientAccounts.ts`).
- Ledger changes run in one `ctx.db.$transaction` (Serializable when reading a balance) wrapped in `retryOnConflict`.
- Super admin cross-gym access uses explicitly named helpers only. Clients only reach rows tied to their own client profile.
- Return 404 (not 403) for rows that belong to another tenant.
- Never log secrets, tokens or password hashes.

## Routes and API

- Paths: `/api/v1/<resource>[/<id>|/<action>]`. Wrap every handler in `withTenant(roles, handler)` or `withPlatform(handler)` (they call `requireTenant`/`requirePlatform`); `/me` uses `requireUser`.
- Handler signature `(ctx, req, params) => Promise<ApiResult>`; return `ok(data, status?)`. Validate input with `parseBody(req, schema)`.
- Errors: throw `AppError` subclasses (`src/errors.ts`) or let `ZodError` bubble; `http/errorHandler.ts` maps them. Responses: success `{ data }`, error `{ message, code, issues? }`.
- Status codes: 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 422 validation, 500 server.
- Express 5 forwards async rejections; do not add try/catch just to call `next`.
- Payment success is decided by the server (provider result or webhook), never by client input.
- Never accept, log or store a full card number, CVC or expiry. A card payment carries only `card: { brand: 'visa' | 'mastercard', last4 }` (`cardSummarySchema`), recorded in the ledger description and provider metadata through `withCard`/`cardMetadata` in `payments/`. Replace the simulated provider with a hosted/tokenized one before taking real money.
- A deposit amount only has to be a positive number (no upper cap); do not add one back.
- Client card payments (top-up and membership) are two steps and enforced here: `POST /payment-challenges` (`paymentChallengeService.start`) stores the validated request and issues a 6-digit code (hashed, 5 min, 3 attempts, one open challenge per member, single use); `POST /payment-challenges/:id/verify` charges through `balanceService.deposit` / `membershipService.subscribe` with `{ verified: true }`. Those services refuse a client card payment without `verified`, so the direct endpoints cannot bypass the code. Outside production the code is returned as `demoCode` because there is no SMS provider yet; never return it in production.
- Middleware order in `app.ts` matters: Better Auth handler is mounted before `express.json()`.
- Long lists (balance transactions, attendance history, membership history) are cursor-paged: a service method takes `{ cursor?, limit? }` (default 20, max 50), orders by the date and then `id`, fetches `take + 1` rows with `cursor: { id }, skip: 1`, and returns `{ <items>, nextCursor }` (`nextCursor` is the last returned `id`, or `null`). Add a new paged endpoint next to the plain list instead of changing the list's response shape, and cover the pages in a test. Filters belong in the same query: describe them in a shared Zod query schema (`balanceHistoryQuerySchema`), parse them with `parseQuery(req, schema)`, and apply them in the service as extra `where` conditions (dates in the gym timezone for timestamps; derived statuses such as `upcoming` and `expired` are matched by their dates).
- Every new or changed endpoint must update `mobile/API_CONTRACT.md`.

## Authentication

- Better Auth (`src/auth/auth.ts`): email/password, `disableSignUp`, `bearer()` plugin for mobile. Web uses the HTTP-only session cookie; mobile sends `Authorization: Bearer <token>` from the `set-auth-token` header.
- `trustedOrigins` and CORS come from `CORS_ORIGINS`; `set-auth-token` is an exposed header.
- Session resolution is `getSessionUser(req)` in `src/tenant/session.ts` (uses `fromNodeHeaders`).

## Membership Plans and Pricing

- A `MembershipPlan` is sold to one `gender` (`male` | `female`) with a `weeklyVisits` cap (0 = unlimited) and a term (`type`: monthly, three_months, six_months, yearly; or visit_based / personal_training, which have no weekly cap). Longer terms are the "offers"; the saving is derived against the 1-month price of the same gender and frequency, never stored.
- `Client.gender` is nullable for legacy rows. `placeMembership` rejects a plan whose gender differs from a known client gender, for admins and clients alike.
- Clients get plans through `membershipPlanService.list`: active plans of their own gender only, nothing while gender is unset. Self-service purchase is `membershipService.subscribe` (client role): balance and card are paid at once, cash is not allowed for clients (only gym staff take cash); one pending membership (for example an admin-created bank transfer) at a time.
- Memberships never overlap: `placeMembership` is the only place that sets dates. Inside its Serializable transaction it calls `queuedStart`, so a new membership (subscribe, staff create, renew) starts on the requested date or the day after the client's last `active` membership ends, whichever is later. `MembershipStatus` also has a derived `upcoming` (paid, `startDate` after today) computed in `effectiveStatus` next to `expired`; the DB enum is unchanged. `findActiveForClient` (check-in) only returns started memberships. Dashboard counts use started memberships and skip clients who already queued the next one.
- `Membership.weeklyVisits` snapshots the plan cap; `attendanceService.checkIn` enforces it per local week (Monday start, gym timezone) inside the check-in transaction.
- Prices are `Decimal` in ALL (Albanian lek); do not add currency conversion.
- The standard price list is saved per gender in one call (`PUT /membership-plans/price-grid` -> `membershipPlanService.savePriceGrid`): a cell updates or creates the plan for (gender, weeklyVisits, term), an empty cell deactivates it (plans are never deleted because memberships reference them). Extras (daily pass, visit packs, personal training) use the plan CRUD endpoints.
- Price list content lives in the `price-lists` domain: notes (`PriceListNote`) and photos (`GymPhoto`, files under `UPLOADS_DIR/<gymId>/`, served read-only at `/uploads`). Uploads are raw bytes (`image/jpeg|png|webp`, 5 MB) behind `requireRole` + `express.raw`; the type is detected from the file signature (`utils/images.ts`), the file name is generated, and the client-declared name or type is never trusted. New tenant models must be added to `TENANT_MODELS` in `tenant/scopedDb.ts`.

## Prisma

- Schema in `prisma/schema.prisma`; changes only through migrations (`npm run db:migrate`). Never edit applied migrations.
- Models PascalCase singular. Use `$transaction` when a change and its ledger entry must succeed together.
- Seed data in `prisma/seed.ts` includes at least two gyms to exercise tenant isolation.
- Money is `Prisma.Decimal`; no float arithmetic. Serialize at the API boundary.

## Testing

- Vitest, tests beside the code (`src/services/<domain>/index.test.ts`), against the separate test DB (`.env.test`, `npm run db:test:setup`).
- Required coverage: tenant isolation (Gym A vs Gym B), role guards, ledger integrity, check-in rules.

## Environment

- `backend/.env` (never committed): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `PORT`, `CORS_ORIGINS`, optional `UPLOADS_DIR` (default `backend/uploads`, git-ignored). Keep `.env.example` current and document new variables in `README.md`.

## Adding or Changing a Feature

1. Types in `shared/src/types/<domain>/index.ts` (+ barrel) and Zod schema in `shared/src/validation/<domain>/index.ts`.
2. Service `src/services/<domain>/index.ts` using `ctx.db`, with a cross-tenant test.
3. Router `src/routes/v1/<domain>.ts`, mounted in `src/routes/v1/index.ts`.
4. Add the endpoint to `mobile/API_CONTRACT.md`.
5. Frontend follows `frontend.instructions.md`.
6. Run `npm run type-check`, `npm run lint`, `npm test` from the repo root.
