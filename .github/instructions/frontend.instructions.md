---
description: Frontend rules (React 19 + Vite SPA, react-router, React Query, Tailwind). Applies when editing frontend source.
applyTo: 'frontend/src/**'
---

# Frontend Instructions

The frontend is a client-only Vite SPA. It talks to the backend over HTTP (`/api/v1`, `/api/auth`) and has no server code. Never import from `backend/`.

---

## Architecture

- Stack: React 19, TypeScript strict, Vite, react-router-dom, TanStack Query, React Hook Form + Zod, Tailwind, Headless UI.
- Layers: UI -> `src/hooks/<domain>` (React Query) -> `src/services/<domain>` (fetchers over `src/services/api`) -> backend.
- Routes are declared in `src/routes/index.tsx` (`createBrowserRouter`, lazy page modules). Pages are never routed by file name.
- Page components live in `src/views/<area>/` (areas: `gym`, `super-admin`, `client`, `auth`, `landing`). A page with its own drawers/forms lives in `src/views/<area>/<domain>/<Name>Page.tsx` with those pieces beside it.
- Zod schemas and entity types come from `@gym/shared` (`@gym/shared/types`, `@gym/shared/validation/<domain>`). Do not redefine them.

## Folder Structure

```
index.html, vite.config.ts   dev proxy /api -> http://localhost:4000
src/
  main.tsx                   QueryProvider + RouterProvider
  routes/index.tsx           route table, role shells, public/login guards
  views/<area>/[<domain>/]   pages + their drawers
  components/ui/             Drawer, Modal, Table, design system
  components/common|landing|<domain>/
  layouts/                   BaseLayout, AuthShell
  hooks/<domain>/index.ts    React Query hooks (+ table/, theme/, media-query/)
  services/<domain>/index.ts fetchers (+ api/, auth/)
  providers/, styles/globals.css, utils/constants/<name>/
```

- One kebab-case plural domain name per domain, reused in services, hooks and views. No several domains in one file; no flat files next to unrelated ones.
- Overlays and lists use the shared primitives: `Drawer`, `Modal` (no `window.confirm`), `Table` + `useTableController` from `@/hooks/table`. Every table has a general search in its toolbar (`components/ui/TableToolbar`, rendered by `Table`): give each column a `searchValue` returning the text the user reads in that cell (use `searchFields` only for data no column shows), and pass a `searchPlaceholder`. The search matches every word in any column; extra controls such as a status filter go in `Table`'s `toolbar` prop. Every table also has a pagination footer (`components/ui/TablePagination`: range, rows-per-page selector, page numbers): set the starting size and the choices with `useTableController({ pageSize, pageSizeOptions })` (default 10 and 10/25/50), and turn the footer or the selector off with `Table`'s `pagination` and `pageSizeSelector` props. A table scrolls inside its own card (sticky header, pinned footer) so the page does not scroll: `Table` measures its distance from the top of the page with `hooks/fill-height` and caps its height to the rest of the window from `md` up; tune it with `fillHeight` (default on) and `fillGap` (px kept free below, default 72). Anything that opens from a row (menus) must render in a portal, like `ActionMenu`.
- Import with `@/` (maps to `frontend/src`) and by folder (`@/services/clients`). Keep files under 300 lines.

## Components

- Functional components, props interface per component, typed as `React.FC<Props>`. One component per file, named exports.
- No `'use client'` directives and no `next/*` imports; navigation uses `react-router-dom` (`Link to=`, `useNavigate`, `useLocation`).
- Handle loading, empty and error states. Name pages by domain (`GymAdminsPage`), never by role prefix.
- Authenticated screens are wrapped once by `AuthShell` in the route table (it renders `BaseLayout`); pages do not wrap themselves.
- The landing page (`components/landing`) shares the app's soft slate and teal palette through the `.landing` colour tokens in `styles/globals.css`. Use token classes (`bg-ink`, `text-bone`, `text-signal`, `fill-signal`, `stroke-white/10`), never hard-coded hex or near-black shadows; keep headlines semibold and avoid dials, clocks or times in the artwork. Its preview cards (`TiltCard` and the `Mock*` components) copy the app's real cards (same surface, type scale and rows, money in ALL), so change them together with the screens they imitate.
- The product is called HealthFIT. The name lives in `components/landing/brand.ts`, the styled name in `components/ui/BrandName`, the heart-and-pulse logo in `components/ui/BrandMark` (and `public/favicon.svg`); do not hard-code the name or draw another logo elsewhere.

## Services, Hooks, State

