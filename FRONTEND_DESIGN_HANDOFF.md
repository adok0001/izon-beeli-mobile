# Frontend-Design Consistency Refactor — Handoff

**Branch:** `claude/frontend-design-checkup-wwLc0` (pushed, working tree clean)
**Last commit:** `63245f6` — fix(mobile): repair JSX attribute braces and hooks order from token sweep

---

## TL;DR for a fresh session

Mobile color tokenization is **done and lint-verified**: zero hardcoded state/accent
hex remain across `mobile/app` + `mobile/components`. What's left is **Phase 4 (web
de-bleed)**, **Phase 5 (ESLint guardrail)**, **primitive adoption**, and **running the
jest suite**. Pick up from "Remaining work" below.

---

## The design systems (do not mix)

- **Mobile** (`mobile/`, RN + Expo + NativeWind): dark-first **"Museum"** theme.
  - Tokens via `useMuseumTheme()` (`mobile/lib/use-museum-theme.ts`): surfaces
    `M.bg/M.card/M.border`, text `M.text/M.sub/M.muted`, foyer `M.parchment/M.textDim`,
    accent `M.accent` (bronze `#C4862A`), state `M.success/error/warning/info`
    (+ `*Bg`/`*Border`), `M.ink` (dark text on colored bg).
  - Categorical accents: `getAccent(hue)` (`mobile/constants/accent-colors.ts`) →
    `{ solid, bg: rgba(...,0.12), border: rgba(...,0.30) }`. **Valid hues only:**
    rose, purple, blue, teal, indigo, orange, green, amber, sky, pink, fuchsia
    (NO "violet"). Script-mode convention: geez=teal, nsibidi=amber, adinkra=purple.
  - Typography: `mobile/constants/typography.ts` (`fonts.heading` = PlusJakartaSans).
  - Primitives: `mobile/components/ui/{button,badge,section-header,screen-container}.tsx`.
- **Web** (`web/`, Next.js App Router): SEPARATE purple "gradient/glow" system
  (`web/tailwind.config.ts`, `web/app/globals.css`) — `brand-*` + `gold-*`, glass
  surfaces, glow shadows. Never import Museum hex into web.

## Hard-won gotchas (READ before sweeping more files)

1. **NEVER `replace_all "#hex" → M.token` blindly.** JSX attributes need braces:
   `color="#9ca3af"` must become `color={M.muted}`, NOT `color=M.muted`. Inside
   `style={{ }}` objects, `color: "#hex"` → `color: M.token` is correct (no braces).
   A blind replace_all broke 71 attributes across 14 files last session — already fixed,
   but don't repeat it. After any sweep, grep `color=M\.` / `=getAccent` for unbraced.
2. **Hooks rule:** `const M = useMuseumTheme()` must be at the TOP of a component, never
   inside `.map()`/callbacks or after an early `return`. Helper functions that aren't
   components can't call it — pass `M` as a param (e.g. `getTileColors(tile, M)`) or
   convert a module-level color record to a hook (e.g. `useStatusConfig()`).
3. **`cd` persists between Bash calls.** A stray `cd mobile` makes relative-path greps
   silently search nothing. Use ABSOLUTE paths for verification greps, or `cd` back.
4. **Subagents in worktrees:** background agents work in `.claude/worktrees/agent-*`;
   their edits do NOT land in the main tree. You must `cp` changed files back, then
   commit. They also report "already done" off stale worktree reads — always re-verify
   in the main tree with grep before trusting completion. (Worktrees are now pruned.)

## Verification commands (run from repo root, absolute paths)

```bash
# Must return ZERO:
grep -rlE "#22c55e|#ef4444|#4ade80|#9ca3af|#d1d5db|#10b981|#3b82f6|#f59e0b|#a855f7|#6b7280" \
  /home/user/izon-beeli-mobile/mobile/app /home/user/izon-beeli-mobile/mobile/components \
  --include="*.tsx" --include="*.ts"

cd /home/user/izon-beeli-mobile/mobile && npx eslint .   # see "known pre-existing errors"
```

