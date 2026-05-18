---
name: git-branch
description: "Create a new git branch for Beeli. Use when starting new work, creating a feature branch, or when the user says 'new branch', 'create branch', or 'start working on'."
---

# Git Branch Creation

## Branch Naming Format

```
{type}/{short-description}
```

| Type | Use |
|------|-----|
| `feat` | New feature |
| `fix` | Bug fix |
| `polish` | UI/UX improvements |
| `refactor` | Code restructuring |
| `chore` | Config, dependencies, tooling |
| `content` | Language data, lesson notes, dictionary updates |

Examples:
- `feat/streak-recovery-flow`
- `fix/lesson-audio-not-playing`
- `content/izon-animals-vocabulary`
- `chore/upgrade-expo-sdk-55`

## Create-from-master Workflow

```bash
# 1. Switch to master and pull latest
git checkout master && git pull origin master

# 2. Create the new branch
git checkout -b feat/my-feature

# 3. Confirm
git branch --show-current
```

## Rules

- Always branch from up-to-date `master`
- Use kebab-case, no spaces
- Keep the description short but specific (3–5 words)
- One branch per logical unit of work
