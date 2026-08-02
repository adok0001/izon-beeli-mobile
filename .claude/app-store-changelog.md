# Beeli — release copy conventions

Project override for the global `app-store-changelog` skill. Everything here wins over
the skill's generic defaults.

## Product and version

- The app is **Beeli** — never "Izon Beeli", "izon-beeli-mobile", or the repo name.
- Current version lives in `mobile/app.json` (`expo.version`).
- Version bumps are tagged annotated and `v`-prefixed by the `git-commit` skill; those
  tags are the reliable range boundaries.

## Who Beeli is for

Beeli serves African language learners — primarily the diaspora reconnecting with their
heritage language, and curious learners starting from zero. The core community is Izon and
Igbo speakers and learners, with more languages planned.

## Tone

- **Direct and confident.** No hedging, no filler. Say what the product does.
- **Cultural, not clinical.** Avoid generic "language app" framing. Beeli is about living languages from living communities.
- **Warm but not cheerful.** Respect the weight of what learners are trying to do. No exclamation points unless strictly necessary.
- **Community-forward.** Contributors, reviewers, and educators are part of the product — not just end users.

## Voice do's

- Lead with the cultural mission: preserving and sharing African languages.
- Emphasise that content comes from real community contributors, not generic databases.
- Name the languages specifically (Izon, Igbo) rather than using vague terms like "African language".
- Use "learner" not "student". Use "contribute" not "upload" or "submit".
- Refer to Word of the Day, Phrase of the Month, and Song of the Week by their full names on first reference; WOTD/POTM/SOTW are acceptable on subsequent references within the same piece.

## Voice don'ts

- Don't use: "game-ified", "gamification", "fun and engaging", "bite-sized".
- Don't use: "powered by AI" — Beeli is community-powered.
- Don't call it a "dictionary app" or a "translation app".
- Don't use superlatives without substance ("the best", "world-class").
- Don't reference internal systems by name (Clerk, Supabase, PostHog, Expo).

## Feature accuracy

- **Izon** and **Igbo** are the primary languages. Be accurate — do not invent language support.
- Nsịbịdị script is an Igbo-specific feature; frame it in that context.
- The leaderboard, widgets, and quiz engine are confirmed user-facing features as of v1.28.5.

## Example brand-aligned sentences

> "Every word, phrase, and song in Beeli comes from real community contributors — not a database."

> "Beeli is built for the diaspora, the curious, and the committed."

> "Bring the language to your home screen. Word of the Day, Phrase of the Month, and Song of the Week — updated daily, no app open required."

> "Whether you grew up hearing Izon or you're starting from zero, there's a place for you here."
