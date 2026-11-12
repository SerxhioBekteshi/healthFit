# Architecture

Monorepo with a standalone Node.js REST API, a React + Vite web client and a (planned) mobile app. One shared PostgreSQL database accessed through Prisma. Shared multi-tenancy: every gym is a tenant and every tenant row carries `gymId`.

```
frontend (Vite SPA) ─┐
                     ├─ HTTP /api/v1, /api/auth ─> backend (Express) ─> Prisma ─> PostgreSQL
mobile (planned)    ─┘
shared (@gym/shared): Zod schemas + types imported by backend and frontend
```

## Stack

| Concern    | Choice                                                              |
| ---------- | ------------------------------------------------------------------- |
| Backend    | Node.js 20, Express 5, TypeScript (strict), tsx (dev), tsup         |
| Database   | PostgreSQL (local Docker in dev), Prisma 6                          |
| Auth       | Better Auth: HTTP-only cookie (web) + bearer plugin (mobile)        |
| Validation | Zod, defined once in `shared/`                                      |
| Frontend   | React 19, Vite 6, react-router-dom 7, TanStack Query, RHF, Tailwind |
| Tests      | Vitest (backend)                                                    |

## Layers

```
React UI -> frontend/src/hooks/<domain> (React Query)
         -> frontend/src/services/<domain> (fetch over /api/v1)
         -> backend/src/routes/v1/<domain>.ts (thin: auth wrapper, parse, call service, ok())
         -> backend/src/services/<domain> (business rules; the only code that talks to the DB)
         -> backend/src/tenant/* (tenant-scoped Prisma client)
         -> Prisma -> PostgreSQL
```

The REST API is the only server surface. Mobile calls the same `/api/v1` endpoints (contract: `mobile/API_CONTRACT.md`).

## Folder structure

```
backend/
  prisma/                 schema.prisma, migrations/, seed.ts
  src/
    index.ts, app.ts      bootstrap; middleware order (helmet, cors, Better Auth, json, /api/v1, errors)
    config/env.ts         PORT, CORS_ORIGINS, BETTER_AUTH_URL
    auth/                 Better Auth config (+ credential helpers)
    db/                   Prisma singleton
    tenant/               session, context (requireUser/requireTenant/requirePlatform), scopedDb, clientAccounts
    http/                 withTenant/withPlatform/ok/parseBody, errorHandler
    routes/v1/            one Router per domain + index.ts
    services/<domain>/    index.ts business logic, tests beside it
    payments/, utils/, errors.ts
frontend/
  index.html, vite.config.ts (dev proxy /api -> :4000)
  src/
    main.tsx, routes/index.tsx   router, role shells (AuthShell), public/login guards
    views/<area>/[<domain>/]     page components by area: gym/, super-admin/, client/, auth/, landing/; a page's own drawers/forms sit beside it
    components/                  ui/ (Drawer, Modal, Table, ...), common/, landing/, shared domain UI
    layouts/                     BaseLayout (sidebar shell), AuthShell (session + role redirect)
    hooks/<domain>/              React Query hooks
    services/<domain>/           fetchers; api/ is the fetch wrapper, auth/ the Better Auth client
    providers/, styles/, utils/constants/<name>/
shared/
  src/types/<domain>/index.ts + barrel index.ts
  src/validation/<domain>/index.ts
mobile/                   README.md, API_CONTRACT.md (app not scaffolded)
docker-compose.yml        Postgres
```

Domain-first rule: the same kebab-case plural domain name (`clients`, `gym-admins`, `memberships`, ...) names the folder in every layer. Rules and the new-feature checklist: `.github/instructions/*.instructions.md`.

## Roles

- `super_admin`: platform owner. `gymId` is null. May query across gyms only through explicit helpers.
- `gym_admin`: manages exactly one gym (one tenant), which can have several locations (see "Gym locations").
- `client`: gym member. Sees only their own records inside their gym.

## Tenancy rules (non-negotiable)

