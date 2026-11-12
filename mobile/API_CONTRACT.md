# API Contract

Base: `/api/v1`. Auth: session cookie (web) or `Authorization: Bearer <token>` (mobile). Responses are `{ data }` on success, `{ message, code }` on error. Request bodies use the Zod schemas in `shared/src/validation/<domain>`; payload types are in `shared/src/types/<domain>`.

Roles: `SA` super_admin, `GA` gym_admin, `C` client. Keep this table in sync with `backend/src/routes/v1/*.ts`.

| Method | Path                                | Roles | Body schema (`@gym/shared/validation/...`)                          | Success |
| ------ | ----------------------------------- | ----- | ------------------------------------------------------------------- | ------- |
| GET    | `/me`                               | any   | -                                                                   | 200     |
| GET    | `/attendance`                       | GA, C | -                                                                   | 200     |
| GET    | `/attendance/history?cursor=`       | GA, C | -                                                                   | 200     |
| POST   | `/attendance/check-in`              | GA, C | `attendance.checkInSchema`                                          | 201     |
| GET    | `/attendance/stats`                 | GA    | -                                                                   | 200     |
| GET    | `/balance?clientId=&cursor=&limit=` | GA, C | -                                                                   | 200     |
| POST   | `/balance/deposit`                  | GA, C | `balance.depositSchema`                                             | 201     |
| POST   | `/payment-challenges`               | C     | `payment-challenges.startChallengeSchema`                           | 201     |
| POST   | `/payment-challenges/:id/verify`    | C     | `payment-challenges.verifyChallengeSchema`                          | 200     |
| GET    | `/billings`                         | SA    | -                                                                   | 200     |
| GET    | `/clients`                          | GA    | -                                                                   | 200     |
| POST   | `/clients`                          | GA    | `clients.createClientSchema`                                        | 201     |
| GET    | `/clients/:id`                      | GA    | -                                                                   | 200     |
| PATCH  | `/clients/:id`                      | GA    | `clients.updateClientSchema`                                        | 200     |
| PATCH  | `/clients/:id/status`               | GA    | `clients.clientStatusSchema`                                        | 200     |
| GET    | `/closures`                         | GA    | -                                                                   | 200     |
| POST   | `/closures`                         | GA    | `gym-closures.gymClosureFormSchema`                                 | 201     |
| PATCH  | `/closures/:id`                     | GA    | `gym-closures.gymClosureFormSchema`                                 | 200     |
| DELETE | `/closures/:id`                     | GA    | -                                                                   | 200     |
| GET    | `/dashboard/client`                 | C     | -                                                                   | 200     |
| GET    | `/dashboard/gym`                    | GA    | -                                                                   | 200     |
| GET    | `/dashboard/platform`               | SA    | -                                                                   | 200     |
| GET    | `/gym-admins`                       | SA    | -                                                                   | 200     |
| POST   | `/gym-admins`                       | SA    | `gym-admins.createGymAdminSchema`                                   | 201     |
| PATCH  | `/gym-admins/:id`                   | SA    | `gym-admins.updateGymAdminSchema`                                   | 200     |
| DELETE | `/gym-admins/:id`                   | SA    | -                                                                   | 200     |
| GET    | `/gym-locations`                    | GA, C | -                                                                   | 200     |
| POST   | `/gym-locations`                    | GA    | `gym-locations.gymLocationFormSchema`                               | 201     |
| PATCH  | `/gym-locations/:id`                | GA    | `gym-locations.gymLocationFormSchema`                               | 200     |
| PATCH  | `/gym-locations/:id/status`         | GA    | `common.activeStatusSchema`                                         | 200     |
| GET    | `/gym-subscriptions`                | SA    | -                                                                   | 200     |
| POST   | `/gym-subscriptions`                | SA    | `gym-subscriptions.createGymSubscriptionSchema`                     | 201     |
| PATCH  | `/gym-subscriptions/:id`            | SA    | `gym-subscriptions.updateGymSubscriptionSchema`                     | 200     |
| PATCH  | `/gym-subscriptions/:id/status`     | SA    | `gym-subscriptions.subscriptionStatusSchema`                        | 200     |
| POST   | `/gym-subscriptions/:id/payments`   | SA    | `gym-subscriptions.subscriptionPaymentSchema`                       | 201     |
| GET    | `/gyms`                             | SA    | -                                                                   | 200     |
| POST   | `/gyms`                             | SA    | `gyms.gymFormSchema`                                                | 201     |
| PATCH  | `/gyms/:id`                         | SA    | `gyms.gymFormSchema`                                                | 200     |
| PATCH  | `/gyms/:id/status`                  | SA    | `gyms.gymStatusSchema`                                              | 200     |
| GET    | `/membership-plans`                 | GA, C | -                                                                   | 200     |
| POST   | `/membership-plans`                 | GA    | `membership-plans.membershipPlanFormSchema`                         | 201     |
| PATCH  | `/membership-plans/:id`             | GA    | `membership-plans.membershipPlanFormSchema`                         | 200     |
| PATCH  | `/membership-plans/:id/status`      | GA    | `common.activeStatusSchema`                                         | 200     |
| PUT    | `/membership-plans/price-grid`      | GA    | `membership-plans.priceGridSchema`                                  | 200     |
| GET    | `/price-list`                       | GA, C | -                                                                   | 200     |
| PUT    | `/price-list/notes`                 | GA    | `price-lists.priceListNotesSchema`                                  | 200     |
| POST   | `/price-list/photos`                | GA    | raw image bytes (`image/jpeg`, `image/png`, `image/webp`, max 5 MB) | 201     |
| DELETE | `/price-list/photos/:id`            | GA    | -                                                                   | 200     |
| POST   | `/uploads`                          | GA    | raw image bytes (`image/jpeg`, `image/png`, `image/webp`, max 5 MB) | 201     |
| GET    | `/memberships`                      | GA, C | -                                                                   | 200     |
| GET    | `/memberships/history?cursor=`      | GA, C | -                                                                   | 200     |
| POST   | `/memberships`                      | GA    | `memberships.createMembershipSchema`                                | 201     |
| POST   | `/memberships/subscribe`            | C     | `memberships.subscribeMembershipSchema`                             | 201     |
| POST   | `/memberships/:id/confirm-payment`  | GA    | -                                                                   | 200     |
| POST   | `/memberships/:id/cancel`           | GA    | -                                                                   | 200     |
| POST   | `/memberships/:id/renew`            | GA    | `memberships.renewMembershipSchema`                                 | 201     |
| GET    | `/products`                         | GA, C | -                                                                   | 200     |
| POST   | `/products`                         | GA    | `products.productFormSchema`                                        | 201     |
| PATCH  | `/products/:id`                     | GA    | `products.productFormSchema`                                        | 200     |
| PATCH  | `/products/:id/status`              | GA    | `common.activeStatusSchema`                                         | 200     |
| POST   | `/products/:id/purchase`            | GA, C | `products.purchaseProductSchema`                                    | 201     |
| GET    | `/workout-programs`                 | GA, C | -                                                                   | 200     |
| POST   | `/workout-programs`                 | GA    | `workout-programs.workoutProgramInputSchema`                        | 201     |
| PATCH  | `/workout-programs/:id`             | GA    | `workout-programs.workoutProgramInputSchema`                        | 200     |
| DELETE | `/workout-programs/:id`             | GA    | -                                                                   | 200     |
| GET    | `/classes`                          | GA, C | -                                                                   | 200     |
| POST   | `/classes`                          | GA    | `classes.classFormSchema`                                           | 201     |
| PATCH  | `/classes/:id`                      | GA    | `classes.classFormSchema`                                           | 200     |
| PATCH  | `/classes/:id/status`               | GA    | `common.activeStatusSchema`                                         | 200     |
| DELETE | `/classes/:id`                      | GA    | -                                                                   | 200     |
| GET    | `/staff-members`                    | GA    | -                                                                   | 200     |
| POST   | `/staff-members`                    | GA    | `staff-members.staffMemberFormSchema`                               | 201     |
| PATCH  | `/staff-members/:id`                | GA    | `staff-members.staffMemberFormSchema`                               | 200     |
| PATCH  | `/staff-members/:id/status`         | GA    | `common.activeStatusSchema`                                         | 200     |

