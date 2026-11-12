# Copilot Instructions

Design and domain rules are in `ARCHITECTURE.md`; per-folder rules are in `.github/instructions/{backend,frontend,shared,mobile}.instructions.md`; templates are in `.github/skills/SKILLS.md`. Read the matching file before editing.

## Coding rules

- TypeScript strict, no `any`. Functional React components with hooks, named exports, `@/` imports, files under 300 lines.
- Not a Next.js app: never add `next/*`, `'use client'`, Route Handlers or `src/app`.
- Domain-first: one kebab-case plural name per domain in every layer, one domain per file, no flat files.
- Business logic and DB access only in `backend/src/services/<domain>/`; routes stay thin (`withTenant`/`withPlatform`, `parseBody`/`parseQuery`, `ok`).
- `gymId` and role come from the session, never from client input; services use the tenant-scoped `ctx.db`.
- Zod schemas and types live in `shared/` and are never redefined elsewhere.
- Frontend data flow: hook (`hooks/<domain>`) -> fetcher (`services/<domain>`) -> `/api/v1`. Use the shared primitives in `components/ui/` (`Drawer`, `Modal`, `Table`, `FilterBar`, `LoadMore`); never `window.confirm` or a per-domain table or drawer.
- Every `useMutation` sets `meta: { success: '...' }` (errors toast automatically); no duplicate success banners.
- Long lists are cursor-paged (`{ <items>, nextCursor }`) and loaded with `useInfiniteQuery` + `LoadMore`.
- Any new or changed endpoint updates `mobile/API_CONTRACT.md`.
- Keep changes small and focused; comment only what the code cannot say.
- Before finishing: `npm run type-check` and `npm run lint` from the repo root.
