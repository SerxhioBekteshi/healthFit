---
description: Mobile app rules. Applies when editing files in the mobile folder.
applyTo: 'mobile/**'
---

# Mobile Instructions

`mobile/` is the member app: Expo SDK 58 + React Native + Expo Router, **clients only** (a staff account is signed out right after sign-in). It consumes the backend REST API exactly as documented in `mobile/API_CONTRACT.md`. Beginner guide: `mobile/GUIDE.md`.

- It is not an npm workspace: it has its own `node_modules` and needs Node 22.13+. Run `npm install`, `npm run type-check` and `npm run lint` inside `mobile/`. Add packages with `npx expo install <package>`, never `npm add`.
- Layout mirrors the web app: `src/app` (Expo Router screens, thin), `src/hooks/<domain>` (React Query) -> `src/services/<domain>` (fetchers) -> `/api/v1`; `src/components/ui` is the shared kit (`Screen`, `Card`, `Button`, `BottomSheet`, `InfiniteList`, `QueryBoundary`, ...), feature components sit in `src/components/<domain>`. Same kebab-case plural domain names as the other layers; files under 300 lines; named exports except route files (`export default`).
- Styles come from the theme (`useThemedStyles(createStyles)` with a module-level factory, `Text` variants); never hard-code colours. No `any`.
- Authenticate with `POST /api/auth/sign-in/email`, store the `set-auth-token` header value in secure storage (`storage/token.ts`), send `Authorization: Bearer <token>` (`api/client.ts`).
- Never send `gymId`; the server derives it from the session. Payment success is decided by the server; a member's card payment is `POST /payment-challenges` then `/verify` (`PaymentSheet`).
- Import types and Zod schemas from `@gym/shared/...` (resolved by `tsconfig.json` paths and `metro.config.js`), never redefine them.
- Show the result of every API call: each `useMutation` sets `meta: { success }` (a string or a function of the response; `providers/query-client.ts` toasts it, errors toast automatically). Sheets show errors inline too.
- Long lists use cursor paging (`nextCursor` -> `?cursor=`) with `useInfiniteQuery` + `InfiniteList`, see `API_CONTRACT.md`. Memberships queue: show the `active`, `upcoming` and `pending` ones ordered by `startDate`, each with its own start and end date, and use the dates the API returns after a purchase.
- The menu has five tabs (Home, Membership, Check-in, Training, Profile); other screens (balance, visits, locations) open from Profile, which also holds the settings (language, appearance, change password).
- Every visible text goes through `t('English text')` from `@/i18n` (call `useTranslation()` in components so they redraw on a language change; `msg('...')` for text declared at module level, `meta: { success: msg('...') }` for toasts). Literal strings only. The texts live in the shared dictionaries `shared/src/i18n/{sq,it,de,el}` (used by the web app too); add each new text there and run `npm run i18n:check` from the repo root.
- Every `BottomSheet` has the Cancel and the main action (`submitLabel`/`onSubmit`) side by side, each half of the width, like the web drawers; information-only sheets use `cancelLabel="Close"` alone.
- Exercise figures come from the backend's `icon` key and are drawn from `utils/exercise-icons` (same figures as the web); keep them in sync with `frontend/src/utils/constants/exercise-icons`.
- After `POST /api/auth/change-password` store the new token the server returns, or the phone is signed out.
- Do not add backend logic here. A missing capability is a new endpoint in `backend/` plus a row in `API_CONTRACT.md`.
