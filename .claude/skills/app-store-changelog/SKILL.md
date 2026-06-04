---
name: app-store-changelog
description: This skill should be used when the user asks to "draft what's new", "write release notes", "create App Store changelog", "write promotional text for the new version", "generate store listing copy", or "what changed since the last release". Produces two outputs: App Store "What's New" notes and a full promotional store listing for Beeli version updates.
version: 0.1.0
---

# App Store Changelog & Promotional Copy

Drafts two release artifacts whenever Beeli ships a new version:

1. **What's New** — concise App Store version notes (≤4000 chars, plain prose, no markdown)
2. **Promotional text** — the dedicated App Store "Promotional Text" field (170 chars max, plain text, appears above the description, can be updated without a new release submission)

## Inputs

Accept optional arguments in the form `from-version to-version` (e.g. `/app-store-changelog 1.14.3 1.28.5`).

- If both versions are supplied, use them as the git range.
- If only one is supplied, treat it as `to-version` and auto-detect `from-version`.
- If neither is supplied, auto-detect both from the git log and `mobile/app.json`.

## Workflow

### Step 1 — Resolve the version range

```bash
# Current version
cat mobile/app.json | grep '"version"'

# Most recent version-bump commits to find the previous release
git log --oneline --grep="bump" --grep="version" --all-match | head -10

# All commits since the previous version tag/bump
git log --oneline <from-commit>..HEAD
```

Use the commit hash of the previous version bump (e.g. a `chore: bump app version` commit) as the range floor if no git tags exist.

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

### Step 5 — Present both outputs

Present them as two clearly labelled blocks so the user can copy each independently. After both outputs, list any `[CONFIRM AVAILABILITY]` flags for the user to resolve.

## Key conventions

- Never mention internal implementation details (API names, database changes, build tooling).
- Refer to the app as **Beeli**, not "Izon Beeli" or "izon-beeli-mobile".
- Languages mentioned in copy: **Izon** and **Igbo** are the primary ones; be accurate — do not invent language support.
- Nsịbịdị script is an Igbo-specific feature; frame it in that context.
- The leaderboard, widgets, and quiz engine are confirmed user-facing features as of v1.28.5.

## Additional Resources

- **`references/brand-voice.md`** — Tone, vocabulary, and style guidelines for Beeli copy
