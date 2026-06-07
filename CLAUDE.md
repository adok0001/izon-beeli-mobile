## Project Overview

Beeli is an audio-first African-language learning platform (Izon and 70+ others, built for the diaspora). This repository is a **monorepo** of five workspaces — not a single Expo app. Each workspace has its own `package.json`, dependencies, and `.env`.

| Workspace    | Stack                                      | Role                                                        |
|--------------|--------------------------------------------|-------------------------------------------------------------|
| `mobile/`    | Expo SDK 54 · RN 0.81 · React 19 · Router 6 | The learner app (iOS, Android, web). ~68k LOC.              |
| `server/`    | Hono · Drizzle ORM · Neon Postgres · ESM    | Backend API (`/api/*`) — content, progress, billing, etc.  |
| `web/`       | Next.js (App Router)                        | Educator portal + marketing/landing site (port 3001).      |
| `partykit/`  | PartyKit · partysocket                      | Real-time multiplayer (quiz battles, paired lessons).      |
| `data/`      | Next.js                                     | Internal language-data labeling/contribution tool (3002).  |

`mobile` and `web` both authenticate with Clerk and call the `server` API. Multiplayer screens in `mobile` connect to `partykit`.

## Development Commands

Always `cd` into the target workspace first — there is no root `package.json`.

```bash
# mobile/
npx expo start --no-dev --minify --clear   # Expo dev server
npm run ios | android | web                # Run on a target
npm run lint                               # expo lint
npm test                                   # Jest (ts-jest)

# server/
npm run dev                                # tsx watch (port 3000)
npm run build                              # tsc → dist/
npm test                                   # Jest (ts-jest, CommonJS mode)
npm run db:push                            # drizzle-kit push (schema → DB)
npm run db:sync                            # seed/sync content into the DB

# web/ and data/
npm run dev                                # next dev (3001 / 3002)
npm run lint                               # next lint --max-warnings 0
```

## Architecture

### Mobile routing (Expo Router v6 — file-based, under `mobile/app/`)

- `mobile/app/index.tsx` — Auth guard: redirects to `/(tabs)/learn` if signed in, else `/(auth)/sign-in`
- `mobile/app/(auth)/` — Clerk sign-in/up, email verification, password reset
- `mobile/app/(tabs)/` — Bottom tabs: learn, listen, journal, feed, profile, leaderboard, plus an `educator/` group
- `mobile/app/lesson/[id].tsx` and many feature routes (multiplayer, classroom, bounties, games, scripts)

### Authentication (Clerk) — both client and server

