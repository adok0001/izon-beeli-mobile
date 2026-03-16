# Beeli — Web App

A Next.js 15 web companion to the Beeli mobile learning platform. Learn African languages through audio-first lessons, interactive quizzes, journaling, and community.

---

## Features

### Audio-First Learning
- **Lesson player** — HTML5 audio with progress bar, skip ±15 s, variable speed (0.5×–2×), and segment-synced transcript highlighting
- **Interactive transcript** — click any word for an inline dictionary popup with definition, pronunciation, and example
- **Persistent audio bar** — continues playing across page navigation
- **Course browser** — filter by language and level, with per-course progress bars

### Gamified Learning
- **Quiz engine** — 4 question types (word→English, English→word, fill-in-the-blank, listening); 5-heart lives; keyboard shortcuts 1–4 / Enter
- **Progress Dashboard** — weekly activity bar chart, 30-day streak calendar, XP level bar, today's daily challenges
- **Leaderboard** — top 50 with podium display; highlights current user's rank
- **Daily challenges** — server-generated per-user challenges (complete quiz, listen lesson, review words, etc.)

### Community & Social
- **Feed** — activity stream with type filters (lesson completed, achievement, contribution, community); likes and comments
- **Contributions** — users submit words/phrases; admins review from the admin panel

### Personal Tools
- **Journal** — full CRUD for learning notes; entries linked to lessons
- **Dictionary** — searchable vocabulary with category filter
- **Settings** — learning language (8 languages), UI language (English/French), theme (light/dark/system)
- **Profile** — stats (streak, points, lessons), menu links, tour reset, sign-out

### Welcome Tour
- Spotlight-based walkthrough on first visit; restartable from Profile

### Internationalization
- Full English / French UI via shared i18n with the mobile app

---

## Admin Panel (`/admin`)

Access requires `isAdmin: true` on the user record.

| Route | Description |
|---|---|
| `/admin` | Overview stats (users, courses, lessons, contributions, quiz count, etc.) |
| `/admin/users` | User table — promote / demote admins |
| `/admin/courses` | Full course CRUD — create/edit/delete courses and their lessons inline |
| `/admin/review` | Contribution review queue — approve or reject submitted words/phrases with optional reviewer notes |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 + dark mode |
| Auth | Clerk (`@clerk/nextjs`) |
| Data fetching | TanStack Query v5 |
| State | Zustand v5 |
| i18n | react-i18next (shared locale with mobile) |
| Icons | lucide-react |
| Deployment | Vercel |

---

## Backend API

Shared Hono/Node server with Drizzle ORM + PostgreSQL. Key endpoints used by the web app:

```
GET  /api/courses?languageId=          Browse courses
GET  /api/courses/:id                  Course detail + lessons
GET  /api/lessons/:id                  Lesson with transcript segments
POST /api/progress/complete            Mark lesson complete, award XP
GET  /api/progress/summary             Streak, points, level, XP
GET  /api/dashboard/weekly-stats       7-day activity breakdown
GET  /api/dashboard/streak-calendar    Active days for the last 30 days
GET  /api/daily-challenges/today       Today's challenges
GET  /api/quiz/questions?languageId=   Fetch quiz questions
POST /api/quiz/submit                  Submit answers, earn XP
GET  /api/feed?type=                   Activity feed with optional type filter
GET  /api/journal                      User journal entries
GET  /api/dictionary?languageId=       Vocabulary entries
GET  /api/users/leaderboard            Top 50 + current user rank
GET  /api/admin/stats                  Admin overview statistics
GET  /api/admin/courses                List all courses
POST /api/admin/courses                Create course
PATCH /api/admin/courses/:id           Update course
DELETE /api/admin/courses/:id          Delete course
GET  /api/admin/lessons?courseId=      List lessons for a course
POST /api/admin/lessons                Create lesson
PATCH /api/admin/lessons/:id           Update lesson
DELETE /api/admin/lessons/:id          Delete lesson
GET  /api/admin/contributions/pending  Pending contribution queue
PATCH /api/contributions/:id/review    Approve or reject a contribution
```

---

## Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=   # Clerk auth
CLERK_SECRET_KEY=                    # Clerk server secret
NEXT_PUBLIC_API_URL=                 # Backend base URL (e.g. http://localhost:3001)
```

---

## Development

```bash
cd web
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

Requires the backend server to be running (see `/server`).

---

## Design System

- **Brand purple** (`brand-500` = `#8b5cf6`) — primary CTAs, active states, progress bars
- **Dark mode** — `dark:` classes throughout; respects system preference, persisted to localStorage
- **Glassmorphism cards** — white/`neutral-900` backgrounds with subtle borders
- **Animations** — pulse skeletons on loading, smooth bar transitions, waveform highlight
- **Cultural palette** — Savanna Gold, Sunset Orange, Ancestral Purple accents
