# Mobile app guide (for someone new to mobile development)

This guide explains what was built in `mobile/`, how to run it on your phone, and how the code is organised. You do not need to know anything about mobile development beforehand. If you know the web app in `frontend/`, you already know 80% of this: it is React, TypeScript, React Query and Zod again.

## 1. What you got

A member app for gym **clients only** (a gym owner or staff account is refused at sign-in).

The bottom menu has five items:

| Tab            | What the member does there                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Home**       | Sees the current membership, visits left, this week's training days, balance and check-in totals                                                                               |
| **Membership** | Sees the queue of memberships (active, up next, pending) and buys a plan with credit or card                                                                                   |
| **Check-in**   | Shows the QR code reception scans, the card number, the locker, and can check out                                                                                              |
| **Training**   | Browses the gym's workout programs (days and exercises) and the weekly class timetable                                                                                         |
| **Profile**    | Sees name and email, opens **Balance** (top up, history), **My visits**, **Gym locations**, and the **Settings**: language, appearance (light/dark), change password, sign out |

That is five menu items, one of which (Profile) leads to the secondary screens.

## 2. Mobile in five minutes

| Word             | What it is                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React Native** | React for phones. You write components, but instead of `div` and `span` you use `View` and `Text`, and they become real native iOS/Android views.                      |
| **Expo**         | The toolkit around React Native: project setup, ready-made modules (secure storage, images, ...), a dev server, and cloud builds. The React Native team recommends it. |
| **Expo Go**      | A free app from the App Store / Google Play. It runs your project **without building anything**: you scan a QR code and your code opens inside it.                     |
| **Metro**        | The bundler (the "Vite" of React Native). `npm start` runs it.                                                                                                         |
| **Expo Router**  | File-based navigation (like Next.js, but for screens). A file in `src/app/` is a screen.                                                                               |
| **EAS Build**    | Expo's cloud service that turns your project into an installable `.apk`/`.ipa` for the stores. You do not need it to develop.                                          |

How web habits translate:

| On the web (`frontend/`)     | In the app (`mobile/`)                                            |
| ---------------------------- | ----------------------------------------------------------------- |
| `<div>`, `<span>`, `<p>`     | `<View>`, `<Text>` (all text must be inside `<Text>`)             |
| `<button>`                   | `<Pressable>` (wrapped by our `Button`)                           |
| `<input>`                    | `<TextInput>` (wrapped by our `TextField`)                        |
| CSS / Tailwind classes       | `StyleSheet.create({ ... })` objects (flexbox, column by default) |
| react-router (`/membership`) | Expo Router (`src/app/(tabs)/membership.tsx`)                     |
| cookie session               | bearer token saved in the phone's secure storage                  |
| scrolling page               | `ScrollView` / `FlatList` (nothing scrolls by itself)             |
| modal / drawer               | `BottomSheet` (a panel that slides up)                            |

## 3. Run it on your phone

### 3.1 One-time setup

