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
- Refer to Word of the Day and Song of the Week by their full names on first reference; WOTD/SOTW are acceptable on subsequent references within the same piece. (Phrase of the Month no longer has a live surface — don't reference it.)

## Voice don'ts

- Don't use: "game-ified", "gamification", "fun and engaging", "bite-sized".
- Don't use: "powered by AI" — Beeli is community-powered.
- Don't call it a "dictionary app" or a "translation app".
- Don't use superlatives without substance ("the best", "world-class").
- Don't reference internal systems by name (Clerk, Supabase, PostHog, Expo).

## Feature accuracy

Confirmed user-facing surfaces as of **v6.17.1** (verified against shipped routes, not
the commit log). Anything not on this list needs checking before it goes in copy.

- **Learning** — courses, lessons, checkpoints, series, and story-driven lessons; offline lesson downloads.
- **Practice** — the Playground hub with 14 games: Speed Round, Recall Bingo, Quiz, Matching, Word Review, Phrase Review, Dictation, Say It Back, Fill the Proverb, Sentence Builder, Script Decode, Trace Symbol, Etymology Trail, Word Challenge. Spaced review sits behind Word/Phrase Review and Practice Review.
- **Scripts** — Nsịbịdị, Ge'ez, and Adinkra lessons. Script Decode and Trace Symbol appear only for languages that carry a script, so don't present them as universal.
- **Multiplayer** — real-time quiz battles and paired lessons with a lobby.
- **Classroom** — educator groups with invite codes and assignments.
- **Community** — feed, leaderboard, contributor profiles, word/lesson/bulk contributions, bounties, reviewer applications.
- **Daily** — Today, daily challenges, streaks, Word of the Day, Song of the Week.
- **Culture** — proverbs, songs, cultural pages, etymology.
- **Other** — dictionary, journal, notifications, home-screen widgets (iOS).

Language accuracy:

- **Izon** is the flagship and carries the deepest content. The live language catalogue is
  database-driven and educators extend it through Studio — **check what is actually
  published before naming any language in copy**, rather than trusting this file.
- Nsịbịdị is Igbo-specific; frame it in that context.
- Don't confuse *interface* languages (English, French, Nigerian Pidgin, Arabic,
  Portuguese) with *learning* languages. They are separate lists.

Availability caveats — flag these `[CONFIRM AVAILABILITY]` rather than assuming:

- **Beeli Plus** can be globally disabled by config; confirm the subscription is live before pitching it.
- **Multiplayer** depends on an environment-configured realtime server; confirm it is running for the build being submitted.
- The **Educator** and **Admin** panels are role-gated — never describe them as things every user gets.

## Example brand-aligned sentences

> "Every word, phrase, and song in Beeli comes from real community contributors — not a database."

> "Beeli is built for the diaspora, the curious, and the committed."

> "Bring the language to your home screen. Word of the Day, Phrase of the Month, and Song of the Week — updated daily, no app open required."

> "Whether you grew up hearing Izon or you're starting from zero, there's a place for you here."
