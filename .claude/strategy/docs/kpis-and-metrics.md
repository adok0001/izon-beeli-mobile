# Beeli — KPIs & Success Metrics

*Distilled from `docs/marketing-strategy.md` §12. Paired with the `beeli-finance`
and `beeli-growth` skills. Source of truth for the numbers: PostHog
(`mobile/lib/analytics.ts`).*

## North Star

**Daily Active Learners (DAL)** — users who completed ≥1 lesson segment or daily
challenge that day. Not installs, not registrations, not followers. Immune to
install fraud; measures actual value delivery.

## Tier 1 — Growth (acquisition)

| Metric | 30-day | 90-day |
|---|---|---|
| Total installs | 500 | 3,000 |
| Registered users | 300 | 1,500 |
| Weekly new registrations | 50 | 200 |
| Top-3-keyword ASO rank | Top 50 | Top 10 |
| Social followers (combined) | 500 | 2,500 |

## Tier 2 — Engagement (retention) — these gate monetization

| Metric | Target |
|---|---|
| D1 retention | >40% |
| D7 retention | >20% |
| D30 retention | >10% |
| Lessons/user/week | >2 |
| Users with >7-day streak | >15% of active |
| Daily-challenge completion | >30% |

**The gates:** D30 must be known before any paid acquisition; **D60 > 15%** is the
hard precondition for launching Beeli Plus.

## Tier 3 — Community (flywheel health)

| Metric | Target |
|---|---|
| Vocabulary contributions / month | 200+ |
| Bounties completed / month | 50+ |
| Feed posts / month | 100+ |
| Classrooms created | 10+ by Day 90 |
| Languages with >10 active learners | 15+ by Day 90 |

## Tier 4 — Revenue (post Day 60)

| Metric | Target |
|---|---|
| Beeli Plus conversion | >2% of MAU |
| Educator accounts activated | 5+ by Day 90 |
| Educator MRR | $500+ by Day 90 |

## Analytics prerequisite

PostHog is integrated via `mobile/lib/analytics.ts` (lesson completions, challenge
completions, streak events, level-ups). **Verify events flow correctly and build
the key dashboards before activating acquisition channels** — every retention and
monetization gate depends on trustworthy D1/D7/D30 numbers.
