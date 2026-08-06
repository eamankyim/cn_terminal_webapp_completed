# CN Terminal Mobile

Expo-managed React Native (TypeScript) client for CN Terminal. Talks to the same Express + Prisma backend as the web app — no mobile-only APIs.

**Expo SDK 54** (React Native 0.81 / React 19.1) — matches current Expo Go on physical iOS devices.

## Prerequisites

- Node.js 20.19.4+ (SDK 54 requirement)
- Expo Go on a device, or iOS Simulator / Android Emulator
- Backend reachable at the URL in `EXPO_PUBLIC_API_URL`

## Setup

```bash
cd mobile
npm install
cp .env.example .env   # if you don't already have a .env
```

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | API base including `/api`, e.g. `https://app.cnterminalghana.com/api` or `http://localhost:5000/api` |

Create `mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=https://app.cnterminalghana.com/api
```

For a local backend on a physical device, use your machine’s LAN IP (not `localhost`), e.g. `http://192.168.1.10:5000/api`.

## Run

```bash
cd mobile
npx expo start
```

Then press `i` (iOS), `a` (Android), or scan the QR code with Expo Go.

If you previously ran an older SDK, clear the Metro cache once:

```bash
npx expo start -c
```

Other scripts:

```bash
npm run ios
npm run android
npm run web
npm run test:api   # smoke-tests auth + key endpoints (needs MOBILE_TEST_* in .env)
```

## Architecture (high level)

- `src/api/` – HTTP client + secure auth storage
- `src/context/` – Auth (login, logout, bootstrap via `/api/auth/me`)
- `src/navigation/` – Auth stack + main tabs (Dashboard, Jobs, Customers, Account)
- `src/screens/` – Feature screens
- `src/realtime/` – Socket.IO (jobs + notifications)
- `src/utils/permissions.ts` – `hasRole` / `hasPermission` helpers

Auth mirrors the web app: `POST /api/auth/login`, `GET /api/auth/me`, Bearer token in `Authorization`.
