# Skill Competency Framework — Izon Reference Guide

Beeli organises language learning along two axes: **level** (beginner / intermediate / advanced)
and **skill** (the six core competencies below). Every lesson declares which skills it
develops; the UI surfaces this as compact badges on course cards.

---

## The Six Skills

| Skill | Icon | Colour family | What it means in practice |
|---|---|---|---|
| Listening | 🎧 | `cyan` | Comprehending spoken language — following a transcript, parsing tones, understanding native-speed speech |
| Speaking | 🗣️ | `red` | Producing speech — pronunciation drills, dialogues, call-and-response |
| Reading | 📖 | `green` | Decoding written text — orthography, transcripts, proverbs on the page |
| Writing | ✍️ | `purple` | Producing text — journal prompts, fill-in-the-blank sentences, structured composition |
| Vocabulary | 🔤 | `yellow` | Acquiring and retaining words — first words, numbers, colours, thematic word sets |
| Grammar | 🧩 | `slate` | Understanding structure — tense, aspect, possession, clause-building |

> **Speaking** and **Writing** are activities (output-heavy) that require native-speaker
> feedback to assess. They are tagged on lessons to signal intent; interactive
> assessment features will come in a later phase.

---

## Skill × Level Matrix — Izon Examples

Levels map onto the Izon journey as **M1–M4 ≈ beginner (A1–B1)**, **M5–M7 ≈
intermediate (B1–B2)**, **M8–M10 ≈ advanced (B2–C2)**.

| | Beginner (M1–M4) | Intermediate (M5–M7) | Advanced (M8–M10) |
|---|---|---|---|
| **Listening** | **M1 Arrival** — greetings dialogue, full transcript with tonal glosses | **M6 The Working Year** — work/season narrative, partial gloss | **M9 The Elder's Voice** — elder speech and praise song, no transcript |
| **Speaking** | **M1 Arrival** — guided identity dialogue ("I am Izon, from Kolokuma") | **M6 The Working Year** — open-ended daily-life scenario, learner fills one turn | **M8 The Assembly** — opinion/debate: learner constructs an argument |
| **Reading** | **Sounds & Script** (reference track) — vowel chart, orthographic key, isolated words | **M9 The Elder's Voice** — full proverb text, annotated | **M8 The Assembly** — unsimplified contemporary prose, no gloss |
| **Writing** | — (output assessed via Speaking at beginner level) | — | **M8 The Assembly** — journal prompt: 3 sentences responding to a civic topic |
| **Vocabulary** | **M1 Arrival** — greetings set; **M4 Growing Up** — numbers 1–10 | **M6 The Working Year** — health, body, and work vocabulary in context | **M8 The Assembly** — technology & civic register word set |
| **Grammar** | **Grammar & Structure** (reference track) — sentence-level grammar in communicative context | **M6 The Working Year** — temporal clauses in weather/season discussion | **M8 The Assembly** — complex clause structure in argument-building |

---

## Skill → Movement Mapping

Default skills per Movement of the Izon journey. See
[`mobile/docs/izon-course-plan.md`](../mobile/docs/izon-course-plan.md) for the
Movement population map and the legacy topic-course IDs each one folded in.

| # | Movement | Level | Default skills |
|---|---|---|---|
| 1 | Arrival | A1 | vocabulary, listening, speaking |
| 2 | The Household | A1–A2 | vocabulary, listening, speaking |
| 3 | The Village | A2 | vocabulary, speaking |
| 4 | Growing Up | A2–B1 | vocabulary, listening, speaking |
| 5 | The Threshold | B1 | listening, speaking |
| 6 | The Working Year | B1–B2 | speaking, listening, reading, grammar |
| 7 | The Union | B2 | speaking, listening |
| 8 | The Assembly | B2–C1 | reading, writing, grammar, listening |
| 9 | The Elder's Voice | C1 | reading, listening, speaking |
| 10 | The Keeper | C2 | reading, listening |

**Reference tracks** (outside the numbered journey, supporting every Movement):
Sounds & Script → listening, reading. Grammar & Structure → grammar.

All six skills appear on real Izon content across all three levels. Writing's first
real home is M8 The Assembly, where journal-style prompts give learners a structured
place to produce written Izon.

---

## Authoring Rules

1. **Every active lesson must declare at least one skill.** Stub/inactive lessons may
   omit `skills`; the field defaults to `[]`.
2. **Use the per-Movement defaults** from the table above, then refine per-lesson where
   the content obviously emphasises a different skill (e.g. a possessives explanation
   → add `grammar`; a listening-only segment → drop `speaking`).
3. **New Izon lessons**: author `text` as a bracketed English placeholder
   (`"[Good morning!]"`) with a correct English `translation`. Other languages go in the
   `translationTranslations` map — **never** a `translationFr` sidecar column; that
   pattern is retired (see CLAUDE.md). Educators replace placeholders with real Izon in
   Beeli Studio.
4. **No fabricated Izon.** Never invent native-language forms in lesson files.

---

## Palette Reference

Badge classes follow the same `dark:`-paired pattern as `LEVEL_COLORS` in
`mobile/constants/course-colors.ts`. No hex values are used; categorical accents come
from `getSkillMeta()`.

| Skill | `badgeBg` | `badgeText` |
|---|---|---|
| listening | `bg-cyan-100 dark:bg-cyan-900` | `text-cyan-700 dark:text-cyan-300` |
| speaking | `bg-red-100 dark:bg-red-900` | `text-red-700 dark:text-red-300` |
| reading | `bg-green-100 dark:bg-green-900` | `text-green-700 dark:text-green-300` |
| writing | `bg-purple-100 dark:bg-purple-900` | `text-purple-700 dark:text-purple-300` |
| vocabulary | `bg-yellow-100 dark:bg-yellow-900` | `text-yellow-700 dark:text-yellow-300` |
| grammar | `bg-slate-100 dark:bg-slate-800` | `text-slate-700 dark:text-slate-300` |
