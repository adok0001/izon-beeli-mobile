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

| | Beginner | Intermediate | Advanced |
|---|---|---|---|
| **Listening** | `izon-fw-1` — 10-segment greetings dialogue, full transcript with tonal glosses | `izon-ot-1` — sacred-grove narrative, rich imagery, partial gloss | `izon-co-1` — contemporary news segment, no transcript; learner takes notes |
| **Speaking** | `izon-fw-2` — guided identity dialogue ("I am Izon, from Kolokuma") | `izon-el-1` — open-ended daily-life scenario, learner fills one turn | `izon-co-3` — opinion/debate: learner constructs an argument |
| **Reading** | `izon-ss-1` — vowel chart, orthographic key, reading isolated words | `izon-ot-3` — full proverb text in Izon script, annotated | `izon-co-4` — unsimplified contemporary prose, no gloss |
| **Writing** | — (output assessed via Speaking at beginner level) | — | `izon-co-4` — journal prompt: write 3 sentences responding to a news story |
| **Vocabulary** | `izon-fw-1` — greetings set; `izon-nt-1` — numbers 1–10 | `izon-el-3` — health & body vocabulary in context | `izon-co-2` — technology & civic register word set |
| **Grammar** | `izon-cm-1` — sentence-level grammar intro in communicative context | `izon-el-4` — temporal clauses in weather/season discussion | `izon-co-3` — complex clause structure in argument-building |

---

## Skill → Izon Course Mapping

| Course | ID | Level | Default skills |
|---|---|---|---|
| Emi — First Words | `course-izon-fw` | beginner | vocabulary, listening |
| Izọn Fiye — Sounds & Script | `course-izon-ss` | beginner | listening, reading |
| Kịẹn mọ Okubo — Counting & Trade | `course-izon-nt` | beginner | vocabulary, speaking |
| Izọn Gba — Speaking Izon Well | `course-izon-cm` | beginner | speaking, listening, grammar |
| Izon Colours | `course-izon-cl` | beginner | vocabulary |
| Akara Izon — Daily Life & Routines | `course-izon-el` | **intermediate** | speaking, listening, reading, grammar |
| Teme Gba — The Old Stories | `course-izon-ot` | intermediate | reading, listening, speaking |
| Izon Ekenemọ — Contemporary Izon | `course-izon-co` | **advanced** | reading, writing, grammar, listening |
| Ịzọn Tịnmọ — Songs | `course-izon-sg` | beginner | listening, speaking |

All six skills appear on real Izon content across all three levels. Writing's first
real home is the advanced course, where journal-style prompts give learners a structured
place to produce written Izon.

---

## Authoring Rules

1. **Every active lesson must declare at least one skill.** Stub/inactive lessons may
   omit `skills`; the field defaults to `[]`.
2. **Use the per-course defaults** from the table above, then refine per-lesson where
   the content obviously emphasises a different skill (e.g. a possessives explanation
   → add `grammar`; a listening-only segment → drop `speaking`).
3. **New Izon lessons** (Everyday Life / Contemporary): author `text` as a bracketed
   English placeholder (`"[Good morning!]"`) with correct English `translation` and
   French `translationFr`. Educators replace placeholders with real Izon via `/educator`.
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