1. Every tenant table has `gymId` and an index starting with `gymId`.
2. `gymId` comes from the session, never from the request body, query, or URL.
3. Services never use the raw Prisma client. They receive a `TenantContext` (`{ user, gymId, role, clientId, db }`) where `db` is a Prisma client extension that injects `gymId` into every read and write, including inside interactive transactions. The only exception is the explicit helpers in `backend/src/tenant/` that manage login accounts, which take `gymId` from the context.
4. Cross-tenant access (super admin) uses explicitly named helpers, never a flag on the scoped client.
5. Clients are further restricted to rows where `clientId` is their own profile.
6. Authorization happens on the server for every request. Hiding UI is not authorization.
7. Tests must prove Gym A cannot read or write Gym B data for every model.

## Auth

Better Auth with the Prisma adapter and email/password (no self sign-up). The session user carries `role` and `gymId`.

- Web: HTTP-only session cookie. In dev the Vite proxy keeps the SPA and API same-origin; when hosted separately set `CORS_ORIGINS` (backend) and `VITE_API_BASE_URL` (frontend) and serve both under the same site so the cookie is first-party.
- Mobile: sign in at `/api/auth/sign-in/email`, read the `set-auth-token` header, send `Authorization: Bearer <token>`.
- `backend/src/tenant/session.ts` resolves either from the request headers; real checks live in `requireTenant`/`requirePlatform`. The frontend `AuthShell` only redirects.

## Gym locations

- An owner with several gyms is still one tenant: the gym (`Gym`, one `gymId`) has any number of `GymLocation` rows (`name`, `address`, `phone`, `latitude`, `longitude`, optional Google Maps `mapUrl`, `isActive`). Tenancy, plans, memberships, balance, products and closures stay gym-wide, so a member has one account and one weekly limit and the visits count the same wherever they train.
- The owner sets the pin on `components/gym-locations/MapPicker` (react-map-gl with maplibre-gl, raster OpenStreetMap and Esri satellite tiles in `mapStyles.ts`, no API key; click or drag the pin) inside the location drawer; members see a fixed `LocationMap` plus an "Open in Google Maps" link (`utils/maps` `locationMapLink`: the pasted `mapUrl`, else a link built from the pin). Both map components are lazy-loaded because maplibre-gl is large.
- The gym admin manages them on "My gyms" (`GymLocationsPage`, `/gym-locations`); the member sees the active ones on "Gyms" (`ClientLocationsPage`). Locations are never deleted, only closed, and the last active one cannot be closed. `gymService.create` adds a `Main` location and the migration gave every existing gym one.
- Check-in records where the member trained: `Attendance.locationId` (nullable for older rows). `attendanceService.checkIn` resolves it through `gymLocationService.resolveForCheckIn`: one active location is used automatically, several require `locationId`. The attendance desk offers a "Checking in at" select when there is more than one and remembers the choice on the device.

## Membership plans and pricing

- A plan (`MembershipPlan`) is defined by `gender` (`male` | `female`), `weeklyVisits` (3x, 4x, 5x, 6x per week, or 0 for unlimited), a term (`type`/`durationDays`: 1, 3, 6, 12 months) and a `price` in ALL. Visit packs and personal training are separate plan types without a weekly cap.
- Offers are the longer terms of the same gender and frequency (for example male 4x per week: 1 month 5000 ALL, 3 months 13000 ALL). The UI derives the saving against the 1-month price; nothing extra is stored.
- Gym admins configure the standard price list on Membership > Configuration: a table with weekly frequency across and term down, one price per cell, per gender (`PriceMatrixEditor`), plus extras (daily pass, packs, personal training), free-text notes and photos. The sidebar has a `Membership` submenu: `Members` and `Configuration`. Clients see the same table on Membership (`ClientMembershipPage`, together with their current membership and the gym photos) and tap a price (for example 5x per week for 6 months) or an extra to subscribe (`SubscribeDialog`); only active plans of their own gender show (`Client.gender`; unset means no plans until the gym sets it).
- The table is saved in one call per gender (`PUT /api/v1/membership-plans/price-grid`). Notes and photos belong to the `price-lists` domain; photo files are stored under `UPLOADS_DIR/<gymId>/` and served at `/uploads` (public, unguessable names).
- Clients subscribe themselves with credit (balance) or card; the membership is paid at once. Cash is never a client option (gym staff only), and a pending membership such as a bank transfer blocks a new self-subscription until the gym confirms it. The server rejects plans of the other gender.
- Memberships queue instead of overlapping. `placeMembership` (backend `services/memberships`) starts every new membership (self-service, staff assign, renew) the day after the client's last paid membership ends, or on the requested date when that is later, and reads that inside its Serializable transaction. Example: 4x for 1 month, another bought two weeks before it ends, then a 4x 6-month offer later: each starts the day after the previous one ends. `MembershipStatus` has a derived `upcoming` (paid, not started); only the `active` one allows check-in. The client Membership page lists the queue (`MembershipQueue`: order, plan, start and end dates, price, time left), `SubscribeDialog` says when the new plan will start, and the gym dashboard counts only started memberships and does not flag a membership as expiring when the next one is already queued.
- `Membership.weeklyVisits` snapshots the cap; check-in refuses visits beyond it within the local week (Monday to Sunday in the gym timezone).

