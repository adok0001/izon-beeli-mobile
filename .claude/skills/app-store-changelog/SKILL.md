---
name: app-store-changelog
description: This skill should be used when the user asks to "draft what's new", "write release notes", "create App Store changelog", "write promotional text for the new version", "generate store listing copy", or "what changed since the last release". Produces three outputs: a per-release App Store "What's New" block, Promotional Text, and a fuller internal/website changelog for Beeli version updates.
version: 0.1.0
---

# App Store Changelog & Promotional Copy

Drafts three release artifacts whenever Beeli ships a new version:

1. **What's New (App Store — paste this)** — concise, storefront-ready version notes for the single build being submitted (≤4000 chars, plain prose, no markdown). Short by design; only the first 2–3 lines show before "more".
2. **Promotional text** — the dedicated App Store "Promotional Text" field (170 chars max, plain text, appears above the description, can be updated without a new release submission)
3. **Internal / website changelog** — the fuller grouped list (New / Improved / Fixed) for release records and a website release-notes page. This is the raw material you *derive* the storefront block from — **do not paste it into the App Store**.

## Scope: default to one release

Default to a **single release** — the commits since the previous version tag. App Store
"What's New" describes *that build's* changes, not a cumulative history; a multi-release
wall reads as noise and confuses users who already received earlier updates.

Only produce a cumulative range when the user explicitly asks for one (e.g.
`/app-store-changelog 2.2.0 2.37.0`). When you do, the grouped list is the **internal /
website changelog only** — still hand back a tight per-build "What's New" for the actual
submission.

## Inputs

Accept optional arguments in the form `from-version to-version` (e.g. `/app-store-changelog 1.14.3 1.28.5`).

- If both versions are supplied, use them as the git range.
- If only one is supplied, treat it as `to-version` and auto-detect `from-version`.
- If neither is supplied, auto-detect both from the git log and `mobile/app.json`.

## Workflow

### Step 1 — Resolve the version range

Version-bump commits are tagged (annotated, `v`-prefixed — created by the `git-commit`
skill). Use tags as the range boundaries; they are the reliable anchors.

```bash
# Current version
cat mobile/app.json | grep '"version"'

# Previous release tag (the range floor for a normal, per-release run)
git describe --tags --abbrev=0

# All commits in this release
git log --oneline "$(git describe --tags --abbrev=0)"..HEAD

# For an explicit cumulative range: git log --oneline vFROM..vTO
```

Fallback if a needed tag is missing: find the version-bump commit by inspecting
`mobile/app.json` history (`git log -p -- mobile/app.json | grep '"version"'`) and use
that commit hash as the floor.

### Step 2 — Classify commits

Read the full commit log for the range. Classify each commit:

| Prefix | Classification |
|---|---|
| `feat:` | User-facing feature — include |
| `fix:` | Bug fix — include if user-visible |
| `chore:` | Internal — exclude (unless it's a version bump) |
| `docs:` | Exclude |
| `refactor:` | Exclude unless it changes visible behaviour |
| `Merge pull request` | Skip; the underlying commits carry the signal |

Group included commits into themes: **New Features**, **Design & UI**, **Content**, **Performance & Fixes**.

### Step 3 — Draft "What's New"

- Plain prose, no bullet symbols, no markdown headers — App Store renders plain text.
- Lead with the most impactful change.
- One short paragraph per theme group (2–4 sentences max).
- Close with a one-line "Bug fixes and stability improvements" if there are fix-only commits.
- Target 300–600 characters. Hard limit: 4000 characters.

### Step 4 — Draft Promotional Text

- Use the brand voice from `references/brand-voice.md`.
- Hard limit: **170 characters** (plain text, no markdown, no line breaks).
- This is the App Store "Promotional Text" field — it appears above the description and can be updated any time without resubmitting the app.
- Lead with the most exciting change in this release. One punchy sentence or two tight clauses.
- Flag any feature that may not be live for all users with a `[CONFIRM AVAILABILITY]` note.

### Step 5 — Draft the internal / website changelog

- Group the included commits under **New**, **Improved**, and **Fixed**.
- Fuller than the storefront block — this is the record, not the pitch — but still in the brand voice and free of internal implementation detail.
- For a cumulative range, this is the primary artifact; for a single release it is the backing record for the "What's New" block.

### Step 6 — Present all three outputs

Present them as clearly labelled blocks so the user can copy each independently, in this order:

1. **What's New (App Store — paste this)**
2. **Promotional Text**
3. **Internal / website changelog** — labelled as *not for the App Store*.

After the outputs, list any `[CONFIRM AVAILABILITY]` flags for the user to resolve.

## Key conventions

- Never mention internal implementation details (API names, database changes, build tooling).
- Refer to the app as **Beeli**, not "Izon Beeli" or "izon-beeli-mobile".
- Languages mentioned in copy: **Izon** and **Igbo** are the primary ones; be accurate — do not invent language support.
- Nsịbịdị script is an Igbo-specific feature; frame it in that context.
- The leaderboard, widgets, and quiz engine are confirmed user-facing features as of v1.28.5.

## Additional Resources

- **`references/brand-voice.md`** — Tone, vocabulary, and style guidelines for Beeli copy
