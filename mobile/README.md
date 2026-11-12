# Mobile

Placeholder for the mobile app. It consumes the same REST API as the web client; nothing in `backend/` is mobile-specific.

- Endpoint reference: [API_CONTRACT.md](API_CONTRACT.md)
- Request schemas (Zod) and response types: `shared/src/validation/<domain>` and `shared/src/types/<domain>` (`@gym/shared`)

## Connecting

| Item        | Value                                           |
| ----------- | ----------------------------------------------- |
| Base URL    | `http://<host>:4000` (`PORT` in `backend/.env`) |
| REST prefix | `/api/v1`                                       |
| Auth prefix | `/api/auth` (Better Auth)                       |
| Android emu | use `http://10.0.2.2:4000` for the host machine |

Mobile apps do not need CORS. Use HTTPS outside local development.

## Authentication

1. `POST /api/auth/sign-in/email` with `{ "email", "password" }`.
2. Read the `set-auth-token` response header and store it in secure storage (Keychain / Keystore).
3. Send `Authorization: Bearer <token>` on every call.
4. `GET /api/v1/me` returns the signed-in user and role. A `401` means the token is missing or expired; sign in again.
5. `POST /api/auth/sign-out` with the bearer header ends the session.

Accounts are created by gym admins and the platform owner; there is no self sign-up. The mobile app is intended for the `client` role (see the Roles column in the contract).

## Response shapes

- Success: `{ "data": <payload> }`
- Error: `{ "message": string, "code": string }` with HTTP `401`, `403`, `404`, `409`, `422` or `500`
- Validation (`422`) also includes `issues: [{ path, message }]`

## Rules the client must respect

- `gymId` is never sent; the server derives it from the session.
- Money values are decimal amounts; the balance is a ledger sum computed by the server.
- Payment success is decided by the server, never by the app.
