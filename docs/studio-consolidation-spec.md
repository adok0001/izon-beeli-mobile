# Studio Consolidation (Web) — Spec

**Status:** Draft for review · **Date:** 2026-07-16 · **Scope:** web authoring surfaces
(`app/admin/*`, `app/educator/*`) → the `app/(studio)/*` route group · **No code in this pass.**

> This spec exists because a tech-debt audit flagged the single largest architectural
> item (A1): the same content-authoring surfaces are implemented up to **three times** —
> `web/app/admin` (21 pages), `web/app/educator` (17 pages), and the native mobile Studio
> (19 screens under `mobile/app/(tabs)/educator`). The mobile Studio already shipped as
> the native authoring app; the web `app/(studio)/` route group was started (a
> `studio-shell.tsx`) but never populated, so the two parallel web surfaces were never
> retired. This is product-gated work — it changes who sees what — so it needs a spec and
> sign-off before any build. This document maps the merge; it does **not** execute it.

## 1. Goal

Collapse the two parallel web authoring surfaces into **one console** (`app/(studio)`),
with **role-scoped views** rather than duplicated pages. A reviewer (educator) and an
admin should walk into the *same* Studio and see the *same* editors, differing only by
what their role is permitted to do — not by which URL tree they happen to be in.

Non-goal: the mobile Studio. It stays as the native surface; this is about making web
match it (one surface, role-gated), not about merging web into mobile.

## 2. Why this is not a simple "delete one tree"

Per the project's own history (`project_studio_route_divergence`), `admin/*` and
`educator/*` for the shared surfaces (**dictionary, culture, etymology, review**) are
**role-differentiated by scope, not copy-paste duplicates**. An educator's `dictionary`
is scoped to languages they're approved to review; an admin's spans everything and adds
destructive controls. So consolidation means **one editor component, two capability
levels**, not `rm -rf` of either tree. Naively redirecting one to the other would either
strip an admin capability or leak it to educators.

## 3. Surface inventory

### 3.1 Shared surfaces (implemented in admin **and** educator — the true consolidation targets)

| Surface | admin page | educator page | Consolidation |
| --- | --- | --- | --- |
| Dictionary | `admin/dictionary` | `educator/dictionary` | one `(studio)/dictionary`, role-scoped query + admin-only bulk/destructive actions |
| Culture | `admin/culture` | `educator/culture` | one `(studio)/culture`, same pattern |
| Etymology | `admin/etymology` | `educator/etymology` | one `(studio)/etymology` |
| Review queue | `admin/review` | `educator/review` | one `(studio)/review`, scope = admin: all; educator: own languages |
| Quiz | `admin/quiz` | `educator/quiz-bank` | one `(studio)/quiz-bank` (reconcile the two names) |

### 3.2 Educator-owned authoring (educator only; move verbatim into (studio))

`courses`, `courses/[id]`, `courses/[id]/lessons/[lessonId]`, `proverbs`, `sentences`,
`scenarios`, `translations`, `story-arcs`, `pricing`, `billing` (+ `billing/success`).
These have no admin twin — a straight move under `(studio)/`, gated to the educator role.

### 3.3 Admin-only operations (admin only; move verbatim, admin-gated)

`activities`, `app-config`, `applications`, `bounties`, `content-partners`,
`daily-content`, `discover-stories`, `english-wordbank`, `feedback`, `languages`,
`media`, `notifications`, `organizations`, `streak-tools`, `users`. Platform operations,
not content authoring — they land in an **admin-only section of Studio**, not merged with
educator views.

### 3.4 Overlap with mobile Studio (already the native surface — informs parity, not merged here)

`dictionary`, `culture`, `etymology`, `quiz-bank`, `courses/lessons`, `proverbs`,
`sentences`, `scenarios`, `translations`, `stories`, `applications`. Web (studio) should
reach **feature parity** with these, but mobile is not touched by this migration.

## 4. Target architecture

```
app/(studio)/
  _components/studio-shell.tsx        # exists (stub) — becomes the single chrome
  layout.tsx                          # role gate: reads role, sets capability context
  page.tsx                            # Studio home (Learn / Explore / Tools, like mobile)
  dictionary/ culture/ etymology/     # shared editors, capability-aware
  review/ quiz-bank/
  courses/ …                          # educator authoring (role: educator|admin)
  admin/                              # admin-only ops sub-section (role: admin)
    users/ languages/ media/ …
```

- **One role gate** in `(studio)/layout.tsx` resolves the viewer's role once and exposes
  a `capability` context (`canDeleteAny`, `languageScope`, `canManageUsers`, …). Editors
  read capabilities instead of living in a role-named URL tree.
- **Shared editor components** already largely exist in `web/components/studio/*`
  (`content-health-panel`, `import-panel`, `dictionary-preview-card`, `lesson-preview-card`,
  `device-preview`). Extend these; do not fork per role.
- `admin-shell.tsx` and `sidebar.tsx` (the two current chromes) collapse into
  `studio-shell.tsx` with a role-filtered nav.

## 5. Migration phases (each ships independently, behind the existing route trees)

- **P0 — scaffold.** Build `(studio)/layout.tsx` role gate + capability context + the nav
  in `studio-shell`. No editors yet. Old trees untouched. *Value: the shell exists.*
- **P1 — educator-owned move.** Move §3.2 pages under `(studio)/`, educator-gated. Add
  redirects `educator/* → (studio)/*`. Retire `app/educator/*`. *Value: educator tree gone.*
- **P2 — admin-only move.** Move §3.3 pages under `(studio)/admin/*`, admin-gated. Redirect
  `admin/<op> → (studio)/admin/<op>`. *Value: admin ops relocated.*
- **P3 — shared surfaces (the hard part).** Merge each §3.1 pair into one capability-aware
  editor. Do these **one surface per PR** (dictionary, then culture, …) so each merge is
  reviewable in isolation. Redirect both old routes to the unified one. *Value: triplication
  retired on web.*
- **P4 — cleanup.** Delete `admin-shell.tsx`/`sidebar.tsx` duplication, dead i18n keys,
  and the old route trees once redirects have soaked.

## 6. Risks

- **Capability leakage** (P3): the whole point is role-scoping in one component. A missed
  guard could expose an admin-only destructive action to an educator. Every §3.1 merge PR
  must include an explicit capability-matrix test.
- **Deep links / bookmarks**: staff have `admin/*` and `educator/*` URLs bookmarked and
  wired into flows (e.g. `contribute?flow=reviewer` redirects here). Every retired route
  needs a redirect, not a 404.
- **Middleware/auth coupling** (`web/middleware.ts`): route-based auth today keys off the
  `admin/` and `educator/` path prefixes. The role gate must move into `(studio)/layout`
  without opening a window where `(studio)` is unauthenticated.
- **Scope creep vs. mobile**: resist re-porting mobile editors here; parity, not merge.

## 7. Open decisions (need product sign-off before P0)

1. **Single Studio for both roles, or admin sub-section?** This spec assumes one Studio
   with an admin-gated `admin/` sub-section (recommended). Alternative: keep a visibly
   separate admin area. Decide before building the nav.
2. **`quiz` vs `quiz-bank` naming** — pick one canonical route.
3. **Redirect lifespan** — how long to keep `admin/*`+`educator/*` redirects before
   deleting (affects P4 timing).
4. **Does this belong on a roadmap?** A1 is currently on **no** roadmap (`roadmap-2027.md`
   is product/content only). If approved, it should get a milestone before P0.
```
