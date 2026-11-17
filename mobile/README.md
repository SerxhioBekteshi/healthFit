# Mobile

The member app: React Native with Expo, for **clients only** (gym members). It consumes the same REST API as the web client; nothing in `backend/` is mobile-specific.

New to mobile development? Read [GUIDE.md](GUIDE.md) first. It explains Expo, how to run the app on your phone and how the code is organised.

## Quick start

Needs Node **22.13 or newer** (Expo SDK 58) and the Expo Go app on your phone. The backend must be running (`npm run dev:backend` from the repo root).

```bash
cd mobile
npm install
npm start          # scan the QR code with Expo Go (Android) or the Camera app (iOS)
```

Sign in with a seeded member such as `client@alpha.test` / `Password123!` (`npm run db:seed` at the repo root creates it). Staff accounts are refused: the app is for members.

| Command              | What it does                     |
| -------------------- | -------------------------------- |
| `npm start`          | Dev server with QR code          |
| `npm run android`    | Open on an Android emulator      |
| `npm run ios`        | Open on an iOS simulator (macOS) |
| `npm run type-check` | TypeScript check                 |
| `npm run lint`       | ESLint (Expo rules)              |

- Endpoint reference: [API_CONTRACT.md](API_CONTRACT.md)
- Request schemas (Zod) and response types: `shared/src/validation/<domain>` and `shared/src/types/<domain>` (`@gym/shared`)

## Connecting

| Item        | Value                                                                   |
| ----------- | ----------------------------------------------------------------------- |
| Base URL    | `http://<host>:4000` (`PORT` in `backend/.env`)                         |
| REST prefix | `/api/v1`                                                               |
| Auth prefix | `/api/auth` (Better Auth)                                               |
| In the app  | found automatically in development; override with `EXPO_PUBLIC_API_URL` |
| Android emu | `http://10.0.2.2:4000` for the host machine (used as a fallback)        |

Mobile apps do not need CORS. Use HTTPS outside local development.

## Authentication

1. `POST /api/auth/sign-in/email` with `{ "email", "password" }`.
2. Read the `set-auth-token` response header and store it in secure storage (Keychain / Keystore).
3. Send `Authorization: Bearer <token>` on every call.
4. `GET /api/v1/me` returns the signed-in user and role. A `401` means the token is missing or expired; sign in again.
5. `POST /api/auth/sign-out` with the bearer header ends the session.
6. `POST /api/auth/change-password` with `{ currentPassword, newPassword, revokeOtherSessions: true }` signs out the user's other devices **and returns a new token** (`set-auth-token` header and `token` in the body); store it, the old one is no longer valid.

Accounts are created by gym admins and the platform owner; there is no self sign-up. The mobile app is intended for the `client` role (see the Roles column in the contract).

## Response shapes

- Success: `{ "data": <payload> }`
- Error: `{ "message": string, "code": string }` with HTTP `401`, `403`, `404`, `409`, `422` or `500`
- Validation (`422`) also includes `issues: [{ path, message }]`

## Rules the client must respect

- `gymId` is never sent; the server derives it from the session.
- Money values are decimal amounts; the balance is a ledger sum computed by the server.
- Payment success is decided by the server, never by the app.