- **Mobile:** `ClerkProvider` wraps the app in `mobile/app/_layout.tsx` with token caching via `expo-secure-store`. Helpers in `mobile/lib/auth.ts` (platform-aware; skips secure store on web). Requires `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- **Server:** `server/src/middleware/auth.ts` — `authMiddleware` verifies the Clerk JWT (`verifyToken`), then maps `clerkId → users.id`. Role gates layer on top: `adminMiddleware`, `reviewerMiddleware`, `professorMiddleware`, `elderMiddleware`. Admin routers mounted near public routes self-apply these gates.
- **User sync:** the JWT carries only `sub` (no username/email). The mobile client keeps `users.name`/`email`/`avatarUrl` fresh by calling `POST /api/users/sync` once per session (`mobile/lib/hooks/use-sync-user.ts`). The auth middleware therefore does **not** call Clerk per request — it only fetches from Clerk on a user's first-ever request to create the row. **Do not reintroduce a per-request `clerkClient.users.getUser` call** in the hot path.

### Data fetching (React Query, mobile)

- Query client in `mobile/lib/api.ts` (5min stale time, 2 retries). Typed `apiFetch<T>()` injects the Clerk token and throws `ApiError`; `friendlyError()` maps statuses to i18n strings.
- API base URL from `EXPO_PUBLIC_API_URL` via `mobile/lib/constants.ts`.

### Server (`server/src/`)

- `app.ts` wires CORS (allowlist via `ALLOWED_ORIGINS` in prod, `*` in dev), the logger, the global error handler, and mounts every router under `/api`. `index.ts` is the Node entry.
- Routers in `routes/`, shared logic in `lib/`, Drizzle schema in `db/schema.ts` (41 tables), client in `db/index.ts`.
- Stripe webhooks (`routes/billing.ts`) are mounted before auth and verify the signature. Cron endpoints are gated by `CRON_SECRET`.

### State management (Zustand, mobile)

- `mobile/store/audio-store.ts` — audio playback state; access via `useAudioStore()`.

### Styling (NativeWind + Tailwind v3, mobile)

- `className` Tailwind props on RN components. Dark mode via React Navigation's `ThemeProvider`. Theme colors in `mobile/constants/theme.ts`; Tailwind config in `mobile/tailwind.config.ts`; directives in `mobile/global.css`.

### Platform-specific code (mobile)

- `.ios.tsx` / `.web.tsx` extensions for overrides. `components/ui/icon-symbol.tsx` (Material Icons, Android/web) vs `icon-symbol.ios.tsx` (SF Symbols). Haptics on iOS via `components/haptic-tab.tsx`.

## Key Configuration

- **TypeScript strict mode** in all workspaces; in `mobile/` the path alias `@/*` maps to the **mobile** root.
- **React Compiler** and **New Architecture** enabled in `mobile/app.json`; typed routes on for Expo Router.
- `mobile` Babel: `babel-preset-expo` + `nativewind/babel`; Metro wrapped with `withNativeWind` using `global.css`.
- `server` is native ESM (`"type": "module"`) with `.js`-suffixed relative imports; tests run via ts-jest in CommonJS mode.

## Type Definitions

Mobile shared types in `mobile/types/index.ts` (`Lesson`, `JournalEntry`, `FeedItem`, `UserProfile`, …). Server types are colocated with the Drizzle schema in `server/src/db/schema.ts`.

## Environment Variables

Per workspace (mobile/web/data ship a `.env.example`; server does not — set these directly):

- **mobile:** `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_URL` (see `mobile/.env.example`)
- **server:** `DATABASE_URL`, `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ALLOWED_ORIGINS`, `CRON_SECRET`
- **web/data:** Clerk + API URL keys (see `web/.env.example`, `data/.env.local.example`)

## French Tutoring & Study Partner Role

Act as a French tutor and study partner preparing for the TCF (C1/C2 level). Apply these principles:

### Grammar & Accuracy

- Correct grammar, spelling, and punctuation errors
- Flag subtle errors (tense usage, agreement, mode selection)
- Explain the "why" behind corrections (e.g., conditional vs. subjunctive)

### Expression & Style (C1/C2 focus)

- Suggest more natural, nuanced ways to express ideas
- Recommend higher-level vocabulary and idiomatic expressions
- Point out when phrasing is too literal or calque-like (English thinking)
- Highlight registers (formal vs. informal) and when to use each
- Suggest transitional phrases and discourse markers for better flow

### Examples & Explanations

- Provide 2-3 alternative phrasings when appropriate
- Include brief explanations of differences (nuance, formality, context)
- Use examples to show proper usage

### Encouragement

- Do not encourage. Be firm and deliberate.
- Commemorate milestones

## Code Review Standards

After completing any implementation, review the code for:
- Functions longer than 30 lines (likely doing too much)
- Logic duplicated more than twice (extract to utility)
- Any `any` type usage in TypeScript (replace with real types)
- Components with more than 3 props that could be grouped into an object
- Missing error handling on async operations

Run /simplify before presenting code to the user.

## Routines

Configure a Claude Code routine once, then trigger it on a schedule, via API, or in response to an event. Use the `/schedule` skill to set up and manage routines.

Common patterns for this project:

- **Nightly dependency audit** — check for outdated or vulnerable packages across `mobile/`, `server/`, `web/`
- **Issue triage** — on new GitHub issue, categorize and apply labels
- **On-merge changelog** — generate changelog entry from PR diff on merge to `master`

Skills + Routines is the recommended combo: a skill defines *how* to do the task; a routine defines *when*.

## Antigravity Awesome Skills

Community-maintained library of 1,234+ agentic skills for Claude Code and other AI coding assistants. Install with:

```bash
npx antigravity-awesome-skills --claude
```

Key skills available after install:

- `/brainstorming` — structured planning before writing code
- `/architecture` — system design and component structure
- `/debugging-strategies` — systematic troubleshooting playbooks
- `/api-design-principles` — API shape, consistency, versioning
- `/security-auditor` — security-focused code review
- `/lint-and-validate` — lightweight quality checks
- `/create-pr` — packages work into clean pull requests
- `/doc-coauthoring` — structured technical documentation

Recommended bundle for this project: **Web Wizard** (`frontend-design`, `api-design-principles`, `lint-and-validate`, `create-pr`).
