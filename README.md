# Beeli Mobile

Beeli is an Expo + React Native language-learning app focused on Izon and other African languages. It combines guided lessons, audio playback, quizzes, journaling, social learning, contributions, classroom tools, and real-time multiplayer.

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
- Hono + Drizzle backend API for progress, content, feed, contributions, bounties, and quiz results

## Stack

### Mobile app

- Expo SDK 54
- React Native 0.81
- React 19
- Expo Router 6
- Clerk Expo
- TanStack React Query
- Zustand
- NativeWind + Tailwind CSS
- Expo AV, Notifications, Secure Store, Haptics

### Backend

- Hono
- Drizzle ORM
- Neon / Postgres
- Clerk backend SDK
- Vercel Blob for uploaded audio assets

### Multiplayer

- PartyKit
- Partysocket

## Repository layout

```text
app/           Expo Router screens
components/    Reusable UI and feature components
lib/           API helpers, data helpers, analytics, hooks, utilities
store/         Zustand stores
types/         Shared TypeScript types
server/        Hono API + Drizzle schema/routes
partykit/      Real-time multiplayer workers
userio-docs/   Product and planning docs
```

## Core product areas

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

### Mobile app

Create a local Expo env file such as `.env.local` in the repository root.

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_PARTYKIT_HOST=localhost:1999
```

### Backend

Create `server/.env`.

```env
PORT=3000
DATABASE_URL=postgres://...
CLERK_SECRET_KEY=sk_test_...
BLOB_READ_WRITE_TOKEN=vercel_blob_...
PARTYKIT_API_KEY=...
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
```

## Getting started

### 1. Install dependencies

Install dependencies for each workspace used during development.

```bash
npm install
cd server && npm install
cd ../partykit && npm install
```

### 2. Prepare the backend

From [server/package.json](server/package.json):

- `npm run db:push` to apply the Drizzle schema
- `npm run db:seed` to seed starter content if needed

### 3. Start local services

Run these in separate terminals:

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
npm start
npx expo start --no-dev --minify --clear    
```

You can then open:

- `i` for iOS simulator
- `a` for Android emulator
- `w` for web

You can also use the native run commands:

```bash
npm run ios
npm run android
npm run web
```

## Useful scripts

### Root

- `npm start` — Expo dev server
- `npm run ios` — run iOS app
- `npm run android` — run Android app
- `npm run web` — run web app
- `npm run lint` — run Expo lint
- `npm run dev:server` — start the API server from the root project

### Server

From [server/package.json](server/package.json):

- `npm run dev` — watch-mode API server
- `npm run build` — TypeScript build
- `npm run start` — run built server
- `npm run db:push` — push schema changes
- `npm run db:seed` — seed content
- `npm run db:studio` — open Drizzle Studio

### PartyKit

From [partykit/package.json](partykit/package.json):

- `npm run dev` — local PartyKit server
- `npm run deploy` — deploy PartyKit workers

## Native IDE workflows

### Xcode

The repository already includes an `ios/` project.

Typical workflow:

```bash
npx expo prebuild --platform ios --clean
npm run ios
```

If you want to work directly in Xcode:

1. Run prebuild if native files need regeneration.
2. Open [ios/BeeliMobile.xcworkspace](ios/BeeliMobile.xcworkspace).
3. Select a simulator or connected device.
4. Build and run from Xcode.

Use Xcode when you need:

- native capability changes
- signing or provisioning fixes
- device logs and crash diagnostics
- iOS-specific debugging

### Android Studio

For Android native work:

```bash
npx expo prebuild --platform android --clean
npm run android
```

If you want to work directly in Android Studio:

1. Regenerate native files with Expo prebuild when needed.
2. Open the `android/` folder in Android Studio.
3. Sync Gradle.
4. Run on an emulator or physical device.

Use Android Studio when you need:

- Gradle or manifest changes
- emulator inspection
- native Android debugging
- signing and release troubleshooting

## Deployment and release workflows

### Vercel deployment for the API

The API lives in `server/` and is configured for Vercel with [server/vercel.json](server/vercel.json).

Typical deploy flow:

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

After deployment:

- verify `/api/health`
- verify Clerk-authenticated routes
- update `EXPO_PUBLIC_API_URL` in mobile environments if the domain changes

### PartyKit deployment for multiplayer

Multiplayer workers live in `partykit/` and are configured in [partykit/partykit.json](partykit/partykit.json).

Typical deploy flow:

```bash
cd partykit
npx partykit deploy
```

After deployment:

- set the production PartyKit host in `EXPO_PUBLIC_PARTYKIT_HOST`
- make sure the backend has a matching `PARTYKIT_API_KEY`
- verify quiz battle, paired lesson, and matchmaking flows

### EAS builds and releases

EAS configuration is defined in [eas.json](eas.json).

Available profiles:

- `development` — internal development client with local API URL
- `development-simulator` — simulator-focused development client
- `preview` — internal distribution against the hosted API
- `production` — production build against the hosted API

Typical commands:

```bash
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

The app uses Expo updates with runtime version policy set to app version in [app.json](app.json).

Use OTA updates only for JavaScript and asset changes that do not require native code changes. If you changed native modules, config plugins, iOS/Android permissions, or prebuild output, ship a new binary through EAS Build instead.

## Current architecture notes

- [app/_layout.tsx](app/_layout.tsx) wires Clerk, React Query, theming, analytics boot, and global navigation
- [app/index.tsx](app/index.tsx) handles auth-aware landing and onboarding redirect
- [app/(onboarding)/index.tsx](app/%28onboarding%29/index.tsx) sets initial learner language and daily-goal preferences
- [app/(tabs)/learn.tsx](app/%28tabs%29/learn.tsx) is the main learning hub, including resume support
- [app/lesson/[id].tsx](app/lesson/%5Bid%5D.tsx) drives lesson playback and completion
- [app/quiz.tsx](app/quiz.tsx) generates quizzes from dictionary data and records results
- [app/dashboard.tsx](app/dashboard.tsx) learner stats, XP, and streak overview
- [app/dictionary.tsx](app/dictionary.tsx) full dictionary browser with saved-word management
- [app/bounties.tsx](app/bounties.tsx) community bounty listings and contribution prompts
- [app/word-review.tsx](app/word-review.tsx) spaced-repetition review flow
- [app/my-contributions.tsx](app/my-contributions.tsx) personal contribution history
- [app/adinkra.tsx](app/adinkra.tsx) Adinkra cultural symbols browser
- [app/geez-lesson.tsx](app/geez-lesson.tsx) Geez script learning module
- [store/audio-store.ts](store/audio-store.ts) manages playback state and persisted resume position
- [store/language-store.ts](store/language-store.ts) persists selected language locally
- [store/theme-store.ts](store/theme-store.ts) persists user theme preference
- [store/notification-store.ts](store/notification-store.ts) manages in-app notification state
- [store/quiz-store.ts](store/quiz-store.ts) active quiz session state
- [store/story-store.ts](store/story-store.ts) story mode playback state
- [store/geez-store.ts](store/geez-store.ts) Geez script session state
- [store/classroom-store.ts](store/classroom-store.ts) classroom session and group state
- [store/contribution-store.ts](store/contribution-store.ts) word/phrase contribution form state
- [store/matching-store.ts](store/matching-store.ts) matching game session state
- [server/src/app.ts](server/src/app.ts) mounts the API routers
- [server/src/db/schema.ts](server/src/db/schema.ts) defines the Drizzle schema

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

- TypeScript strict mode is enabled
- Expo Router typed routes are enabled
- The app uses file-based routing and NativeWind classes throughout
- Prefer shared hooks in `lib/hooks/` for server data access
- Prefer Zustand only for local UI/session state
- Some classroom and contributor areas still mix production-backed and mock-backed behavior, so validate flows before extending them

## Documentation

- [CLAUDE.md](CLAUDE.md) — repository-specific architecture and workflow notes
- [userio-docs/APP_IMPROVEMENTS_IMPLEMENTATION_GUIDE.md](userio-docs/APP_IMPROVEMENTS_IMPLEMENTATION_GUIDE.md) — implementation roadmap for product improvements
- [userio-docs/DATABASE_SCHEMA_SNAPSHOT.md](userio-docs/DATABASE_SCHEMA_SNAPSHOT.md) — database reference

## Learn more

- [Expo docs](https://docs.expo.dev/)
- [Expo Router docs](https://docs.expo.dev/router/introduction/)
- [Clerk docs](https://clerk.com/docs)
- [TanStack Query docs](https://tanstack.com/query/latest)
- [NativeWind docs](https://www.nativewind.dev/)
- [Hono docs](https://hono.dev/)
- [Drizzle docs](https://orm.drizzle.team/)
- [PartyKit docs](https://www.partykit.io/docs)