1. **Node 22.13 or newer.** The current Expo SDK (58) will not run on older Node. Check with `node -v`; your project folder used Node 20.11 for the web app. Easiest way to have both: install [nvm-windows](https://github.com/coreybutler/nvm-windows), then `nvm install 22` and `nvm use 22` before working in `mobile/`. (Node 22 also runs the web app and the API fine.)
2. **Expo Go** on your phone (App Store or Google Play). Expo Go supports the latest SDK, which is the one this project uses.
3. Your **phone and computer on the same Wi-Fi**.

### 3.2 Every time

Terminal 1, from the repo root: start the database and API (see the root `README.md`):

```bash
npm run db:up
npm run dev:backend
```

Terminal 2:

```bash
cd mobile
npm install          # first time only
npm start
```

A QR code appears. Android: open Expo Go and tap _Scan QR code_. iPhone: open the normal Camera app and scan it. The app opens and shows the sign-in screen.

**iPhone only: one-time Expo account.** Expo Go on a real iPhone only opens your project when the computer and Expo Go are signed in to the **same free Expo account** (create one at <https://expo.dev/signup>). Run `npx expo login` in `mobile/` and sign in, then in Expo Go tap the account icon (top right) and sign in with the same account. Press _Try again_ and scan once more. This is Expo's account, not the gym app's sign-in.

Sign in with a demo member (run `npm run db:seed` at the repo root once to create them). The password is `Password123!`:

| Email               | Good for testing                                                |
| ------------------- | --------------------------------------------------------------- |
| `client@alpha.test` | Alex Demo: active membership, balance, visits, card `ALEX-1001` |
| `ana@alpha.test`    | A visit pack (7 of 10 left)                                     |
| `jon@alpha.test`    | Currently checked in (shows locker and the Check out button)    |
| `mira@alpha.test`   | Expired membership                                              |
| `leo@alpha.test`    | A bank-transfer membership waiting for payment                  |
| `admin@alpha.test`  | A gym admin: the app refuses it ("for gym members")             |

### 3.3 How the phone finds your computer

The app needs the address of the API. In development it works it out by itself: Expo already knows your computer's address (the one inside the QR code, for example `192.168.1.50`), and the API is on the same machine at port `4000`. The sign-in screen prints the address it uses (`Server: http://...`) in development.

If sign-in says it cannot reach the server:

- Open `http://<your-computer-ip>:4000/health` in the **phone's browser**. You should see `{"status":"ok"}`. If not, it is the network, not the app.
- Windows asks "Allow Node.js through the firewall?" the first time the API runs. Allow it on _private networks_, otherwise the phone is blocked.
- Some Wi-Fi networks isolate devices from each other (guest or hotel Wi-Fi). Use a normal network or your phone's hotspot.
- To set the address yourself, copy `mobile/.env.example` to `mobile/.env.local` (it must be a `.local` file, Expo refuses personal settings in `.env`), uncomment `EXPO_PUBLIC_API_URL=http://192.168.1.50:4000` with your IP, and restart `npm start`. If Expo advertises the wrong IP (WSL or VPN adapter), also add `REACT_NATIVE_PACKAGER_HOSTNAME=<your Wi-Fi IP>` there.
- Android emulator: it reaches the computer at `10.0.2.2` (used automatically as a fallback).

### 3.4 Other commands

```bash
npm run type-check   # TypeScript
npm run lint         # ESLint (Expo rules)
npx expo install <package>   # add a library (never use `npm install <package>`: it picks versions Expo cannot run)
npx expo-doctor      # diagnose a broken setup
```

Edit a file and save: the app on your phone reloads by itself (Fast Refresh).

## 4. How the code is organised

```
mobile/
  app.json            app name, icon, splash, plugins
  metro.config.js     lets the app import ../shared (Zod schemas and types)
  tsconfig.json       "@/..." -> src/..., "@gym/shared/..." -> ../shared/src/...
  src/
    app/              SCREENS (Expo Router). One file = one screen.
      _layout.tsx       root: providers, splash screen, who may see what
      sign-in.tsx
      (tabs)/           the five menu items (_layout.tsx defines the tab bar)
      balance.tsx, attendance.tsx, locations.tsx   opened from Profile
    components/
      ui/               the reusable kit (buttons, cards, inputs, sheets, lists...)
      dashboard/ memberships/ payments/ access/ training/ balance/ attendance/ locations/ profile/
    hooks/<domain>/   React Query hooks (data for screens)
    services/<domain>/  one function per API endpoint
    api/              fetch wrapper: adds the token, handles errors
    providers/        session (who is signed in), React Query setup
    storage/          what is saved on the phone (token, check-in pass, language, theme)
    i18n/             t(), useTranslation(), the language in use (dictionaries are in ../shared/src/i18n)
    theme/            colours, spacing, light and dark mode (theme/preference.ts keeps the choice)
    utils/            formatting, labels, card validation, price list logic, exercise icons
    config/env.ts     finds the API address
```

The same domain names (`memberships`, `balance`, `attendance`, ...) are used as in `backend/` and `frontend/`.

### The path of a request

```
screen (src/app/...)  ->  hook (hooks/memberships)  ->  service (services/memberships)  ->  api/client.ts  ->  /api/v1
```

A screen never calls `fetch`. For example, the Membership tab calls `useMemberships()`; that hook calls `membershipsService.list()`; that calls `apiClient.get('/memberships')`, which adds `Authorization: Bearer <token>`, unwraps `{ data }` and turns errors into an `ApiError`.

## 5. The pieces, one by one

### 5.1 A screen

Every screen is a React component with a default export. This is the whole Training tab pattern, simplified:

```tsx
export default function LocationsScreen() {
  const locations = useGymLocations(); // data (React Query)
  const { refreshing, onRefresh } = useRefresh(locations.refetch);

  return (
    <Screen refreshing={refreshing} onRefresh={() => void onRefresh()}>
      {' '}
      {/* scroll + pull to refresh */}
      <QueryBoundary query={locations}>
        {' '}
        {/* spinner / error / content */}
        {(list) => list.map((l) => <LocationCard key={l.id} location={l} />)}
      </QueryBoundary>
    </Screen>
  );
}
```

`Screen` handles the safe area (notch, home bar), scrolling and pull-to-refresh. `QueryBoundary` shows a spinner while loading, an error with a _Try again_ button on failure, and your content when the data is there.

### 5.2 Navigation

- `src/app/_layout.tsx` is the root. It uses `Stack.Protected`: the app screens exist **only while signed in**, and `sign-in` only while signed out. Sign in or out and the router moves the user by itself.
- `src/app/(tabs)/_layout.tsx` defines the five tabs in one array (`TABS`). A folder name in parentheses, `(tabs)`, groups screens without adding to the URL.
- Go to another screen: `router.push('/balance')`. Routes are type-checked (`typedRoutes`), so a typo is a compile error.

### 5.3 Data: queries and mutations

Reading data (`hooks/<domain>`):

```ts
export const useMembershipPlans = () =>
  useQuery({
    queryKey: ['membership-plans'],
    queryFn: membershipPlansService.list,
  });
```

Changing data uses `useMutation` and **always sets `meta.success`**, the text of the toast that tells the member it worked:

```ts
useMutation({
  meta: { success: 'Locker saved.' },
  mutationFn: (lockerNumber: string) => lockersService.assign({ lockerNumber }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }), // refresh what changed
});
```

`providers/query-client.ts` shows `meta.success` as a green toast and every error as a red toast automatically. `success` can also be a function when the message depends on the answer (a purchase says the start and end dates the **server** chose).

Long lists (balance, visits) use `useInfiniteQuery` + `InfiniteList`: the next page loads as you scroll, following the API's `nextCursor`.

### 5.4 Styling and the theme

There is no CSS. Styles are objects, and flexbox is the layout system (default direction is **column**). Colours come from the theme so light and dark mode work with no extra code:

```tsx
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: { backgroundColor: theme.colors.surface, padding: theme.spacing.lg },
  });

const MyThing = () => {
  const styles = useThemedStyles(createStyles); // rebuilt only when light/dark changes
  return <View style={styles.card} />;
};
```

Never write a colour such as `'#fff'` in a component (the QR tile is the one exception: scanners need black on white). Text always goes through `<Text variant="title|heading|body|caption|label" tone="muted|accent|danger|...">`.

### 5.5 The reusable kit (`components/ui`)

| Component                                                  | Use it for                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| `Screen`, `ScreenContainer`                                | Page shell: safe area, scroll, title, pull to refresh                    |
| `Text`, `Icon`                                             | All text and icons (theme aware)                                         |
| `Button`                                                   | `primary`, `secondary`, `ghost`, `danger`, with icon and loading spinner |
| `Card`, `StatRow`                                          | Boxes and a row of numbers                                               |
| `Badge`, `Banner`                                          | A small status label; an inline hint, warning or error                   |
| `ListGroup` + `ListRow`                                    | Settings-style rows (Profile)                                            |
| `TextField`, `FormTextField`                               | Input with label and error; the second one is wired to React Hook Form   |
| `ChipRow`, `SegmentedControl`, `SelectableCard`            | Picking one option                                                       |
| `BottomSheet`                                              | A panel that slides up (replaces the web's Modal and Drawer)             |
| `InfiniteList`                                             | Cursor-paged list with pull to refresh and a loading footer              |
| `QueryBoundary`, `EmptyState`, `ErrorState`, `LoadingView` | Loading, empty and error states                                          |
| `ToastHost`                                                | Shows toasts (one in the root, one inside every sheet)                   |

### 5.6 Forms and validation

Forms use React Hook Form with the **same Zod schemas as the web app**, imported from `@gym/shared` (for example `loginSchema` in the sign-in screen). The server still validates everything again; the schema only gives instant feedback.

### 5.7 Sign-in and "clients only"

`providers/SessionProvider.tsx` owns the session:

1. Sign in: `POST /api/auth/sign-in/email`, read the `set-auth-token` response header, save it in **secure storage** (Keychain on iPhone, Keystore on Android) via `storage/token.ts`.
2. Call `GET /me`. If the `role` is not `client`, the app signs out again and shows "This app is for gym members". (The server allows staff to sign in on the API, so the check is in the app. Staff have the web app.)
3. When the app opens, it reads the saved token and calls `/me` again, so you stay signed in. A `401` anywhere signs the member out with a message. If the server cannot be reached, a "try again" screen appears instead of signing out.

### 5.8 The check-in pass and the card

- The **QR code** contains the member's id. Reception scans it, the server finds the member and toggles check-in / check-out (`POST /attendance/scan`).
- The QR is drawn **on the phone** and saved in secure storage (`storage/member-pass.ts`), so it still opens when there is no mobile data. You only need a connection once, to download it.
- The **card** (the plastic one with the chip) is read by the gym's reader at the door or desk, never by the app. The app only shows the card number issued to the member, as an information line.
- Lockers: the member types the locker number they used (when the gym locks lockers with a key). When the gym locks them with the card, the number appears by itself after the card is used.

### 5.9 Paying: credit and card

`SubscribeSheet` (buy a plan) and `TopUpSheet` (add credit) both use `PaymentSheet`:

1. The member chooses credit or card (only the ways the gym allows: `GET /payment-settings`).
2. **Credit**: one request, `POST /memberships/subscribe`.
3. **Card**: the card fields are validated on the phone (Visa/Mastercard, Luhn check, expiry). **Only the brand and the last 4 digits are sent.** The server answers with a one-time code (`POST /payment-challenges`), the member types it, and only `POST /payment-challenges/:id/verify` actually charges. In development the code is shown on screen (`demoCode`), because there is no SMS provider yet.
4. The app never decides if a payment worked; it shows what the server answered and refreshes balance and memberships.

New memberships queue: a plan bought while another is running starts the day after it ends. The Membership tab lists the queue with the dates the server returned.

### 5.10 Languages (translations)

The app speaks English, Albanian (`sq`), Italian (`it`), German (`de`) and Greek (`el`), like the web app, and **both apps share the same dictionaries**: `shared/src/i18n/<language>/index.ts`. They are plain maps where **the English text is the key**:

```ts
'Check out': 'Dil',          // sq
```

- In a component: `const { t } = useTranslation();` then `{t('Check out')}`. Calling `useTranslation()` also makes the component redraw when the language changes.
- With values: `t('Hi, {{name}}', { name })`. Texts must be literal strings (no template strings), so the checker can find them.
- Text declared outside components (constants, label maps) uses `msg('...')` and is translated where it is shown (`utils/labels` has examples). A mutation's toast is `meta: { success: msg('...') }`.
- Server messages and the shared Zod messages stay English in the backend; the API client and `FormTextField` translate the known ones.
- The first language is the one of the gym's country (Albania > Albanian, ...). When the member picks one in **Profile > Language** it is saved on the phone and wins from then on. Dates and numbers follow the language; the currency never changes (it is the gym's).
- **Adding a text**: write `t('New text')` in the code, then add it to the four files in `shared/src/i18n` and run `npm run i18n:check` in the repo root. It lists every missing translation of the web **and** the mobile app and must pass.

### 5.11 Profile settings: appearance, language, password

- **Appearance** (`theme/preference.ts`): _Same as phone_, _Light_ or _Dark_, saved on the phone. `useTheme()` follows it, so every screen and the status bar change at once.
- **Language**: the five languages above, applied immediately.
- **Change password** (`ChangePasswordSheet`): uses the same Zod schema as the web (`changePasswordSchema`) and `POST /api/auth/change-password`. The server signs out the member's other devices and gives this phone a **new token** in the answer, which the app stores (`services/auth`); without that the phone would be signed out too.
- Language and appearance use the small reusable `OptionSheet` (tap an option and it is applied).

### 5.12 Sheets

Every `BottomSheet` has the same footer, like the drawers of the web app: **Cancel** and the main action (`submitLabel`, `onSubmit`) side by side, each taking half of the width. A sheet that only shows information (a full exercise, an option list) has a single full-width **Close** button (`cancelLabel`).

### 5.13 Training: programs, exercises and their icons

The backend stores, for each exercise, an `icon` **key** (`squat`, `bench-press`, `pull-up`, ...) and an optional photo `imageUrl` the gym uploaded. The backend never sends a drawing: the little movement figures are drawn by the apps from the key. The web app has them in `frontend/src/utils/constants/exercise-icons`; the mobile app has the same figures in `src/utils/exercise-icons` and draws them with `react-native-svg` (`ExerciseImage`). If the gym uploaded a photo, the photo is shown instead. **View full exercise** opens `ExerciseSheet` with the picture, sets, reps, weight, rest and the notes.

### 5.14 Filters and the calendar

- **Training level**: under _Programs_ there are three chips (Beginner, Intermediate, Advanced). None is selected at first, so every program shows. Tap one to filter; tap it again, or switch to _Classes_, to go back to the full list (`app/(tabs)/training.tsx`).
- **Transaction history**: on _Balance_ the **Filter** button (it shows how many filters are set) opens `BalanceFilterSheet` with a from date, a to date and a minimum and maximum amount, exactly like the web app. **Apply** sends them as `?from=&to=&minAmount=&maxAmount=` (`services/balance`); **Clear** empties the sheet. A range the API would refuse (start after end, minimum above maximum) is caught first with the same shared Zod schema (`balanceHistoryQuerySchema`). The balance shown is always the full ledger sum, never the sum of the filtered rows.
- **Dates are picked, not typed**: `DateField` shows the date as text and opens a calendar under it. The calendar is the same `MonthCalendar` (with `MonthNav`) that the Home _History_ sheet uses read-only; passing `onSelect` makes its days tappable. The month grid comes from `@gym/shared/calendar`, shared with the web app.

## 6. Recipes

**Add a new screen** (for example a shop list): create `src/app/shop.tsx` with `export default function ShopScreen()`, add `<Stack.Screen name="shop" options={{ title: 'Shop' }} />` inside the protected group of `src/app/_layout.tsx`, and link to it with `router.push('/shop')`.

**Add a new API call**:

1. Row in `mobile/API_CONTRACT.md` if the endpoint is new (and the endpoint itself in `backend/`).
2. `services/<domain>/index.ts`: one function using `apiClient`.
3. `hooks/<domain>/index.ts`: `useQuery` or `useMutation` (with `meta.success`).
4. Use the hook in a screen, wrap the data with `QueryBoundary`.

**Add a menu item**: add an entry to `TABS` in `src/app/(tabs)/_layout.tsx` and a file with the same name in `src/app/(tabs)/`. Keep the menu at five or fewer items.

**Change the look**: colours and spacing live in `src/theme/tokens.ts`.

## 7. When something breaks

| Symptom                                                     | Try                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm start` complains about the Node version                | Use Node 22.13+ (`node -v`)                                                                                                                                                                                                                                                                                                                                                             |
| Phone cannot open the project                               | Same Wi-Fi? Try `npx expo start --tunnel` (slower, works across networks)                                                                                                                                                                                                                                                                                                               |
| "You need to be signed in to Expo Go and Expo CLI" (iPhone) | Run `npx expo login` on the computer and sign in to Expo Go (account icon, top right) with the **same** account, then _Try again_                                                                                                                                                                                                                                                       |
| Expo Go spins forever on Windows                            | Firewall: as Administrator run `New-NetFirewallRule -DisplayName "Expo Metro 8081" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -Profile Private` (and the same for port 4000). Wrong IP (WSL/VPN adapter)? Run `$env:REACT_NATIVE_PACKAGER_HOSTNAME = "<your Wi-Fi IPv4 from ipconfig>"` before `npm start --clear`. Test in the phone's browser: `http://<ip>:8081` |
| "Cannot reach the gym server"                               | Section 3.3 (firewall, `/health` in the phone's browser, `EXPO_PUBLIC_API_URL`)                                                                                                                                                                                                                                                                                                         |
| Red error screen after editing                              | Read the message, fix the file, save. Shake the phone > _Reload_ if it stays stuck                                                                                                                                                                                                                                                                                                      |
| `Unable to resolve "react-native-web/..."`                  | Something tried to open the **web** version (pressing `w`, or a browser tab). The app is phone-only (`platforms` in `app.json`): use Expo Go, and restart `npm start`.                                                                                                                                                                                                                  |
| Strange behaviour after installing a package                | `npx expo install --check` fixes versions; `npx expo start --clear` clears the cache                                                                                                                                                                                                                                                                                                    |
| Changed `.env.local` and nothing happens                    | Restart `npm start` (env values are read at start)                                                                                                                                                                                                                                                                                                                                      |
| Sign-in fails with "Invalid email or password"              | Run `npm run db:seed` in the repo root; password is `Password123!`                                                                                                                                                                                                                                                                                                                      |

## 8. What is not included yet

- **Shop** (buying products), **membership history filters**, **push notifications** (reminders before a membership ends) and **biometric unlock**.
- **Store release**: Expo Go is for development. To publish you create a build with `npx eas-cli build` (needs an Expo account; Apple's developer program for the App Store). A release build needs the API on **HTTPS**: set `EXPO_PUBLIC_API_URL=https://your-api` before building, because plain `http://` is blocked on iPhones and, by default, in Android release builds.
- Automated tests for the app. The checks today are `npm run type-check` and `npm run lint`.

## 9. Glossary

- **Bundle**: the single JavaScript file Metro builds from your code and sends to the phone.
- **Fast Refresh**: edits appear on the phone within a second without losing state.
- **Safe area**: the part of the screen not covered by the notch, status bar or home bar.
- **Bearer token**: a secret string sent in the `Authorization` header that proves who is calling the API.
- **Secure storage**: encrypted storage managed by the phone's operating system; the right place for a token.
- **Native module**: code written in Swift/Kotlin that JavaScript calls (camera, secure storage). Expo Go contains the common ones; a library that needs another one requires a _development build_.
