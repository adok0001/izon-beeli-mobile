# Ịzọn lesson notes → where they land in Movements 1–10

Audit of `userio-docs/` against the Movement structure, 2026-07-26.

## The corpus

35 weekly ỊZỌN LESSON NOTE files, Feb–Jun 2026, already extracted to
`userio-docs/izon_lesson_notes_content.csv`:

- **1,362 lines of attested Ịzọn**, each glossed in English
- **139 distinct sections** (the tutors' own topic headings)
- Every line carries `source_file` + `date`, so any claim traces back to a
  dated class

This is the single most valuable Ịzọn asset in the repo: language a real tutor
taught a real class, not recombined dictionary words.

## Where it lands

1,182 of 1,362 lines classify cleanly by section heading.

| Target | Lines | What |
| --- | --- | --- |
| **M1 Arrival** | 561 | possessives (102) · sentence drills (95) · adjectives & opposites (82) · demonstratives (74) · numbers 1–20 (59) · dialogues (50) · question words (29) · imperatives (27) · plurals (21) · greetings (17) · interjections (5) |
| **M3 The Village** | 298 | vigesimal counting 21–100 (150) · word-formation: compounding, cliticization, conjunctions, syllable classes (123) · class & title vocabulary (25) |
| **M2 The Household** | 141 | verb bank (93) · body parts (26) · tense/aspect inflection (16) · the house described (6) |
| **M9 The Elder's Voice** | 95 | ideophones, reduplication, triplication |
| **M6 The Working Year** | 45 | names of fishes (*Endi-areama*) |
| **M4 Growing Up** | 42 | colours (22) · animals (20) |

The remaining 180 lines sit under generic headings (`More Ịzọn Vocabulary` 60,
`General` 56, roman numerals) and need row-level triage — but they are not
junk. `General` alone contains the complete question-word set: *tị eye* (what),
*tị bọkọ* (who), *tị eyo* (where), *tị efie* (when), *tị eye kị donị* (why).

## On "they'll all probably be in M1–3"

Mostly right — **1,000 of 1,182 classified lines (85%) land in M1–M3**. But
182 lines have no home there, and three bodies of material are substantial
enough to need their own placement:

- **Names of fishes — 45 lines.** *sịka* stingray, *afurumo* shark, *emein*
  manatee, *akọdịmakọdị* flying fish. This is occupational vocabulary for the
  fishing year: **M6**, not M1–3.
- **Ideophones — 95 lines.** *angbengbee* (massive), *wịrịwịrị* (restlessness),
  *godogodo* (boiling intensely), plus the reduplication and triplication
  patterns that generate them. This is expressive/poetic register: **M9**,
  Arts, Play & Oratory.
- **Vigesimal counting to 100 — 150 lines.** *sí oyi kẹnị feni* = "twenty and
  one extra". M1 Block 8 covers 1–20; the base-20 system above that is a
  separate cognitive step and belongs in **M3** at the earliest.

## What this corpus does NOT do

**It cannot fill M1's 800 blank lines.** Two measurements, both conservative
(exact and normalised-exact only — no fuzzy matching, because a wrong Ịzọn line
presented as attested is worse than a blank):

- **Line-level: 25/863 (2.9%).** Run `match-notes.mts` in the design-course
  scaffold to reproduce.
- **Vocabulary-gap level: 4/79**, and those four are loose matches on compound
  glosses (`laugh / cry` → `dẹrị / you`) rather than genuine hits.

The reason is register, not quality. The notes are drills and word lists
(*Mị bẹlẹ* — "This is a pot"); M1 is dialogue (*"Hello? Is anyone here?"*).
M1's gaps are conversational connective tissue — *guest, wait, greet, listen,
until, patience, gratitude* — which a demonstrative drill never needs.

## So what "reuse" means here

Build lessons and games **from** these sections. Do not substitute lines **into**
M1 and call it filled.

1. **The grammar spine is already attested.** M1 Block 5 (demonstratives),
   Block 7 (plurals in `-ama`), Block 8 (numbers), Block 2/5 (possessives) are
   each backed by 20–100 lines of real classroom Ịzọn. The spiral ladder the
   design calls for — *this is a boy → these are boys → there was a boy* — has
   its base rungs in `Mị te ye?`, `Plurals`, and `Inflected Verbs`
   (progressive `mịnị`, perfective `dẹ/nẹ`, negation).
2. **Four topic areas have no home in any Movement yet** and are large enough
   to be lessons in their own right: fishes (M6), ideophones (M9), class and
   title vocabulary (M3), vigesimal counting (M3).
3. **The consolidation games should draw here first.** Fishes, animals,
   colours, body parts and opposites are exactly the bare-vocabulary sets the
   blueprint pushes out of transcripts and into block-closing games
   (`gameVocabulary` in `blueprint.ts`).
4. **The dictionary should absorb it.** 1,362 attested pairs against 4,359
   existing `dictionary_entries`, sourced and dated — a far better import
   candidate than the 343-lesson `course-izon-dc` dump.

## Reproducing

```bash
npx tsx match-notes.mts   # in .claude/skills/design-course/scaffold
```
