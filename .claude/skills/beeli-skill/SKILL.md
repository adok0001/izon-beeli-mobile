---
name: beeli
description: >
  Full product context, brand guidelines, monetization model, and platform
  specifications for Beeli — an audio-first African language learning platform
  (mobile + web) covering 70+ languages, built for the diaspora. Use this skill
  whenever working on anything related to the Beeli app, web app, brand, or
  digital presence. This includes building screens, writing copy, styling
  components, designing lessons/quizzes, configuring the educator portal,
  shaping the monetization tiers, or making any product or UX decision for the
  brand. Also use it when asked about Beeli brand colours, fonts, pricing tiers
  (Beeli Plus / Educator), the contributor/bounty economy, target segments, or
  the 70-vs-4 positioning. If you're touching the Beeli project in any way —
  load this skill first.
---

# Beeli — Project Context Skill

You are working on **Beeli**, the audio-first platform built exclusively for the
breadth and depth of African language learning — not a Duolingo clone with
African skins, but a purpose-built cultural learning engine. This skill is your
single source of truth for everything about the product, brand, monetization,
and goals. Read what you need from the reference files below before writing any
code, copy, or making any design decision.

## Sibling Skills

This skill is the **product source of truth** — what Beeli is, the brand, the
monetization model, the platform spec. For specialised tasks, also load one or
more of these:

| Skill | Load when… |
|---|---|
| `beeli-finance` | Any task involving money — runway, burn, unit economics, institutional revenue, the Beeli Plus / Educator P&L, fundraising |
| `beeli-product` | App/web features, roadmap, App Store / TestFlight, EAS builds, classroom tools, the gamification surface |
| `beeli-marketing` | Copywriting, social, ASO, PR, in-app messaging, push notifications, brand voice |
| `beeli-growth` | Learner acquisition, retention, the contributor flywheel, partnerships, the 90-day launch plan |
| `seo-skill` | Anything that needs to rank on Google — the web landing surface, blog posts, page titles, schema |
| `app-store-changelog` | Drafting "What's New" notes and store listing copy for a version update |
| `testflight-checklist` | Writing QA / tester notes from a git range for an internal build |

The role skills are short and focused. Load this brand skill alongside them.

## Reference Files

Load these as needed — you don't need to read all of them upfront, but know
what's available and pull the right one before starting each task.

| File | What's inside | Load when… |
|---|---|---|
| `references/branding.md` | Colours, fonts (Plus Jakarta Sans), brand voice, visual motifs (Adinkra), do/don't list, messaging hierarchy | Any styling, UI, copy, or design work |
| `references/business-model.md` | The free-core moat, Beeli Plus, Beeli Educator, Sponsored Language Grants, why community scale is the asset | Building monetization UI, pricing pages, the educator tier, or any revenue-related feature |
| `references/language-catalog.md` | The 70+ languages by region, the language priority matrix, content-depth rules | Building the language picker, lesson content, marketing a specific language, or any content decision |
| `references/product-spec.md` | App + web surface map, the audio-first architecture, gamification system, educator portal, ASO spec, platform conventions | Planning screens, routing, component structure, or overall product architecture |

The canonical strategy documents live outside this skill:

- `docs/marketing-strategy.md` — the comprehensive Beeli marketing & business strategy (positioning, segments, channels, retention, monetization, KPIs, 90-day roadmap)
- `.claude/strategy/STRATEGY_BRIEF.md` — the distilled strategic picture
- `CLAUDE.md` · `README.md` · `web/README.md` — architecture and feature inventory

## Critical Facts to Always Keep in Mind

Even without loading the reference files, these non-negotiables apply to every
task on this project:

- **Brand colours:** Ocean Blue `#0a7ea4` (primary / CTA / chrome) · Ancestral Purple `#8b5cf6` (accent / achievements / premium) · plus Savanna Gold and Sunset Orange for cultural highlights and urgency. Never substitute the primary/accent.
- **Fonts:** `Plus Jakarta Sans` — `700 Bold` for headlines, `600 SemiBold` for subheads (`heading` / `heading-medium` in Tailwind). Modern, globally legible, culturally neutral.
- **The one-line positioning:** *"Your language, your roots."* — diaspora-facing. *"Learn African languages, interactively."* — educator/institutional-facing.
- **The killer stat:** *Duolingo covers 4 African languages. Beeli covers 70+.* Use it everywhere.
- **Audio-first, always.** African languages are oral traditions first. Hearing is inseparable from understanding — never ship a text-first learning flow.
- **Free is the moat, not the limitation.** All language learning, gamification, community, and cultural content stay permanently free. Monetization rides on top (Plus, Educator, Grants) and never gates community growth.
- **Name the language.** Never say "an African language" when you can say "Izon," "Twi," or "Amharic." Precision signals respect and builds community trust.
- **Diaspora motivation is the engine.** Users reconnect with culture, family, and self — not productivity. Speak to that motivation first, mechanics second.
- **Platforms:** Live on iOS, Android, and Web. Current app version **1.42.0**. Free, no in-app purchases yet. Owner: Tamara Adokeme.

## Quick-Start Checklist

Before writing your first line of code or copy for this project:

1. Read `references/branding.md` — get the colours, fonts, and voice right from the start
2. Read `references/business-model.md` — understand what stays free and what monetizes (and why)
3. Read `references/product-spec.md` — know the surface map, the audio-first architecture, and the UX rules
4. Read `references/language-catalog.md` when you reach any language or content decision

The reference files are dense but worth it. Beeli is racing to **own the
category** before a well-funded competitor notices it exists — every correct
implementation decision compounds that lead. Build it right.