## Money and payments

- Amounts are `Decimal` in the DB; never floats.
- Client balance is the sum of `BalanceTransaction` ledger rows. No mutable balance column.
- Ledger writes and the business change they belong to (for example membership activation) happen in one transaction.
- The server decides whether a payment succeeded. Online payments are confirmed by provider webhooks, never by the client.
- Card payments (top-up and membership) use a card form in the browser (Visa or Mastercard); only the brand and last 4 digits reach the API and the ledger description. The provider is simulated and always succeeds; a real provider with hosted fields and a webhook replaces it later. A top-up amount has no upper cap.
- A member's card payment needs a one-time code before the server charges it (3-D Secure style): start a payment challenge, enter the 6-digit code, then the payment runs. Codes are hashed, expire after 5 minutes, allow 3 attempts and work once. There is no SMS provider yet, so outside production the code is shown in the UI (`demoCode`).
- Platform billing (`GymSubscription`, `GymSubscriptionPayment`) is separate from gym memberships (`Membership`) and must never be merged.

## API conventions

- Paths: `/api/v1/<resource>[/<id>|/<action>]`; auth under `/api/auth`; health at `/health`.
- Success: `{ data: T }`. Error: `{ message, code, issues? }`.
- Status codes: 401 unauthenticated, 403 forbidden, 404 not found (also for other tenants' rows), 409 conflict, 422 validation, 500 server.
- Inputs are validated with the shared Zod schema in the route before calling a service.
- Long histories use cursor pagination: `GET /balance`, `GET /attendance/history` and `GET /memberships/history` return `{ <items>, nextCursor }` (newest first, 20 per page, `?limit=` up to 50, `?cursor=`). The service fetches `take + 1` rows ordered by the date and `id`, and `nextCursor` is the last returned `id` or `null`. The plain list endpoints stay as they are for screens that need everything. The paged endpoints also take filters, validated with a shared query schema (`balanceHistoryQuerySchema`, `membershipHistoryQuerySchema`, parsed with `parseQuery`): transactions by date range and amount range, membership history by status and by the period it overlaps.

## Frontend feedback

- Every API result shows a toast (`components/ui/Toaster`, store in `utils/toast`, mounted once in `main.tsx`). `providers/QueryProvider` wires it into React Query: each mutation toasts its `meta.success` message and any error; a failed query with no cached data toasts its error (not 401s, not queries marked `meta: { silent: true }`). Hooks therefore set `meta: { success: '...' }` on every `useMutation`, and pages keep inline errors only where they help inside a form.
- History lists load lazily: `useInfiniteQuery` hooks (`useBalance`, `useAttendanceHistory`, `useMembershipHistory`) return `pagination`, and the list renders `components/ui/LoadMore` inside a scrolling container that loads the next page when its end comes into view. Filters sit in the card title (`components/ui/FilterBar`, a Filter button that opens the inputs over the list): the page keeps the draft filters in state, debounces them with `hooks/debounce`, and passes them to the hook, whose query key includes them.

## Environment

- `backend/.env` (never committed): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `PORT`, `CORS_ORIGINS`. Tests use `backend/.env.test`.
- `frontend/.env`: optional `VITE_API_BASE_URL` (empty in dev). Only `VITE_` variables reach the browser; no secrets.

## Later phases (not built yet)

Subdomain and custom-domain tenant resolution, payment provider webhooks, check-out, platform subscription billing automation, the mobile app itself.
