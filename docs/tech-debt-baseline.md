# Tech Debt Baseline

Living snapshot. Newest refresh first; older snapshots kept for trend. Future
audits should diff against the latest numbers rather than re-deriving from
scratch. Refresh commands are at the bottom.

---

## 2026-07-16 — "fix all recommendations" pass

Second remediation pass, driven by a full-repo tech-debt audit. Dependencies are
current (Expo 54, React 19, RN 0.81) — no framework-modernization debt. Work done:

**i18n parity (mobile).** The 5 UI-string locales (`lib/locales/*`) had drifted:
en=2688 keys, with 469 missing across fr/pt/pcm/ar and 116 dead keys. Added a
canonical-`en` sync tool (`scripts/i18n-sync.ts`), machine-translated every missing
key (French tutor-grade; fr/pt/pcm/ar flagged for educator review), dropped the dead
keys, and added a permanent Jest guard (`lib/__tests__/locale-parity.test.ts`). All
5 locales now at **exact parity** (0 drift), enforced in CI.

**Tests.** Mobile: `generateLessonQuiz` (653-LOC quiz engine) now covered (79 mobile
tests pass). Web went from **0 → a working `next/jest` runner** (jsdom + `@mobile`
alias transform) with smoke tests. Test files: **7 → 12**.

**God-component decomposition (web).** The three worst offenders split into
per-component files + a shared `useForm` reducer (`web/lib/use-form.ts`), zero
behavior change, all tsc-clean:
- `app/(app)/contribute/page.tsx`: 1402 → **203**
- `app/admin/activities/page.tsx`: 1007 → **135**
- `app/educator/courses/[id]/page.tsx`: 1027 → **320**

**Prevention gates.** The mobile debt gate (`no-explicit-any` + `max-lines:500`,
warn) was extended to **web** (`eslint.config.mjs`, exempting content-heavy
landing/marketing) and stood up from scratch on **server** (`eslint.config.js`,
exempting seed/db CLI scripts). CI (`ci.yml`) now runs `npm test` on web and a
"lint PR-changed files at --max-warnings 0" step on web + server, mirroring mobile —
so new `any`/oversized files are blocked without a big-bang cleanup.

### Metrics (working tree)

| Metric | 2026-06-30 | 2026-07-16 | Note |
|---|---|---|---|
| Files >500 lines (excl. `lib/data/`, `locales/`, `seed/`, `.d.ts`, tests) | 43 | 43 | 3 web god-files removed offset ~3 files of intervening growth; contribute/activities/courses no longer in the list |
| `any` usage | 129 | 99 | none added this pass; web stays at 0 |
| Test files | 7 | 12 | +locale-parity, +web parse-csv, +web status-pill (and content-publish) |

Biggest remaining god-files (next targets): `server/src/db/schema.ts` (1619, mostly
declarative), `web/components/landing/*` (content-heavy, gate-exempt), `mobile/app/review.tsx`
(951), `web/app/educator/{dictionary,culture,courses}` (~820–911 — same decomposition
pattern applies).

**Open architectural item (A1):** the triple-surface authoring duplication
(`web/app/admin` + `web/app/educator` + mobile Studio) is **not** on any roadmap. A
consolidation spec was written this pass — see `docs/studio-consolidation-spec.md` —
but execution is product-gated and deferred.

---

## 2026-06-30 — first baseline

Snapshot taken after the Phase 0–2 remediation pass (commits `761ebc9`
through `84e47cf`). This is the first measured baseline — there's no prior
snapshot to trend against, so future audits should diff against these
numbers rather than re-deriving from scratch.

## Dependency vulnerabilities (`npm audit`)

| Workspace | Critical | High | Moderate | Total | Notes |
|---|---|---|---|---|---|
| server | 0 | 7 | 8 | 15 | High items pinned behind `drizzle-kit`/`@vercel/node` major bumps |
| web | 0 | 0 | 3 | 3 | Remaining: `postcss` nested in `next`, no fix available yet |
| mobile | 0 | 5 | 28 | 33 | High items pinned behind Expo SDK 54→57 and `@clerk/clerk-expo` major bumps |
| data | 0 | 0 | 3 | 3 | Same `next`/`postcss` issue as web |
| partykit | 0 | 1 | 3 | 4 | `undici` via `miniflare`, no non-breaking fix available |

All criticals were resolved via safe, non-breaking `npm audit fix` (see
`761ebc9`). The remaining highs all require major version bumps that were
explicitly deferred — they need their own scoped upgrade + regression pass,
not a drive-by fix. CI (`.github/workflows/ci.yml`) gates server/mobile at
`--audit-level=critical` for this reason; raise to `high` once those bumps
land. Web/data are already clean at `high`.

## Code size

| Metric | Count |
|---|---|
| Files >500 lines (excl. `lib/data/`, `locales/`, `seed/`, generated `.d.ts`) | 43 |
| `any` usage (`: any`, `<any>`, `as any`, `any[]`) | 129 |
| Test files | 7 |

The two largest pre-existing god-files (`server/src/routes/educator.ts` at
1,711 lines and `mobile/lib/hooks/use-educator-panel.ts` at 1,048 lines)
were split in this pass (see `676e987`, `84e47cf`) — neither contributes to
the 43 anymore. The remaining 43 are tracked but not yet addressed; biggest
offenders as of this snapshot:

- `web/app/(app)/contribute/page.tsx` (1,396)
- `web/components/landing/landing-page.tsx` (1,111, content-heavy, not duplicated logic)
- `mobile/app/(tabs)/educator/culture.tsx` (1,073)
- `web/app/educator/dictionary/page.tsx` (1,031)

## Test coverage

7 test files (`mobile/lib/__tests__/{daily-picker,localize,quiz-engine}.test.ts`,
`server/src/middleware/__tests__/auth.test.ts`,
`server/src/routes/__tests__/{billing-webhook,contributions,educator}.test.ts`)
against ~700 source files. Still thin, but the highest-risk paths are now
covered: auth, billing webhooks, the quiz engine, and the contributions
submit path (regression guard for the `LocalizedText` 500 bug, commit
`1f30804`).

## How to refresh this snapshot

```bash
# God files
git ls-files 'mobile/**/*.ts' 'mobile/**/*.tsx' 'web/**/*.ts' 'web/**/*.tsx' 'server/**/*.ts' \
  | grep -vE 'locales/|lib/data/|/seed/|\.d\.ts$|__tests__|\.test\.|\.spec\.' \
  | xargs wc -l | grep -v ' total$' | awk '$1>500' | wc -l

# any usage
git ls-files 'mobile/**/*.ts*' 'web/**/*.ts*' 'server/**/*.ts*' | grep -vE '\.d\.ts$' \
  | xargs grep -ohE ':\s*any\b|<any>|as any|any\[\]' | wc -l

# test files
git ls-files | grep -cE '\.(test|spec)\.(ts|tsx|js)$|__tests__/'

# audit, per workspace
cd <workspace> && npm audit
```
