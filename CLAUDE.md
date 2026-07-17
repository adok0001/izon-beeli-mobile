## Project Overview

Beeli is a React Native/Expo (SDK 54) mobile learning platform with tabs for learning, listening to audio lessons, journaling, community feed, and user profile. It targets iOS, Android, and web.

## Development Commands

```bash
npx expo start --no-dev --minify --clear            # Start Expo dev server
npm run ios                                         # Run on iOS simulator
npm run android                                     # Run on Android emulator
npm run web                                         # Run in browser
npm run lint                                        # ESLint check
```

## Deployment

**Git auto-deploy is DISABLED.** Pushing to `master` does NOT deploy anything. The
only deploy path is the Vercel CLI, run from the package directory:

```bash
cd server && vercel --prod --yes    # deploy the API (project: izon-beeli-server)
vercel --prod --yes                 # deploy the web app FROM THE REPO ROOT
                                    # (project: izon-beeli-web, Root Directory=web —
                                    #  root upload is required for its @mobile/* imports)
```

Each package is a separate linked Vercel project (`.vercel/project.json`). Mobile
ships via Expo/EAS, independently.

### Database migrations (drizzle-kit push caveat)

The server's `vercel-build` runs `db:preflight && db:deploy` (`drizzle-kit push`) in
production, so **additive** schema changes apply automatically on `vercel --prod`.
But `drizzle-kit push` **refuses DESTRUCTIVE changes in CI** (dropping a table/column
needs an interactive TTY to confirm data loss; the build has none, so push errors —
though the deploy still promotes). For any drop:

1. Deploy the code first (`vercel --prod`) so live code no longer reads the target.
2. Then run an **explicit, non-interactive migration script** (raw SQL via `neon()`,
   dry-run/`--apply` pattern — see `server/src/seed/migrate-*.ts`) to apply the drop.
3. Run `npm run db:preflight` to confirm the schema is clean.

Destructive DB steps must be named and authorized explicitly — never fold them into
a plain "deploy" instruction.

## Architecture

### Routing (Expo Router v6 — file-based)

- `app/index.tsx` — Auth guard: redirects to `/(tabs)/learn` if signed in, `/(auth)/sign-in` if not
- `app/(auth)/` — Sign-in and sign-up screens using Clerk
- `app/(tabs)/` — Bottom tab navigation: learn, listen, journal, feed, profile
- `app/lesson/[id].tsx` — Dynamic lesson detail route

### Authentication (Clerk)

- `ClerkProvider` wraps the app in `app/_layout.tsx` with token caching via `expo-secure-store`
- Auth helpers in `lib/auth.ts` — platform-aware (skips secure store on web)
- Requires `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` env var

### Data Fetching (React Query)

- Query client configured in `lib/api.ts` (5min stale time, 2 retries)
- Generic `apiFetch<T>()` helper injects Clerk auth tokens
- API base URL from `EXPO_PUBLIC_API_URL` env var via `lib/constants.ts`

### State Management (Zustand)

- `store/audio-store.ts` — Audio playback state (play, pause, progress, duration)
- Access via `useAudioStore()` hook

### Styling — the "Museum" design system (NativeWind + Tailwind CSS v3)

The mobile app uses a dark-first **"Museum"** system. Navigation chrome (headers,
tab bar) is always dark (the "foyer"); content areas are mode-aware.

- **Tokens:** consume via `useMuseumTheme()` (`lib/use-museum-theme.ts`). Surfaces
  `M.bg / M.card / M.border`, text `M.text / M.sub / M.muted`, foyer `M.parchment /
  M.textDim`, accent `M.accent` (bronze gold `#C4862A`), and semantic state tokens
  `M.success / M.error / M.warning / M.info` (+ `*Bg` / `*Border`).
- **Never hardcode hex** for surfaces/text/state — use tokens so dark mode stays safe.
  Categorical accents come from `getAccent(hue)` (`constants/accent-colors.ts`); course
  and level palettes live in `constants/course-colors.ts`.
- **Typography:** apply the loaded display font via `constants/typography.ts`
  (`fonts.heading` = PlusJakartaSans, `type` scale). `Akagu` is for indigenous scripts.
- **Primitives:** reuse `components/ui/{button,badge,section-header,screen-container}`.
- **Localized text fields:** any translatable text field (title, meaning, description, ...)
  must use `LocalizedTextInput` (`components/ui/localized-text-input.tsx`) — the anchor
  language (English) plus progressive "Add translation" disclosure for fr/pcm/ar/pt.
  Never hardcode a fixed English+French pair of inputs; that anti-pattern doesn't scale
  past two languages and is exactly what this component replaced. Pair it server-side with
  a `<field>`/`<field>Fr` legacy pair + a `<field>Translations` jsonb column (see
  `dictionaryEntries.meaning/meaningFr/translations` or `dailyChallengeTemplates` for the
  pattern) and the `parseMap`/`flatToMap` helpers in `server/src/routes/educator/_shared.ts`.
- **Studio (admin/educator) screens:** every list/editor screen under `app/admin/*` and
  `app/(tabs)/educator/*` composes the shared primitives in `components/studio/`:
  `StudioScreenHeader` (back chevron + title/subtitle + optional action button),
  `StudioSearchInput`, `StudioFilterPills` (chip/tab rows), `ActionPill` + `ActiveTogglePill`
  (`studio-action-pill.tsx` — per-row Edit/Delete/Feature/Activate buttons), `StudioCard`
  (bordered container, optional left accent bar), and the form primitives in
  `studio-form.tsx` (`FormField`, `FormInput`, `LabeledInput`, `PrimaryButton`,
  `GhostButton`). Don't hand-roll a new header row, search box, filter-chip row, or
  list-card style — every screen doing its own thing is how this drifted before.
- Dark mode preference handled by `store/theme-store.ts` + `hooks/use-color-scheme.ts`;
  the React Navigation `ThemeProvider` uses the always-dark Museum chrome theme.
- Tailwind config in `tailwind.config.ts` (exposes `font-heading`), directives in
  `global.css`. `constants/theme.ts` holds the React Navigation color shims.

> Note: the `web/` app is a SEPARATE Next.js app with its own purple "gradient/glow"
> system (`web/tailwind.config.ts`, `web/app/globals.css`) — do not mix the two.

### Platform-Specific Code

- Use `.ios.tsx` and `.web.tsx` file extensions for platform overrides
- `components/ui/icon-symbol.tsx` (Material Icons for Android/Web) vs `icon-symbol.ios.tsx` (SF Symbols)
- Haptic feedback on iOS via `components/haptic-tab.tsx`

## Key Configuration

- **TypeScript strict mode** enabled; path alias `@/*` maps to project root
- **React Compiler** and **New Architecture** both enabled in `app.json`
- **Typed routes** enabled for Expo Router
- Babel: `babel-preset-expo` + `nativewind/babel` plugin
- Metro: wrapped with `withNativeWind` using `global.css`

## Type Definitions

Shared types in `types/index.ts`: `Lesson`, `JournalEntry`, `FeedItem`, `UserProfile`.

## Environment Variables

Required:

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk authentication
- `EXPO_PUBLIC_API_URL` — Backend API base URL

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
