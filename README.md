# Home OS Mobile

React Native (Expo) frontend for Home OS. **Expo SDK 54** (compatible with Expo Go on the Play Store). The **Next.js backend stays on Vercel** — all API routes, database, and auth are unchanged. This app is the native mobile client that talks to that backend.

## Stack

- **Expo SDK** (latest stable) with TypeScript
- **NativeWind** — Tailwind CSS syntax for React Native
- **Expo Router** — file-based routing (mirrors Next.js App Router)
- **Bottom tabs** — Dashboard, Family Profiles, Pantry, Meal Plan

## Reusing code from the Next.js project

When you build out this app, reuse and adapt:

- **Data fetching:** `../src/modules/family/useFamilyMembers.ts`, `../src/modules/pantry/usePantry.ts` (SWR-based). Adapt for React Native (same API base URL, auth headers).
- **Types:** `../src/modules/family/types.ts`, `../src/modules/pantry/types.ts`, `../src/modules/meal-plan/types.ts`.

Do not copy-paste yet — reference the parent project and adapt (e.g. point API base URL to your Vercel deployment).

## List screens (performance)

Any screen that renders a **list** (Pantry items, Meal Plan days, Family members) must use **FlatList**, not `map()` over an array. This is set up in `app/(tabs)/pantry.tsx` and `app/(tabs)/meal-plan.tsx` already.

## Run on your phone with Expo Go

1. **Install Expo Go** on your phone from the App Store (iOS) or Google Play (Android).

2. **Start the dev server** (same Wi‑Fi as your phone):
   ```bash
   cd homeos-mobile
   npm start
   ```

3. **Open the project on your phone:**
   - **iOS:** Scan the QR code in the terminal (or in the browser that opens) with your Camera app. Tap the banner to open in Expo Go.
   - **Android:** Scan the QR code with the Expo Go app (Projects → Scan QR code), or open the link shown in the terminal.

4. The app will load in Expo Go. Use the bottom tabs to switch between Dashboard, Family, Pantry, and Meal Plan.

**Troubleshooting:** If the phone can’t connect, try “tunnel” mode: press `s` in the terminal and choose “tunnel”, then scan the new QR code (slower but works across networks).

## Clean reinstall (after changing dependencies)

From the `homeos-mobile` folder:

```bash
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

On macOS/Linux: `rm -rf node_modules package-lock.json && npm install`

## Scripts

- `npm start` — Start Expo dev server (then scan QR with Expo Go)
- `npm run android` — Open on Android device/emulator
- `npm run ios` — Open on iOS simulator (macOS only)
- `npm run web` — Run in browser
