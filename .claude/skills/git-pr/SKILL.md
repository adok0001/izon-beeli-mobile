---
name: git-pr
description: "Create pull requests for Beeli. Use when creating a PR, writing a PR, or when the user asks to summarize changes for a pull request."
---

# Pull Request Convention

## Full PR Workflow

1. **Check branch and commits:**
   ```bash
   git branch --show-current
   git log master..HEAD --oneline
   git diff master...HEAD --stat
   ```

2. **Push if needed:**
   ```bash
   git push -u origin {branch-name}
   ```

3. **Create PR** using `gh pr create` targeting `master`

## Title Format

```
{type}: {description}
```

Use the same types as commits: `feat`, `fix`, `polish`, `refactor`, `chore`, `content`

Examples:
- `feat: add streak recovery flow`
- `fix: lesson audio not playing on Android`
- `content: add izon animals vocabulary from 18 May lesson`

Keep under 70 characters.

## PR Body Format

```bash
gh pr create --title "feat: add streak recovery flow" --body "$(cat <<'EOF'
## Summary
- Brief bullet points describing what changed and why

## Changes
- `mobile/app/(tabs)/learn.tsx` — brief description
- `mobile/lib/hooks/use-streak.ts` — brief description

## Test plan
- [ ] Specific thing to test
- [ ] Edge case to verify
- [ ] Platform to check (iOS / Android / web)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Rules

- Base branch: `master`
- Push to `origin` before creating PR
- Include a meaningful test plan with checkboxes
- List key files changed with brief context
- Analyse ALL commits on the branch, not just the latest
