# Beeli docs

Engineering and product reference docs for the Beeli monorepo. For repo structure,
setup, and deployment, see the top-level [README](../README.md) and [CLAUDE.md](../CLAUDE.md).

## Architecture & engineering

| Doc | What it covers |
|---|---|
| [system-design.md](system-design.md) | The full system design — requirements, data model, API surface, scaling posture. What is built today vs. what the design implies at 10×. |
| [tech-debt-baseline.md](tech-debt-baseline.md) | Living debt snapshot, newest refresh first. Diff against the latest numbers rather than re-deriving. |
| [troubleshooting.md](troubleshooting.md) | Known EAS iOS build and provisioning issues (BeeliWidget signing, xcodebuild timeouts) and their fixes |

## Open specs — designed, not yet built

| Doc | What it covers |
|---|---|
| [studio-consolidation-spec.md](studio-consolidation-spec.md) | Collapsing web `admin/*` + `educator/*` into one role-scoped `(studio)` console. Shell exists; pages not migrated. |
| [first-run-learn-contribute-redesign.md](first-run-learn-contribute-redesign.md) | Collapsing onboarding + feature tour + welcome checklist into one first-run flow. Not yet built. |
| [sentence-corpus-design.md](sentence-corpus-design.md) | Shared sentence corpus + dictionary senses. Phases 0–2 done; 3 (read cutover) and 4 (destructive drop) open. |

## Content & pedagogy

| Doc | What it covers |
|---|---|
| [skill-curriculum.md](skill-curriculum.md) | The six-skill × three-level competency framework that lessons declare via `skills` |
| [brand-guidelines.md](brand-guidelines.md) | The Museum design system as canonical brand, and the web convergence path |

## Product & go-to-market

| Doc | What it covers |
|---|---|
| [roadmap-2027.md](roadmap-2027.md) | Targets to 31 December 2027 — dictionary depth, audio, partners, publications |
| [marketing-strategy.md](marketing-strategy.md) | Go-to-market and positioning strategy |
| [marketing-campaigns.md](marketing-campaigns.md) | Campaign plans and messaging |

## Related docs elsewhere

- [mobile/docs/izon-course-plan.md](../mobile/docs/izon-course-plan.md) — the canonical Izon
  10-Movement course structure and pedagogy layer
- [mobile/docs/izon-lesson-notes-coverage.md](../mobile/docs/izon-lesson-notes-coverage.md) —
  where the tutor lesson-note corpus lands across Movements 1–10
- [web/README.md](../web/README.md) — consumer web app details
- [.claude/strategy/](../.claude/strategy/) — decision-grade strategy briefs (growth,
  monetization, competitive landscape, KPIs)

> `userio-docs/` holds the Izon source corpus — tutor lesson notes, dictionaries,
> scholarly PDFs. It is **gitignored**, so it is not present in a fresh clone.