## Known PRE-EXISTING lint errors (NOT introduced by this work — leave or fix separately)

- `no-var` ×9, `no-undef` ×3 — `lib/analytics.ts`, `lib/push-notifications.ts`,
  `lib/hooks/use-daily-reminder.ts`, `modules/beeli-widget/plugin/index.js`
- `react/no-unescaped-entities` ×5 — JSX text quotes (`lessons.tsx:207`, `listen.tsx:90`,
  `profile.tsx:227`, `assign.tsx:96`)
- `no-dupe-keys` ×1 — duplicate `'trophy.fill'` in `components/ui/icon-symbol.tsx:53,66`

---

## Plan status

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Doc hygiene (brand-guardian.md, CLAUDE.md, agent files) | ✅ Done |
| 1 | Mobile token foundation (semantic tokens, accent-colors, typography) | ✅ Done |
| 2 | Mobile primitives (button/badge/section-header/screen-container) | ✅ Files exist |
| 3 | Mobile hardcoded-hex sweep | ✅ Done, lint-verified, 0 remaining |
| 4 | **Web consistency / de-bleed** | ❌ Not started (deferred: no web build env) |
| 5 | **ESLint guardrail vs raw hex in `style={{}}`** | ❌ Not started (optional) |
| — | **Primitive ADOPTION** (swap inlined buttons/badges → ui primitives) | ❌ Not done |
| — | **`npm test` (jest)** | ❌ Not run |

---

## Remaining work (concrete next steps)

### Phase 4 — Web de-bleed (needs a running web build to verify: `cd web && npm run dev -p 3001`)
1. `web/app/(app)/culture/culture-client.tsx` (~lines 143-145, 271-287): replace MOBILE
   Museum hex (`#0D0F1A`, `#F7F2E8`, `#9A9480`) with `brand-*`/`gold-*` + `dark:`.
2. `web/app/(app)/explore/page.tsx:42-67`: replace per-card hardcoded hex map
   (`#C4862A`/`#a78bfa`/`#38bdf8`…) with `brand-*`/`gold-*` tokens or a typed helper.
3. Adopt existing utilities: `.surface`/`.glass`/`.btn-primary`/`.btn-ghost` (currently
   ~0 usages) where cards/buttons re-implement them. Route hardcoded dark shells
   (`bg-[#07070f]`, `bg-[#06060e]` in `admin/_components/admin-shell.tsx`,
   `(auth)/layout.tsx`, `error.tsx`, `not-found.tsx`) through one token.
4. Verify `font-display` (Cormorant Garamond) applied to headings app-wide.
5. Either use the unused shadow tokens (`card-hover`/`float`/`lift`) or prune them.
6. Confirm shared accent gold: mobile `#C4862A` ↔ web `gold-*` are one agreed value.
   Full hue unification is OUT of scope — only remove accidental bleed.

### Phase 5 — Guardrail
- Add an ESLint rule / lightweight check flagging raw hex in `style={{}}` and JSX
  `color="#..."` to prevent regression on mobile.

### Primitive adoption (Phase 2 follow-through)
- Sweep screens to replace inlined buttons/badges/section-headers with
  `components/ui/{button,badge,section-header}`. Representative targets: `quiz.tsx`,
  `matching-game.tsx`, `lesson/[id].tsx`, `(tabs)/profile.tsx`, `settings.tsx`.

### Tests
- `cd mobile && npm test` (jest) — not yet run this effort.

---

## Git ops reminder
- Develop on `claude/frontend-design-checkup-wwLc0`. Push with
  `git push -u origin claude/frontend-design-checkup-wwLc0`. Do NOT open a PR unless asked.
- This handoff file (`FRONTEND_DESIGN_HANDOFF.md`) is scratch — delete or .gitignore it
  before any PR; don't ship it.
