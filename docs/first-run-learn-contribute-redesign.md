# Redesign Spec — First-Run, Learn Tab & Contribute

**Status:** Design locked, ready to build · **Date:** 2026-07-17 · **Scope:** Beeli mobile (`mobile/`)

This spec collapses three overlapping "get started" systems into one coherent first-run
flow, removes duplicate surfaces on the Learn tab, and clarifies the Contribute screen.
No code has been changed yet.

---

## 0. The problem it solves

A brand-new user today walks through **~14 screens plus a persistent overlay** before
meaningfully using the app:

1. **Onboarding** — 4 blocking full-screens: language → quiz → daily goal → "ready"
   (`app/(onboarding)/index.tsx`)
2. **Welcome Tour** — auto-launches next: **10 modal screens** (a "Welcome to Beeli"
   foyer + 9 icon/text cards) (`components/feature-tour-modal.tsx`)
3. **Welcome Checklist FAB** — then a persistent, pulsing bottom-right pill nagging 11
   activation tasks (`components/welcome-checklist-fab.tsx`)

These three re-teach the same material three times. The fix is to give each a single,
distinct job:

| System | New job |
|---|---|
| **Onboarding** | Set up + orient + opt-in — the single first-run flow |
| **Tour** | Retired as auto-launch; its teaching moves *inside* onboarding. Stays re-triggerable from Profile |
| **Checklist** | Activation only, de-stickied — a "Getting started" card on Learn, not a floating overlay |

### Locked decisions

- **Onboarding + Tour: merged** into one first-run flow.
- **First-run navigation: edge Prev/Next buttons** (horizontal pager), not a bottom Continue CTA.
- **Learn Carousel: stays a carousel, curated to featured courses** (not one single card, not the full catalog); Explore All becomes the sole full catalog.
- **Checklist: a "Getting started" card on the Learn home**, auto-hiding when complete.
- **Contribute word count: floored to the nearest ten.**

---

## Plan 1 — First-run flow (onboarding + tour, merged)

One blocking flow, shown once, replacing the current 4 onboarding steps **and** the
auto-launched welcome tour.

### Sequence

