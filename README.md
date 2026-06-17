# Beeli

Beeli is a language-learning platform focused on Izon and other African languages. It combines guided lessons, audio playback, quizzes, journaling, social learning, community contributions, classroom tools, and real-time multiplayer.

This repository is a monorepo containing the mobile app, two web apps, the API server, and the real-time multiplayer workers.

## Repository layout

```text
mobile/        Expo + React Native app (iOS, Android, web)
web/           Next.js consumer web companion app
data/          Next.js org/educator content dashboard
server/        Hono + Drizzle API (progress, content, feed, contributions, multiplayer)
partykit/      Real-time multiplayer workers
docs/          Build and troubleshooting docs
userio-docs/   Product and planning docs
scripts/       Repo-level scripts
```

Each workspace has its own `package.json` and is installed and run independently (there is no root `package.json`).

## Highlights

- Clerk authentication with Expo Router route protection
- Multi-language learning flow with onboarding and persisted language selection
- Lesson playback with transcript support and resume-state tracking
- Quiz, matching game, story mode, cultural content, word of the day, and proverb of the day
- Dictionary with saved words and contribution-driven growth
- Adinkra cultural symbols browser and Geez script learning module
- Bounties system rewarding community vocabulary contributions with XP
- Dashboard with learner stats, streaks, and progress overview
- Journal, feed, notifications, contributor review, and feedback flows
- Classroom and institution-oriented learning features
- Real-time multiplayer backed by PartyKit
- Educator content dashboard for personalizing language content per organization/project

## Apps

### `mobile/` — Expo + React Native

The primary learning app, targeting iOS, Android, and web.

- Expo SDK 54, React Native 0.81, React 19
- Expo Router 6 (file-based, typed routes)
- Clerk Expo auth
- TanStack React Query + Zustand
- NativeWind + Tailwind CSS (the dark-first "Museum" design system)
- Expo AV, Notifications, Secure Store, Haptics

### `web/` — Next.js consumer app (`beeli-web`)

A Next.js 15 web companion: audio-first lessons, interactive transcripts with inline
dictionary popups, a persistent audio bar, course browsing, and gamified learning.
Uses its own purple "gradient/glow" design system (kept separate from the mobile "Museum" system).

### `data/` — Next.js content dashboard (`beelidata`)

An organization/project dashboard where educators personalize language content.
Org- and project-scoped routes back the educator content workflow.

### `server/` — Hono API (`izon-beeli-server`)

- Hono HTTP framework
- Drizzle ORM on Neon / Postgres
- Clerk backend SDK
- Vercel Blob for uploaded audio assets

### `partykit/` — Real-time multiplayer

- PartyKit + Partysocket workers powering quiz battles and paired lesson sessions

## Core product areas (mobile)

- **Learn:** courses, lessons, quizzes, matching, stories, daily content, culture
- **Listen:** audio-first lesson browsing
- **Journal:** learner reflection entries
- **Feed:** social posts, comments, likes, contribution audio previews
- **Profile / Settings:** stats, notifications, theme, feedback, progress reset
- **Dashboard:** learner stats, XP progress, streak summary, and next lesson prompt
- **Dictionary:** full word browser with audio, examples, and saved-word management
- **Word Review:** spaced-repetition review flow for saved words
- **Contribute:** submit words, phrases, bulk vocabulary, and full lesson audio
- **My Contributions:** personal contribution history and status tracking
- **Bounties:** community-driven vocabulary targets with XP rewards
- **Review:** approve or reject pending community submissions
- **Cultural:** Adinkra symbol browser and Geez script learning module
- **Classroom:** groups, assignments, and institution-facing flows
- **Multiplayer:** quiz battle and paired lesson sessions
- **Proverbs:** browsable proverb collection with translations

## Environment variables

### `mobile/`