Gym locations notes:

- One gym (and its owner, the gym admin) can have several locations, shown to the owner as "My gyms". Memberships, plans, balance and products are shared by all of them: a member has one account and one weekly limit, and the visits count the same wherever they train.
- A location is `{ id, name, address, phone, latitude, longitude, mapUrl, isActive }`. `latitude` and `longitude` are the pin the owner set on the map (create and edit require both; they are `null` only on locations that existed before coordinates). `mapUrl` is an optional `https` Google Maps link the owner pasted (`''` when none): open it when present, otherwise build `https://www.google.com/maps/search/?api=1&query=<latitude>,<longitude>`. Every new gym (`POST /gyms`) starts with one location (`Main`); existing gyms were given one by the migration. `GET /gym-locations` returns every location to a gym admin and only active ones to a client (list them so the member can see where to go). The gym admin adds and edits locations and closes or reopens them with `PATCH /gym-locations/:id/status`; they are never deleted, and the last active one cannot be closed (`422`).
- `POST /attendance/check-in` takes an optional `locationId`. With one active location it is used automatically; with several the request needs `locationId` (`422` otherwise, and `422` for a location that is not an active one of the gym). Attendance records carry `locationId` and `locationName` (`null` for check-ins from before locations existed).

Class timetable notes:

- Every new gym (`POST /gyms`) starts with default classes (Abs, Aerobics, Zumba, Yoga, Pilates, Spinning, Cross Training, Stretching & Mobility) and no instructors; the gym admin edits, hides or removes them.

