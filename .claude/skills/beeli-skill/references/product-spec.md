# Beeli — Product & Platform Specification

How Beeli is built and laid out across mobile and web. Source: `CLAUDE.md`,
`README.md`, `web/README.md`, and `docs/marketing-strategy.md` §7, §11.

---

## Platforms & Stack

| Surface | Stack |
|---|---|
| Mobile | React Native / Expo (SDK 54), Expo Router v6 (file-based, typed routes), New Architecture + React Compiler on |
| Web | Next.js 15 (App Router), TypeScript strict |
| Auth | Clerk (token cache via `expo-secure-store` on native) |
| Data | TanStack Query v5 (`apiFetch<T>()`, 5-min stale, 2 retries) |
| State | Zustand (`store/audio-store.ts` — playback state) |
| Styling | NativeWind + Tailwind CSS v3; dark mode via React Navigation `ThemeProvider` |
| Realtime | PartyKit (multiplayer quiz battles) |
| Analytics | PostHog via `mobile/lib/analytics.ts` |

Current app version: **1.42.0**. Path alias `@/*` → project root. Platform
overrides via `.ios.tsx` / `.web.tsx`.

---

## Mobile Surface Map

Bottom-tab navigation (`app/(tabs)/`): **learn · listen · journal · feed · profile**.

- `app/index.tsx` — auth guard → `/(tabs)/learn` if signed in, else `/(auth)/sign-in`
- `app/(auth)/` — Clerk sign-in / sign-up
- `app/lesson/[id].tsx` — dynamic lesson detail
- Persistent audio bar across navigation (the audio-first signature)

---

## The Audio-First Architecture (the core differentiator)

African languages are oral traditions first. The lesson player is built
accordingly — never compromise this for a text-first shortcut:

- Segment-synced transcripts that highlight as audio plays
- Tap any word mid-playback for an inline dictionary popup (definition,
  pronunciation, example)
- Variable speed 0.5×–2×, ±15-second skip
- Persistent audio bar that keeps playing across screens
- Resume state on app open (audio store persistence)

Contrast: Duolingo's tap-the-translation model was designed for European
languages with Latin scripts. Beeli is designed for tonal, oral languages where
hearing *is* understanding.

---

## Gamification System (the retention engine — all free)

- **Quiz engine** — 4 question types (word→English, English→word, fill-in-blank,
  listening); 5-heart lives; keyboard shortcuts 1–4 / Enter on web
- **Daily challenges** — server-generated, 3/day (complete quiz, listen, review)
- **Streaks** — streak + freeze mechanic; 30-day streak calendar on dashboard
- **XP & levels** — visible advancement; level-up events should prompt share cards
- **Level titles** — Newcomer → Listener → Scholar → Elder → Guardian → Legend
  (identity attachment: "I am a Guardian of Igbo" is a statement of self)
- **Leaderboard** — top 50, podium, highlights current user
- **Multiplayer quiz battles** — real-time, via PartyKit; scheduled social events
- **Word review** — spaced repetition

Review-prompt triggers (native in-app review): Level 3 "Listener" achievement and
the 7-day streak milestone — the highest-quality positive moments.

---

## Community & Contributor Flywheel

- **Feed** — activity stream (lesson completed, achievement, contribution,
  community), likes + comments
- **Contributions / bounties** — native speakers submit words/phrases/audio for
  XP; admins review (`/admin/review`). This is the content-cost moat — see
  `business-model.md`.
- **My Contributions tab** — authorship investment; contributors return to see
  their content in use
- **Share cards** — `mobile/components/share/` `ShareModal` — every level-up,
  streak milestone, and achievement generates a shareable visual card (zero-cost
  UGC). Prompt sharing at these moments.

---

## Educator Portal (the institutional revenue surface — already built)

`/admin` (requires `isAdmin`) plus the educator/classroom flow:

- Classroom creation + group management
- Bulk student enrollment via invite code
- Assignment creation + lesson assignment to groups
- Student progress tracking and completion reports
- Educator content panel — course / lesson CRUD (`/admin/courses`)
- Contribution review queue (`/admin/review`)

This is the B2B2C funnel: the teacher assigns Beeli, students arrive. The tier
needs positioning + a landing page + billing — not new product work.

---

## Personal Tools

- **Journal** — full CRUD learning notes, linkable to lessons
- **Dictionary** — searchable vocabulary, category filter
- **Settings** — learning language, UI language (English / French), theme
- **Profile** — stats (streak, points, lessons), welcome tour reset, sign-out

---

## Internationalization

Full English / French UI via shared i18n between mobile and web
(`locales/en.ts`, etc.). Copy keys live there — push notification and
re-engagement copy (`streakReminder`, `streakReminderDetail`) included.

---

## ASO / Store Spec (summary — full version in marketing-strategy §11)

- **App name:** "Beeli — African Language Learning"
- **Subtitle:** "Learn Yoruba, Swahili, Igbo & 70+ African languages"
- **Keywords (iOS, ≤100 chars):** `Yoruba,Igbo,Swahili,Hausa,Amharic,African language,learn Yoruba,Zulu,Twi,Izon`
- **Screenshots (6):** lesson player (audio + transcript sync) → language picker
  (regional breadth) → dashboard (streak/XP) → multiplayer battle → cultural
  module (Adinkra/Ge'ez) → community feed
- **Free callout:** "100% free. No paywalls on language learning."

---

## UX Principles (apply to every screen)

1. **Audio-first, always** — never ship a text-only learning path
2. **Name the language** — "your Yoruba," not "a language"; personalize onboarding
3. **First win within 3 minutes** — the 4-step onboarding (language → "Try It"
   challenge → daily goal → ready) is the most critical retention lever
4. **Dark mode is first-class** — test every screen in both themes
5. **Mobile-first, web-capable** — most diaspora discovery is mobile (TikTok/IG)
6. **Free features never gated** — monetization rides on top (see business-model)
7. **Prompt sharing at emotional peaks** — level-up, streak milestone, achievement
8. **The web root must become a public landing page** — currently redirects to
   `/learn`; SEO + acquisition needs a real landing surface first