Create a local Expo env file such as `mobile/.env.local`.

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_PARTYKIT_HOST=localhost:1999
```

### `server/`

Create `server/.env`.

```env
PORT=3000
DATABASE_URL=postgres://...
CLERK_SECRET_KEY=sk_test_...
BLOB_READ_WRITE_TOKEN=vercel_blob_...
PARTYKIT_API_KEY=...
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
```

The `web/` and `data/` apps each read their own Clerk and API configuration; see their
respective `.env.local` files.

## Getting started

### 1. Install dependencies

Install dependencies per workspace you intend to run:

```bash
cd mobile && npm install
cd ../server && npm install
cd ../partykit && npm install
cd ../web && npm install      # optional, consumer web app
cd ../data && npm install     # optional, educator dashboard
```

### 2. Prepare the backend

From `server/`:

- `npm run db:push` — apply the Drizzle schema
- `npm run db:seed` — seed starter content if needed
- `npm run db:sync` — sync content (dict/lessons/proverbs/cultural/sentences)

### 3. Start local services

Run each in its own terminal.

#### API server

```bash
cd server
npm run dev
```

#### PartyKit

```bash
cd partykit
npm run dev
```

#### Mobile app

```bash
cd mobile
npm start
# or a clean, production-like start:
npx expo start --no-dev --minify --clear
```

Then press `i` (iOS simulator), `a` (Android emulator), or `w` (web). Or use the
native run commands:

```bash
cd mobile
npm run ios
npm run android
npm run web
```

#### Web apps (optional)

```bash
cd web && npm run dev      # consumer web app on http://localhost:3001
cd data && npm run dev     # educator dashboard on http://localhost:3002
```

## Useful scripts

### `mobile/`

- `npm start` — Expo dev server
- `npm run ios` / `npm run android` / `npm run web` — native/web runs
- `npm run lint` — Expo lint
- `npm test` — Jest
- `npm run dev:server` — start the API server from the mobile workspace

### `server/`

- `npm run dev` — watch-mode API server
- `npm run build` / `npm run start` — TypeScript build and run
- `npm run db:push` — push schema changes
- `npm run db:seed` — seed content
- `npm run db:sync` — sync content (with `:dict`, `:lessons`, `:proverbs`, `:cultural`, `:sentences` variants)
- `npm run db:studio` — open Drizzle Studio

### `partykit/`

- `npm run dev` — local PartyKit server
- `npm run deploy` — deploy PartyKit workers

### `web/` and `data/`

- `npm run dev` — Next.js dev server (ports 3001 and 3002 respectively)
- `npm run build` / `npm run start` — production build and run
- `npm run lint` — Next.js lint

## Native IDE workflows

Run these from the `mobile/` workspace. The Expo project already includes `mobile/ios/`
and `mobile/android/`.

### Xcode

```bash
cd mobile
npx expo prebuild --platform ios --clean
npm run ios
```

To work directly in Xcode, run prebuild if native files need regeneration, open
`mobile/ios/Beeli.xcworkspace`, pick a simulator or device, then build and run.

Use Xcode for native capability changes, signing/provisioning fixes, device logs and
crash diagnostics, and iOS-specific debugging.

### Android Studio

```bash
cd mobile
npx expo prebuild --platform android --clean
npm run android
```

To work directly in Android Studio, regenerate native files with prebuild when needed,
open `mobile/android/` in Android Studio, sync Gradle, then run on an emulator or device.

Use Android Studio for Gradle/manifest changes, emulator inspection, native Android
debugging, and signing/release troubleshooting.

## Deployment and release workflows

See [docs/troubleshooting.md](docs/troubleshooting.md) for known build and provisioning issues.

### Vercel deployment for the API

The API lives in `server/` and is configured for Vercel via `server/vercel.json`.

```bash
cd server
npx vercel
npx vercel --prod
```

Before deploying, make sure Vercel has these environment variables configured:

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `BLOB_READ_WRITE_TOKEN`
- `PARTYKIT_API_KEY`
- `ALLOWED_ORIGINS`

After deployment, verify `/api/health` and the Clerk-authenticated routes, and update
`EXPO_PUBLIC_API_URL` in mobile environments if the domain changes.

### PartyKit deployment for multiplayer

Multiplayer workers live in `partykit/` and are configured in `partykit/partykit.json`.

```bash
cd partykit
npx partykit deploy
```

After deployment, set the production PartyKit host in `EXPO_PUBLIC_PARTYKIT_HOST`, make
sure the backend has a matching `PARTYKIT_API_KEY`, and verify quiz battle, paired
lesson, and matchmaking flows.

### EAS builds and releases

EAS configuration is defined in `mobile/eas.json`.

Available profiles:

- `development` — internal development client with local API URL
- `development-simulator` — simulator-focused development client
- `preview` — internal distribution against the hosted API
- `production` — production build against the hosted API

```bash
cd mobile
eas build --platform ios --profile development
eas build --platform ios --profile preview
eas build --platform android --profile preview
eas build --platform all --profile production --auto-submit
```

Recommended release flow:

1. Deploy backend updates to Vercel.
2. Deploy PartyKit workers.
3. Confirm production environment variables in Expo/EAS.
4. Run an EAS preview build for QA.
5. Ship a production build after validation.

### EAS Update

The app uses Expo updates with the runtime version policy set to app version in
`mobile/app.json`.

Use OTA updates only for JavaScript and asset changes that do not require native code
changes. If you changed native modules, config plugins, iOS/Android permissions, or
prebuild output, ship a new binary through EAS Build instead.

## API capabilities

The backend currently includes routes for:

- user sync and preferences
- learning progress and streaks
- dashboard stats
- journal entries
- feed, likes, and comments
- contributions and lesson contributions
- contributor listings and leaderboards
- bounties (creation, progress tracking, XP rewards)
- dictionary, courses, lessons, sentences, proverbs, and cultural content
- word bank
- daily challenges
- notifications and push token management
- languages
- feedback
- multiplayer session APIs
- quiz result recording

## Notes for contributors

- TypeScript strict mode is enabled across workspaces
- The mobile app uses Expo Router file-based routing with typed routes and NativeWind classes
- Prefer shared hooks in `mobile/lib/hooks/` for server data access; use Zustand only for local UI/session state
- The mobile "Museum" design system and the `web/` "gradient/glow" system are separate — do not mix them
- Educators personalize content through the `data/` dashboard, not by editing files directly
- Some classroom and contributor areas still mix production-backed and mock-backed behavior, so validate flows before extending them

## Documentation

- [CLAUDE.md](CLAUDE.md) — repository-specific architecture and workflow notes
- [web/README.md](web/README.md) — consumer web app details
- [userio-docs/](userio-docs/) — product and planning docs

## Learn more

- [Expo docs](https://docs.expo.dev/)
- [Expo Router docs](https://docs.expo.dev/router/introduction/)
- [Clerk docs](https://clerk.com/docs)
- [TanStack Query docs](https://tanstack.com/query/latest)
- [NativeWind docs](https://www.nativewind.dev/)
- [Hono docs](https://hono.dev/)
- [Drizzle docs](https://orm.drizzle.team/)
- [PartyKit docs](https://www.partykit.io/docs)
- [Next.js docs](https://nextjs.org/docs)
