---
description: Shared package rules (Zod schemas and types used by backend, frontend and mobile). Applies when editing shared source.
applyTo: 'shared/src/**'
---

# Shared Package Instructions

`@gym/shared` is the single source of truth for request schemas and entity types. It ships raw TypeScript (no build step); the backend bundles it with tsup, Vite compiles it for the frontend.

- Layout: `src/types/<domain>/index.ts` (re-exported from `src/types/index.ts`) and `src/validation/<domain>/index.ts`. Same kebab-case plural domain name as the backend and frontend.
- Consumers import `@gym/shared/types`, `@gym/shared/types/<domain>` and `@gym/shared/validation/<domain>`. Exports are declared in `shared/package.json`; add an entry there only for a new kind of module.
- Pure and runtime-neutral: only `zod`. No Prisma, Node, DOM, React or env access.
- `Gender` (`male` | `female`) lives in `types/clients` and `genderSchema` in `validation/common`; clients and membership plans both use them. Plan terms and weekly frequency live on `MembershipPlan` (`type`, `weeklyVisits`, `gender`); the price table request is `priceGridSchema` in `validation/membership-plans`. Price list notes and photos are the `price-lists` domain (`types/price-lists`, `validation/price-lists`).
- Use relative imports inside this package (`../payments`), never `@/`.
- Paged endpoints return a `<Domain>HistoryPage` / summary type with `nextCursor: string | null` (`BalanceSummary`, `AttendanceHistoryPage`, `MembershipHistoryPage`). Their filters are a plain type (`BalanceHistoryFilters`, `MembershipHistoryFilters`) plus a query schema in `validation/<domain>` that coerces query-string numbers (`z.coerce`) and refines ranges. `MembershipStatus` includes the derived `upcoming` (queued, not started); labels for every status live in the frontend `utils/constants/labels`, so adding a status means updating that record too.
- Zod schemas use `z.infer` for input types. Money is a number/string at this boundary; the backend uses `Decimal`.
- A schema or type change affects the web app and mobile; update `mobile/API_CONTRACT.md` when an endpoint contract changes.
