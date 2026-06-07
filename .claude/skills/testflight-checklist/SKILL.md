---
name: testflight-checklist
description: Use when the user says "what to test", "TestFlight checklist", "QA checklist", "what should testers check", "write test notes for this build", or "what changed for testers". Produces a structured QA checklist from the git range covering happy path, edge cases, and regression watchpoints for internal TestFlight builds.
version: 0.1.0
---

# TestFlight QA Checklist

Produces a structured test checklist for internal TestFlight builds. Intended for higher-cadence use than the App Store changelog — run it for every TestFlight submission.

## Inputs

Accept optional arguments in the form `from-version to-version` (e.g. `/testflight-checklist 1.33.0 1.34.0`).

- If both versions are supplied, use them as the git range.
- If only one is supplied, treat it as `to-version` and auto-detect `from-version`.
- If neither is supplied, auto-detect both from git log and `mobile/app.json`.

## Workflow

### Step 1 — Resolve the version range

```bash
# Current version
cat mobile/app.json | grep '"version"'

# Find the previous version bump commit
git log --oneline --grep="bump\|version" -i | head -10

# All commits in range
git log --oneline <from-commit>..<to-commit>
```

### Step 2 — Classify commits

Read the full commit log. For each commit determine:

| Prefix | Action |
|---|---|
| `feat:` | Include — generates happy path + edge cases |
| `fix:` | Include — generates a regression check |
| `polish:` / `move:` | Include if layout or interaction changed |
| `refactor:` | Include only if it touched user-visible behaviour |
| `chore:` / `docs:` | Exclude |
| `Merge pull request` | Skip — underlying commits carry the signal |

For each included commit, identify:
- **What changed** — the user-visible surface (screen name, component, interaction)
- **Risk area** — what nearby code could have regressed (e.g. a journal change risks the entry list and audio playback)

### Step 3 — Build the checklist

Group checks under the changed feature. For each feature, produce:

1. **Happy path** — the primary use case working end-to-end
2. **Edge cases** — at least one; more for complex features (empty state, long input, offline, permissions denied)
3. **Regression watchpoints** — adjacent screens or flows that share code with the change

Format as a plain markdown checklist (`- [ ]`). Use screen names as headers. Be specific — "tap the loop button on the third segment" beats "test the transcript".

### Step 4 — Add a Platform & Device matrix

At the bottom, list which platforms/devices the tester should cover based on what changed:

- **iOS only** — if changes touch `*.ios.tsx`, widgets, SF Symbols, or `expo-av`
- **Android only** — if changes touch `*.android.tsx` or Material Icons
- **Both iOS + Android** — if changes are in shared components
- **Web** — if changes touch `app/(web)/` or web-specific files

Flag any check that is iOS 17+ only with `[iOS 17+]`.

### Step 5 — Present the checklist

Output a single markdown document with:
- A one-line build summary at the top (version range, date, number of user-facing changes)
- One section per changed feature
- The platform/device matrix at the bottom

After the checklist, list any items that need the user to confirm availability before sending to testers, marked `[CONFIRM BEFORE SENDING]`.

## Key conventions

- Write checks as tester instructions, not developer descriptions. "Open a journal entry and tap the microphone" not "verify voice recording is wired up".
- Name screens as a tester would find them: "the Learn tab", "the lesson player", "the journal entry editor".
- Never mention internal library names (expo-av, Clerk, Supabase, AsyncStorage).
- Regression watchpoints should be brief — one line each, enough to jog memory.
- If a fix addresses a specific crash or broken flow, describe the repro steps as the first check so testers can confirm it's resolved.
