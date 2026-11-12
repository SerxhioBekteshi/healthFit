---
description: Mobile app rules. Applies when editing files in the mobile folder.
applyTo: 'mobile/**'
---

# Mobile Instructions

`mobile/` is a placeholder; the app has not been scaffolded yet. It consumes the backend REST API exactly as documented in `mobile/README.md` and `mobile/API_CONTRACT.md`.

- Authenticate with `POST /api/auth/sign-in/email`, store the `set-auth-token` header value in secure storage, send `Authorization: Bearer <token>`.
- Never send `gymId`; the server derives it from the session. Payment success is decided by the server.
- Reuse `@gym/shared` types and Zod schemas where the toolchain allows, instead of redefining them.
- Show the result of every API call to the user (success and failure), like the web app's toasts.
- Long lists use cursor paging (`nextCursor` -> `?cursor=`), see `API_CONTRACT.md`. Memberships queue: show the `active`, `upcoming` and `pending` ones ordered by `startDate`, each with its own start and end date, and use the dates the API returns after a purchase.
- Do not add backend logic here. A missing capability is a new endpoint in `backend/` plus a row in `API_CONTRACT.md`.