| # | Screen | Notes |
|---|---|---|
| 1 | **Language** | Keep current `LanguagePicker` over active languages. Keep the secondary "Apply as contributor" link. |
| 2 | **Choose your level** | **Replaces the quiz.** Three tiers: *New to it · Know a few words · Fairly comfortable.* Persist **locally and to backend** (today's `dailyGoal` is best-effort backend-only; level must survive device changes). |
| 3–5 | **"Here's Beeli" — 3 real-screenshot cards** | The tour, absorbed. Promotional copy per card. Suggested trio: **Learn** (structured lessons + streaks), **Practice/Games** (quizzes, matching, multiplayer), **Community + Contribute** (feed + preserving the language). Use real app screenshots, not icon halos. |
| 6 | **Turn on reminders** | Framed opt-in with a value prop ("Keep your streak alive"), *then* fire the OS prompt. Replaces the silent, unframed prompt currently fired at sign-in (`app/_layout.tsx:164`). This is the final screen. |

### Navigation model — edge Prev/Next

- **Right edge = Next / advance. Left edge = Previous.** Replaces the bottom-width
  "Continue" pill.
- **Step 1:** left (Previous) button hidden.
- **Final step (Reminders):** right button becomes **Finish / "Let's go"** — label swap,
  same position.
- **Selection steps (Language, Level):** the Next button is **disabled/hidden until a
  choice is made** — can't advance past "choose your level" without picking one.
- **Skip:** stays **top-right** only. Remove the redundant centered "Skip Tour" text link
  that exists today (`feature-tour-modal.tsx:285-293`).
- **Progress bar** stays at the top as a position reference for the edge arrows.
- Optionally pair with **swipe** gestures on the teaching cards (steps 3–5), edge buttons
  as the explicit affordance.
- The old "remove arrow from Continue" ask is now moot — there is no Continue button; the
  edge chevrons are the navigation.

### Retirements & cleanups

- Retire the auto-launch of `showTour("welcome")` (at onboarding finish and in
  `app/(tabs)/_layout.tsx:104-114`).
- Keep the tour engine only as a **re-triggerable "How Beeli works"** from Profile —
  repurpose the existing "Restart Welcome Tour" row (`app/(tabs)/profile.tsx:521`).
- Delete the dead second tour implementation `components/tour/tour-overlay.tsx`
  (imported nowhere).
- Trim the welcome registry from 9 feature scenes to the 3 shipped in onboarding
  (`lib/tours/mobile-tour-registry.ts`).
- Move onboarding-complete from device-local AsyncStorage (`ONBOARDING_KEY`,
  `lib/constants.ts:4`) to a **per-user backend flag** so users don't re-onboard on
  every device.
- Rewrite the generic welcome copy `welcomeModalSubtitle` ("Quickly discover everything
  you can do in the app") into real positioning (`lib/locales/en.ts:383`).

### Open build-time detail

- **Edge button style:** chevron-only (`‹ ›`) vs labeled pills ("Back"/"Next").
  Recommendation: chevron-only, with a label appearing only on the final **Finish**
  button. Left as an A/B-able choice.

---

## Plan 2 — Learn Carousel → featured courses

The Carousel and "Explore All Courses" are **confirmed redundant**: both receive the same
`courses` array and link to the same route — two renderings of one list stacked directly
on top of each other (`app/(tabs)/learn/index.tsx:210,218`).

- **Carousel stays a carousel**, but its source list narrows from "all courses" to a
  **curated featured set** — e.g. the user's active in-progress course(s) plus a small
  number of recommended/spotlighted courses, not the full catalog. Keep the existing
  Continue CTA + progress-bar treatment (`components/learn/course-carousel.tsx`).
- **Explore All Courses stays the sole full catalog browser** — the complete course list
  lives here only (`components/learn/explore-all-row.tsx`).
- **"Featured" driver:** wire to the **level** chosen in Plan 1 step 2 (fall back to the
  flagship Izon 10-Movement spine for a brand-new user); active/in-progress courses take
  priority ordering within the carousel.

---

## Plan 3 — Learn content sections, unified

"Today's Gallery," "Daily Read," and "From the Library" are laid out **three different
ways** today (header placement none / in-card eyebrow / external eyebrow; Daily Read alone
drops the accent stripe, uses a 52px icon vs 44px, and `marginHorizontal` vs a padding
wrapper).

Collapse them onto **one shared card component**:

- External `Eyebrow` header on all three.
- Consistent left-accent stripe.
- 44px icon tile, `padding:14`, uniform chevron size.
- Uniform `paddingHorizontal:20` wrapper.

Files: `components/learn/todays-gallery-card.tsx`, `daily-read-card.tsx`,
`library-teaser.tsx`; shared primitives in `components/ui/section-header.tsx`.

---

## Plan 4 — Welcome Checklist → Learn home card

- Pull `WelcomeChecklistFab` out of the absolute-positioned floating layer
  (`app/(tabs)/_layout.tsx:188`).
- Render as a **"Getting started" card near the top of the Learn tab**, auto-hiding when
  `pendingCount === 0`.
- Keep the completion-reconciliation and bonus logic
  (`components/welcome-checklist-fab.tsx`, `store/welcome-checklist-store.ts`); drop the
  12s pulse and the persistent overlay behavior.
- Frees the bottom-right slot for the global speed-dial FAB alone
  (`components/global-speed-dial-fab.tsx`).

---

## Plan 5 — Contribute

- **Add an explainer block** above the 5 action cards: what contributing is, the review
  flow, XP, and the "preserve the language" why. Today it jumps from a one-line subtitle
  straight into actions (`app/contribute.tsx:283-326`).
- **Banner:** copy already matches the target
  (`{{contributors}} contributors · {{words}}+ words — be part of it`,
  `lib/locales/en.ts:1410`). Two changes:
  - **Floor the word count to the nearest ten:** `Math.floor(totalApproved / 10) * 10`,
    keep `.toLocaleString()` and the `+` (`app/contribute.tsx:133`). The `+` means "at
    least N," so flooring keeps it truthful (`1,247` → `1,240+`); round-to-nearest would
    overstate.
  - **Below 10 words** (brand-new language): don't show `0+ words` — show the exact number
    or a "be the first" zero-state. Also render the banner even when contributor count is
    0 (currently hidden, `app/contribute.tsx:290`).
- **Buttons — clearly different colours:**
  - Landing cards: *Word or Phrase* and *Active Bounties* are both bronze today (the
    clash). Give each of the 5 actions a distinct hue (`app/contribute.tsx:302-307`).
  - Wizard footer: **Submit** (commit) must read differently from **Next** (progress) —
    identical bronze today (`app/contribute.tsx:575-627`).
  - Localize the hardcoded "Become a Reviewer" card label/description
    (`app/contribute.tsx:307`).

---

## Grouping by independence

Two kinds of coupling matter: **logical dependency** (one plan needs another's output)
and **file contention** (plans that edit the same surface and will merge-conflict even
when logically independent).

- **Logical dependencies:** only one, and it's soft — **Plan 2 → Plan 1**: the carousel's
  "featured courses" driver wants the *level* signal from first-run.
  Plan 2 can ship its structure with the flagship-Izon fallback and wire level in later,
  so it does not block.
- **File contention:** Plans 2, 3, and 4 all edit the Learn tab
  (`app/(tabs)/learn/index.tsx`, `app/(tabs)/_layout.tsx`). Logically independent, but
  parallel work collides.

### Three parallelizable workstreams

| Workstream | Plans | Depends on | Start now? |
|---|---|---|---|
| **WS1 — First-run** | Plan 1 | nothing | ✅ Yes |
| **WS2 — Contribute** | Plan 5 | nothing (isolated to `contribute.tsx` + `en.ts`) | ✅ Yes, fully parallel |
| **WS3 — Learn tab** | Plans 2, 3, 4 | Plan 2 softly wants Plan 1's level (fallback available) | ✅ Yes, but sequence *internally* — shared files |

WS1, WS2, and WS3 can run concurrently across three owners. Inside WS3, do the three
plans in series (or under one owner) to avoid Learn-tab merge conflicts; Plan 2's level
wiring is the only thread that lands after WS1 completes.

## File reference index

| Area | Key files |
|---|---|
| First-run | `app/(onboarding)/index.tsx`, `app/(tabs)/_layout.tsx`, `components/feature-tour-modal.tsx`, `lib/tours/mobile-tour-registry.ts`, `store/tour-store.ts`, `lib/constants.ts`, `lib/push-notifications.ts`, `app/(tabs)/profile.tsx` |
| Learn tab | `app/(tabs)/learn/index.tsx`, `components/learn/course-carousel.tsx`, `explore-all-row.tsx`, `todays-gallery-card.tsx`, `daily-read-card.tsx`, `library-teaser.tsx`, `components/ui/section-header.tsx` |
| Checklist | `components/welcome-checklist-fab.tsx`, `store/welcome-checklist-store.ts`, `lib/tours/mobile-checklist-registry.ts`, `components/global-speed-dial-fab.tsx` |
| Contribute | `app/contribute.tsx`, `lib/locales/en.ts`, `lib/hooks/use-contributors.ts`, `components/ui/button.tsx` |
| Dead code to remove | `components/tour/tour-overlay.tsx` |