- Fetchers use `apiClient` from `@/services/api` (base URL from `VITE_API_BASE_URL`, empty in dev, `credentials: 'include'`). They never contain business rules.
- React Query hooks return `{ data, isLoading, error, ... }` and invalidate related keys after mutations.
- Every `useMutation` sets `meta: { success: 'Short message.' }`. `providers/QueryProvider` turns that into a success toast and turns every mutation or initial-load query error into an error toast (`components/ui/Toaster`, store in `utils/toast`; `toast.success/error` for the rare call outside a mutation). Use `meta: { silent: true }` only for background checks such as the session query. Do not add a page-level success banner for something the toast already says; keep inline errors inside forms and drawers.
- Long histories (balance transactions, attendance, membership history) use `useInfiniteQuery` and return a `pagination` object (`hasMore`, `isLoadingMore`, `loadMoreFailed`, `onLoadMore`). Render the rows in a scrolling container with `components/ui/LoadMore` after the list (pass `itemCount`); never load the full history into one page. Filters for such a list use `components/ui/FilterBar` in the card title (inputs open over the list; examples `components/balance/BalanceFilters.tsx`, `components/memberships/MembershipHistoryFilters.tsx`): keep the draft filters in page state, pass `useDebouncedValue(...)` of them to the hook (memoize the object you debounce), include them in the query key, and never send an inverted range (`utils/filters`).
- Context only for global concerns (session, theme); `useState` for local UI state.

## Membership Plans UI

- The standard price list is shown by `components/membership-plans/PriceMatrix.tsx` (weekly frequency across, term down, derived offer savings; every price is a Subscribe button for clients; `PriceListShowcase` adds notes, extras and photos). Gym admins edit the same data as a grid in `views/gym/membership-plans/PriceMatrixEditor.tsx` on Membership > Configuration; `priceTable.ts` builds the data for both. Never build a second plan list or table.
- Photos are shown with `PhotoGallery` and loaded through `assetUrl()` (uploads are served by the API origin). Upload with `apiClient.upload` (raw bytes), never multipart or base64.
- The gym sidebar has a `Membership` submenu (`Members` -> `/memberships`, `Configuration` -> `/memberships/configuration`); the client has a single `Membership` entry (`/client/membership`: current membership plus the price list with photos, where the client taps a price or extra to subscribe through the shared `components/membership-plans/SubscribeDialog.tsx`, never a second payment dialog). Submenus are declared with `children` in `utils/constants/navigation`.
- Labels and terms come from `utils/constants/labels` (`genderLabels`, `planTerms`, `weeklyVisitsLabel`, `membershipStatusLabels` (the API status `expired` is shown as "Finished")). Show money with `formatMoney` and dates with `formatDay` from `utils/format` (ALL), not `toFixed(2)`, for plan and membership prices.
- Memberships queue: `status` can be `upcoming` (paid, not started). The client Membership page shows the queue with `components/memberships/MembershipQueue.tsx` (order, plan, start and end dates, price, time left); never list a client's memberships as one status box. `utils/memberships` (`nextStart`, `describePeriod`, `daysUntil`) mirrors the server rule for previews and messages; the server decides the real dates, so always show the `startDate`/`endDate` it returns.
- The extras form (`ExtraPlanFormDrawer.tsx`) covers daily pass, visit packs and personal training; terms live in the price table. Client forms require gender because it decides which plans the member sees.

## Forms

- React Hook Form + `zodResolver` with the shared schema. Inline errors, disabled submit while pending, API errors displayed.

## Card Payments

- Every card payment (balance top-up in `DepositForm`, membership in `SubscribeDialog`) uses `components/payments/CardFields.tsx`: Visa or Mastercard only, Luhn, expiry and CVC checks from `utils/card`. The number, expiry and CVC stay in that component's state; callers receive and send only `{ brand, last4 }`. Never put the raw card in React Hook Form values, query keys, logs or requests.
- The amount field of a top-up has no cap and no native min/step; the schema only requires a positive number.
- A member's card payment is never sent directly: after the card form, start a challenge with `usePaymentChallenge` (`hooks/payment-challenges`), show `components/payments/CardVerificationDialog.tsx` for the one-time code, and the server charges when the code verifies. Reuse that hook and dialog for every new client card payment. Gym admins taking a card at the counter use `useBalance().deposit` directly.

## Authentication

- Better Auth client (`@/services/auth`) with the HTTP-only session cookie. Never store tokens in `localStorage`/`sessionStorage`.
- `useSession()` reads `/api/v1/me`. `AuthShell` redirects unauthenticated users to `/login` and wrong-role users to `roleHomePath[role]`; this is UX only, the backend enforces roles.
- Hiding UI by role is a convenience, not authorization.

## Environment

- Only `VITE_`-prefixed variables reach the browser; never put secrets there. Keep `frontend/.env.example` current.

## Adding or Changing a Feature

1. Backend + shared first (see `backend.instructions.md`).
2. Fetcher `src/services/<domain>/index.ts` and hook `src/hooks/<domain>/index.ts`.
3. Page `src/views/<area>/<domain>/<Name>Page.tsx` with drawers beside it; shared domain UI in `src/components/<domain>/` only if several pages use it.
4. Add the route to `src/routes/index.tsx` (inside the matching role shell) and a nav entry in `src/utils/constants/navigation/index.ts`.
5. Run `npm run type-check` and `npm run lint` from the repo root.