- A class is a weekly repeating slot: `{ name, description, weekdays: number[] (1 = Monday to 7 = Sunday), startTime, endTime (gym-local HH:MM), staffMemberId | null, staffMemberName | null, isActive }`. Send `staffMemberId: ''` for no instructor. `GET /classes` returns only active classes to a client; show them per weekday ordered by `startTime`.
- A class must end after it starts. An instructor cannot be on two overlapping active classes on the same weekday (`422` naming the clash); back-to-back is fine. Only active staff of the gym can be assigned, but a class keeps an instructor that was deactivated later. Staff are never deleted, only deactivated.

Membership plan notes:

- `POST /uploads` stores one image of the gym and returns `{ url }` (`/uploads/<gymId>/<file>`; prefix it with the API base URL). Send that `url` as `imageUrl` on a product or on an exercise of a workout program; an empty string removes the image. A `url` of another gym is rejected with `422`. Files that are uploaded but never saved are not cleaned up yet.
- Products have `category` (`supplement`, `snack`, `drink`, `merchandise`, `shake`, `smoothie`) and `imageUrl` (empty = show a default icon for the category; leaving `imageUrl` or `category` out of `PATCH /products/:id` keeps the current value). `shake` and `smoothie` are made to order: `stock` is always stored as 0 and ignored, clients still see them (even with no stock) but `POST /products/:id/purchase` returns `403` for a client and `422` unless a gym admin records the sale with `paymentMethod: 'cash'`. Show a "payable only by cash at the gym" warning for them.
- Each exercise of a workout program has `icon` (a default movement figure the apps draw: `squat`, `bench-press`, `deadlift`, `overhead-press`, `pull-up`, `row`, `lat-pulldown`, `curl`, `triceps`, `lunge`, `leg-press`, `push-up`, `plank`, `crunch`, `run`; older values such as `barbell` or `legs` are mapped to the closest one) and `imageUrl` (the gym's own photo, shown instead of the figure when set).

- The standard price list is the set of plans with a term (`monthly`, `three_months`, `six_months`, `yearly`) per `weeklyVisits` (3x to 6x, 0 = unlimited) and `gender`. Gym admins save it per gender with `PUT /membership-plans/price-grid` body `{ gender, cells: [{ weeklyVisits, type, price | null }] }` (`null` or 0 removes the price). Plans with `visit_based` or `personal_training` are extras (daily pass, packs).
- `GET /price-list` returns `{ notes: string[], photos: [{ id, url, createdAt }] }`. A photo `url` is a path such as `/uploads/<gymId>/<file>.jpg`; prefix it with the API base URL. Files are public read-only under `/uploads`.
- `GET /membership-plans` for a client returns only active plans of the client's own gender (`Client.gender`; none while unset). Each plan has `gender`, `weeklyVisits` (0 = unlimited), `type`, `durationDays`, `price` (ALL). Offers are the longer terms of the same gender and `weeklyVisits`; compute the saving against the monthly price in the app.
  Card payments by a client (`C`) are verified with a one-time code and cannot be sent straight to `/balance/deposit` or `/memberships/subscribe` (those return `403`). Flow: `POST /payment-challenges` with `{ kind: 'deposit', deposit }` or `{ kind: 'membership', subscription }` (each with `paymentMethod: 'card'` and `card`) returns `{ challengeId, expiresAt, demoCode? }`; the member enters the 6-digit code and the app calls `POST /payment-challenges/:id/verify` with `{ code }`, which charges and returns `{ kind: 'deposit', transaction }` or `{ kind: 'membership', membership }`. Codes expire after 5 minutes, allow 3 attempts and work once; a new start replaces the open challenge. `demoCode` exists only outside production (no SMS provider yet).

- `POST /balance/deposit` and `POST /memberships/subscribe` with `paymentMethod: 'card'` also need `card: { brand: 'visa' | 'mastercard', last4: '1234' }`. Send only these two values: the app collects the number, expiry and CVC on the device, validates them, and never sends or stores them. A deposit `amount` only has to be greater than zero; deposit methods are `card` (clients and gym admins) and `cash` (gym admins only).
- `POST /memberships/subscribe` body is `{ planId, paymentMethod: 'balance' | 'card', card? }` (cash is not accepted from clients). Both return a paid membership: `active` when it starts today, `upcoming` when it is queued (see the next point). Errors: `422` for a plan of the other gender, missing gender, insufficient balance, or an existing pending membership.
- `POST /memberships` and `POST /memberships/:id/renew` (gym staff) only accept `paymentMethod: 'cash'` (`422` otherwise) and the membership is paid at once. Members who pay by card or balance use `POST /memberships/subscribe` in their own app.
- Memberships queue: a new paid membership (`subscribe`, `POST /memberships`, `renew`) never overlaps another one. Its `startDate` is the requested date, or the day after the client's last `active`/`upcoming` membership ends when that is later; `endDate` is `startDate` plus the plan duration. So 1 month, then another bought weeks before it ends, then 6 months later each start the day after the previous one ends. Read the real `startDate`/`endDate` from the response; the requested date is only a minimum.
- Membership `status` is one of `pending` (waiting for payment), `active` (started, not ended), `upcoming` (paid, `startDate` in the future), `expired`, `cancelled`. `upcoming` and `expired` are derived from the dates when read. Only the `active` membership allows check-in. `GET /memberships` returns every membership of the client; show the queue as the `active`, `upcoming` and `pending` ones ordered by `startDate`.
- `GET /balance` returns `{ balance, transactions, nextCursor }`: the newest transactions first, 20 per page (`?limit=` up to 50). While `nextCursor` is not `null`, request the next page with `?cursor=<nextCursor>` (add `clientId` again for gym admins). `balance` is always the full ledger sum, not the sum of the loaded page. Filters (all optional, combine with paging): `from` and `to` (`YYYY-MM-DD`, inclusive, days in the gym timezone), `minAmount` and `maxAmount` (>= 0; they match the size of a transaction, so `500` finds a 500 deposit and a -500 purchase). `422` when `from` is after `to` or `minAmount` is above `maxAmount`.
- `GET /attendance` returns the latest check-ins (at most 100, newest first); add `?limit=10` to get fewer.
- `GET /attendance/history` returns `{ records, nextCursor }` for long histories: newest check-ins first, 20 per page (`?limit=` up to 50). While `nextCursor` is not `null`, request the next page with `?cursor=<nextCursor>`. Clients only get their own check-ins.
- `GET /memberships/history` returns `{ memberships, nextCursor }` the same way: latest `startDate` first, 20 per page (`?limit=` up to 50), next page with `?cursor=<nextCursor>`. Clients only get their own memberships. Filters (optional, combine with paging): `status` (`pending`, `active`, `upcoming`, `expired`, `cancelled`; `upcoming` and `expired` are matched by the dates like in the responses) and `from`/`to` (`YYYY-MM-DD`, inclusive) which match memberships whose period overlaps that range. `422` when `from` is after `to`.
- `POST /attendance/check-in` returns `422` when the membership's `weeklyVisits` limit for the current week is used up. A member can check in several times on the same local day (in and out); only the first entry of the day counts as a visit for the weekly limit, visit packs and `visitsUsed`. A repeated scan within 60 seconds returns `422`.
- `GET /dashboard/client` `activeMembership` includes `price` (amount paid, ALL), `visitsAllowed` (weekly visits x 4 weeks for each 28-day period of the membership (the 29th to 31st day add none); less only for memberships shorter than 28 days; 0 when `weeklyVisits` is 0) and `visitsUsed` (check-ins on that membership in the same period). `visitsEndDate` is the end of the last full 4 weeks of a weekly plan (e.g. day 28 of a 30-day month); show it, and the days remaining until it, instead of `endDate`. Show `visitsAllowed` boxes with `visitsAllowed - visitsUsed` filled. The payload also has `week: { start, today, checkedInDates, previousVisits }`: the Monday of the current week, today (gym-local `YYYY-MM-DD`), the days of this week with a check-in and the number of days with a check-in in the previous week (compare the two for the "vs last week" label), for the weekly calendar.
- `Client` payloads and the create/update client bodies include `gender` (`male` | `female`; `null` on legacy rows).

Auth routes (Better Auth, not under `/api/v1`): `POST /api/auth/sign-in/email`, `POST /api/auth/sign-out`, `GET /api/auth/get-session`, `POST /api/auth/change-password`. `GET /health` returns `{ "status": "ok" }`.
