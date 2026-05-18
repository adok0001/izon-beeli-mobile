---
name: git-push
description: "Push changes to origin. Use when the user says 'push', 'push changes', or 'push to remote'."
---

# Git Push

## Remote

| Remote | Repository |
|--------|------------|
| `origin` | adok0001/izon-beeli-mobile |

## Process

1. **Verify clean state and branch:**
   ```bash
   git status
   git branch --show-current
   ```

2. **Check for unpushed commits:**
   ```bash
   git log origin/{branch}..HEAD --oneline 2>/dev/null || echo "No upstream yet"
   ```

3. **Push:**
   ```bash
   git push -u origin {branch-name}
   ```

## Rules

- **Never force push** — no `--force` or `-f`
- **Never push directly to master** — only push feature branches
- Use `-u` on first push to set upstream tracking
- If push is rejected (behind remote), pull and resolve first:
  ```bash
  git pull --rebase origin {branch-name}
  ```
