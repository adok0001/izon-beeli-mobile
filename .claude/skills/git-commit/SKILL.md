---
name: git-commit
description: "Create a git commit following Beeli conventions. Use when the user says 'commit', 'commit changes', 'save my changes', or 'commit all'."
---

# Git Commit Convention

## Atomic Commit Rules

- Each commit represents ONE logical change (one fix, one feature, one refactor)
- If changes span multiple concerns, split into separate commits
- A commit should never break the build — every commit is deployable

## Message Format

```
type: lowercase description
```

## Types

| Type | Use | Example |
|------|-----|---------|
| `feat` | New feature or capability | `feat: add booking deposit payment form` |
| `fix` | Bug fix | `fix: correct TZS formatting on invoice` |
| `polish` | UI/UX improvements, styling | `polish: align portal sidebar with brutalist grid` |
| `move` | File moves, restructuring | `move: relocate vendor components to shared package` |
| `chore` | Dependencies, config, tooling | `chore: upgrade next.js to 15.1` |
| `refactor` | Code restructuring, no behavior change | `refactor: extract booking status logic to hook` |
| `docs` | Documentation updates | `docs: add API route documentation for payments` |
| `test` | Adding or updating tests | `test: add playwright tests for booking flow` |
| `perf` | Performance improvements | `perf: lazy-load vendor gallery images` |

## Rules

- Imperative mood ("add feature" not "added feature")
- Under 72 characters
- All lowercase description
- No period at end
- Stage specific files by name — never `git add -A` or `git add .`

## Commit Command (HEREDOC format)

```bash
git commit -m "$(cat <<'EOF'
feat: add booking deposit payment form

EOF
)"
```


## Pre-commit Hook Handling

1. If a hook fails, read the error output carefully
2. Fix the issue (lint, format, type error)
3. Re-stage the fixed files with `git add <file>`
4. Create a NEW commit — never `--amend` (amend would modify the previous commit since the failed commit never happened)

## Safety Rules

- Never amend commits unless explicitly asked
- Never skip hooks (`--no-verify` is forbidden)
- Never force push
- When in doubt, `git status` and `git diff --staged` before committing

## Required Version Bump (Before Every Commit)

Before running builds or staging files, bump versions across all app surfaces.

- Target files:
	- `mobile/app.json` -> `expo.version`
	- `web/package.json` -> `version`
	- `server/package.json` -> `version`
	- `partykit/package.json` -> `version`
- Use one shared version value across all four files.
- Do not assume patch by default. Review the actual changes and choose `major`, `minor`, or `patch` using the principles below.

## Version Bump Decision Principles

Claude must inspect `git diff` (and `git diff --staged` when applicable) and classify the release impact before bumping versions.

Choose `major` (`x.y.z` -> `(x+1).0.0`) when any of these are true:

- Breaking API changes (removed/renamed endpoints, required request fields changed, response contracts broken)
- Breaking data/schema changes requiring destructive migration or incompatible client updates
- Auth/permission model changes that can block previously valid user flows
- Removed or fundamentally changed user-facing features without compatibility layer
- Any change that requires coordinated rollout or manual consumer intervention

Choose `minor` (`x.y.z` -> `x.(y+1).0`) when all changes are backward-compatible but add notable capability:

- New user-facing features, screens, or workflows
- New endpoints/fields/events that are additive and optional
- New integrations, modules, or significant enhancements to existing behavior
- Non-breaking platform capabilities (for example: new educator tools, new moderation paths)

Choose `patch` (`x.y.z` -> `x.y.(z+1)`) for backward-compatible fixes and maintenance:

- Bug fixes without feature expansion
- UI polish/copy/style tweaks without behavioral expansion
- Refactors with no functional change
- Dependency/config/tooling updates with no user-facing capability change
- Test/docs-only updates

Tie-breaker rules:

- If uncertain between two levels, choose the higher level.
- If any package includes a `major` trigger, the shared bump is `major`.
- If no `major` triggers and at least one `minor` trigger exists, use `minor`.
- Use `patch` only when all changes match patch criteria.

Decision transparency requirement:

- Before running version bump commands, write a one-line rationale in the commit workflow output:
  - `Version bump decision: <major|minor|patch> - <reason>`

Recommended command flow from repo root:

```bash
cd server && npm version <major|minor|patch> --no-git-tag-version && cd ..
NEXT_VERSION=$(node -p "require('./server/package.json').version")
cd web && npm version "$NEXT_VERSION" --no-git-tag-version && cd ..
cd partykit && npm version "$NEXT_VERSION" --no-git-tag-version && cd ..
node -e "const fs=require('fs');const p='mobile/app.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));j.expo.version='$NEXT_VERSION';fs.writeFileSync(p,JSON.stringify(j,null,2)+'\\n');"
```

If the user explicitly requests a bump type, follow the user request unless it would violate the principles due to a clear breaking change.

## Required Build Gate (Before Every Commit)

Run a build command before every commit, based on what changed:

- Web changes: `cd web && npm run build`
- Server changes: `cd server && npm run build`
- Mobile changes: `cd mobile && npx expo export --platform web`
- Multi-package changes: run all relevant commands above

If any build fails:

1. Fix the issue
2. Re-run the failing build command until it passes
3. Stage the fixes and continue commit flow

## Process

1. Run `git status` to see what changed
2. Run `git diff` to review changes
3. Bump versions across `mobile/app.json`, `web/package.json`, `server/package.json`, and `partykit/package.json`
4. Run required build command(s) for changed package(s)
5. Stage relevant files individually: `git add mobile/...` / `git add web/...` / `git add server/...` / `git add partykit/...`
6. Verify staged changes: `git diff --staged`
7. Confirm success with `git status`
