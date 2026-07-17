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
- Tag only on version-bump commits; never push tags automatically (`git push --tags` is the user's deliberate action)
- When in doubt, `git status` and `git diff --staged` before committing

## Required Version Bump (Before Every Commit)

Before running builds or staging files, bump the version of **each package this commit
touches** — and only those. Packages carry independent versions and are expected to
diverge; an untouched package keeps its current version.

- Package directory -> version file:
	- `mobile/**` -> `mobile/app.json` (`expo.version`)
	- `web/**` -> `web/package.json` (`version`)
	- `server/**` -> `server/package.json` (`version`)
	- `partykit/**` -> `partykit/package.json` (`version`)
	- `data/**` -> `data/package.json` (`version`)
- A commit that touches no package directory (e.g. `docs/`, root config, `.claude/`) bumps nothing.
- Do not assume patch by default. Review the actual changes and choose one bump level —
  `major`, `minor`, or `patch` — using the principles below, then apply that same level to
  every touched package.

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

Tie-breaker rules (applied across the touched packages' changes):

- If uncertain between two levels, choose the higher level.
- If any touched package includes a `major` trigger, the bump level is `major`.
- If no `major` triggers and at least one `minor` trigger exists, use `minor`.
- Use `patch` only when all changes match patch criteria.

Decision transparency requirement:

- Before running version bump commands, write a one-line rationale in the commit workflow output:
  - `Version bump decision: <major|minor|patch> - <touched packages> - <reason>`
  - e.g. `Version bump decision: patch - mobile - fix greeting casing`

Recommended command flow from repo root. Bump **only** the packages this commit touches,
each on its own independent version line:

```bash
BUMP=<major|minor|patch>   # the single level chosen above

# Which package directories does this commit touch? (staged + unstaged + untracked)
CHANGED=$( { git diff --name-only; git diff --name-only --staged; \
  git ls-files --others --exclude-standard; } | sort -u )
touched() { echo "$CHANGED" | grep -qE "^$1/"; }

# npm packages: bump in place, only if touched
for pkg in server web partykit data; do
  touched "$pkg" && ( cd "$pkg" && npm version "$BUMP" --no-git-tag-version )
done

# mobile lives in app.json (expo.version) — increment it by the same level, only if touched
touched mobile && node -e "const fs=require('fs'),p='mobile/app.json',j=JSON.parse(fs.readFileSync(p,'utf8')),[a,b,c]=j.expo.version.split('.').map(Number),t='$BUMP';j.expo.version=t==='major'?(a+1)+'.0.0':t==='minor'?a+'.'+(b+1)+'.0':a+'.'+b+'.'+(c+1);fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');"
```

If the user explicitly requests a bump type, follow the user request unless it would violate the principles due to a clear breaking change.

## Version Tagging (After Commit)

When — and only when — the commit bumped **`mobile/app.json`** — tag it with that new
mobile version. The `app-store-changelog` skill reads `mobile/app.json` and resolves
release ranges via these `v`-prefixed tags (`git describe --tags`), so the tag must
track the **mobile** version — not server/web/partykit/data, which now version
independently.

- Create an **annotated, `v`-prefixed** tag carrying the new mobile version.
- Commits that don't touch `mobile/` create no tag — they still fall inside the next
  mobile release's range, which is correct.
- Tag **locally only** — never `git push --tags`. Pushing tags is outward-facing and
  awkward to retract, so leave it to the user's deliberate action.

```bash
# Run only after a commit that bumped mobile/app.json.
V=$(node -p "require('./mobile/app.json').expo.version")
if [ -z "$(git tag -l "v$V")" ]; then
  git tag -a "v$V" -m "release v$V"   # local only; the user pushes tags deliberately
fi
```

## Required Build Gate (Before Every Commit)

Run a build command before every commit, based on what changed:

- Web changes: `cd web && npm run build`
- Server changes: `cd server && npm run build`
- Mobile changes: `cd mobile && npx expo export --platform web`
- Data changes: `cd data && npm run build`
- Multi-package changes: run all relevant commands above

If any build fails:

1. Fix the issue
2. Re-run the failing build command until it passes
3. Stage the fixes and continue commit flow

## Required .env.example Sync (Before Every Commit)

Keep each package's env example in lockstep with the variables the code reads.

- Target files:
	- `mobile/.env.example` — `EXPO_PUBLIC_*` vars
	- `web/.env.example` — `NEXT_PUBLIC_*` and server vars
	- `data/.env.local.example` — `NEXT_PUBLIC_*` and server vars
- For each package touched by the commit, scan source for the relevant env prefixes and reconcile against the example file:

```bash
# Mobile: list every EXPO_PUBLIC_* the source actually reads
grep -rhoE "EXPO_PUBLIC_[A-Z_]+" mobile --include="*.ts" --include="*.tsx" \
	| grep -v "/dist/" | sort -u
# Compare against the keys documented in mobile/.env.example
grep -oE "EXPO_PUBLIC_[A-Z_]+" mobile/.env.example | sort -u
```

- Add any variable used in source but missing from the example; remove any that no longer appear in source.
- Exclude Expo/framework-injected vars that only appear in built output (`dist/`) such as `EXPO_PUBLIC_PROJECT_ROOT`, `EXPO_PUBLIC_FOLDER`, `EXPO_PUBLIC_UPDATES_SERVER_PORT`.
- Use placeholders or safe defaults as values — never commit real secrets.
- Stage any updated example file with the rest of the commit.

## Process

1. Run `git status` to see what changed
2. Run `git diff` to review changes
3. Bump the version of each touched package only — untouched packages stay put (see Required Version Bump)
4. Sync `.env.example` files for any touched package (see above)
5. Run required build command(s) for changed package(s)
6. Stage relevant files individually: `git add mobile/...` / `git add web/...` / `git add server/...` / `git add partykit/...` / `git add data/...`
7. Verify staged changes: `git diff --staged`
8. Confirm success with `git status`
9. If this commit bumped `mobile/app.json`, tag it locally with the new mobile version (see Version Tagging)
