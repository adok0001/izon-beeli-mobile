---
name: graded-reader-spec
description: "Work out what a Beeli language's difficulty ladder actually is, and localize a master story across languages. Use when the user says 'graded reader', 'leveled stories', 'A1 to C2 for [language]', 'what should come first in [language]', 'localize the master story', or wants a difficulty spec before authoring. Also use when asked to write learner text in a language whose grammar isn't attested in the repo — it encodes the attestation discipline that keeps fabricated forms out of beginner material. For authoring a culture world (Movements/Scenes) use design-course; for turning tutor notes into import CSVs use update-lesson-content."
---

# Graded Reader Spec

For deciding, per language, **what a learner can be shown first** — and for
localizing a shared master story down that ladder without inventing grammar.

The deliverable is a **language spec**: a design document that tells a
native-speaker author what the ladder is. It is not learner prose. Native
authorship and native review are the assumption, exactly as in
`update-lesson-content` — Claude's output is a document and a CSV, never a
database write.

## Where this sits

| Skill | Answers |
|---|---|
| **graded-reader-spec** (this) | *What can a learner meet first in this language, and in what order?* |
| `design-course` | *What is this culture's world — Movements, Pillars, Places, Scenes?* |
| `update-lesson-content` | *How do these tutor notes become import-ready CSVs?* |

Run this **before** `design-course` for a language nobody has laddered yet, and
**after** `update-lesson-content` has parsed enough material to mine. The corpus
is the input; guessing is the failure mode.

## CEFR is hidden. Movements are the spine.

Beeli does not organize learning by CEFR and never shows a level to a learner
(`design-course/world-blueprint.md` §Axis 1: *"CEFR is never the learner's
organizing principle — it rides invisibly"*). There is **no `cefr` column in
`server/src/db/schema.ts`** — the level exists only in design documents like the
one this skill produces.

So an A1–C2 ladder is a **design artifact**, and it lands on the journey like
this:

| Level | Movement(s) | Beeli course prefix |
|---|---|---|
| A1 | 1 Arrival | `course-izon-mv-arrival` |
| A2 | 2 The Household, 3 The Village | `-mv-household`, `-mv-naming` |
| B1 | 4 Growing Up, 5 The Threshold | `-mv-growing-up`, `-mv-threshold` |
| B2 | 6 The Working Year, 7 The Union | `-mv-working-year`, `-mv-union` |
| C1 | 8 The Assembly, 9 The Elder's Voice | `-mv-assembly`, `-mv-elders-voice` |
| C2 | 10 The Keeper | `-mv-keeper` |

Consequences you must respect:

- **Never put a level label in a learner-facing field** — not in a lesson
  `title`, `description`, `canDo`, or transcript. A spec that says "A2" is fine;
  a lesson called "A2 Reader" is a bug.
- **Movements 3 and 5 are unstaffed** (`course-izon-mv-naming` awaiting an
  educator, `course-izon-mv-threshold` awaiting a keeper). A ladder that routes
  A2 and B1 material there is routing it nowhere. Say so rather than filing it
  silently.
- The heritage crown at C1–C2 is *accurate*, not a shortage workaround. Mastery
  in these cultures is blessing, proverb, folktale, libation — not clause depth.

## The two failure modes

1. **Porting the wrong ladder.** CEFR was calibrated where hard grammar can be
   deferred. Many of Beeli's 70+ languages do not permit deferral — Bantu noun
   class, obligatory tone, SOV order, obligatory focus marking. Ask what *this*
   language forces into sentence one. Compulsory features cannot be graded by
   presence; grade them by **variety** — few contrasts at A1, more later.

2. **Fluent-sounding wrong output.** A beginner cannot detect an error and keeps
   whatever they met first. This has already happened here: `ereịn` glossed
   "sibling" and `teki` reached the Izon seed as Claude-produced forms that no
   note attests. Confident incorrect target-language prose is the most damaging
   thing this work can produce.

## Attestation — reuse the repo's model, don't invent a parallel one

The three tags map onto the attestation table in `update-lesson-content` Step 9.
Use both: the tag for the spec, the repo mechanism for anything that ships.

| Tag | Means | In the repo |
|---|---|---|
| **[EVIDENCED]** | A form quoted from material actually in hand | A tutor note, the owner via `Izon_Lesson Notes Extras` or chat, or a cited `izon_master_dictionary.csv` row. Quote it, and give the source string that would go in a CSV `source` column (`2026-06-24 §More short sentences and phrases — III`). |
| **[CONFIRM]** | Your inference, segmentation, or recollection | Not attested. If it reaches a lesson it must be a `[[placeholder]]` — `db:guard-content` holds any lesson containing one, so it fails safe. |
| **[DECIDE]** | A project decision nobody has made | Goes to the owner at the review gate, like `update-lesson-content` Step 4. |

Three rules that are not negotiable:

- **A form can be [EVIDENCED] while your analysis of it is [CONFIRM].** `Warịmị`
  "the house" is attested; "*`-mị` is a definiteness suffix*" is your reading of
  it. Tag them separately. This distinction is most of the honest work.
- **Recombining attested words into new sentences is generation.** It is not
  attested no matter how many of the parts are. Say so when you do it.
- **State near the top of every spec** which parts are attested and which are
  not, and — if the corpus is thin — that the model cannot write reliable prose
  in this language. Understating this is a harm, not modesty.

## Workflow

### 1. Find the evidence

```bash
ls userio-docs/*.csv userio-docs/*.pdf userio-docs/*.docx
cd server && npm run db:note-status
```

For Izon the corpus is substantial and already parsed:
`userio-docs/izon_lesson_notes_content.csv` (1,573 glossed lines, 41 tutor notes,
Feb–Jul 2026), `userio-docs/izon_master_dictionary.csv` (~10,175 sourced rows),
plus the owner's running `Izon_Lesson Notes Extras`. For any other language,
check what exists before promising a spec — forty real lines beat any amount of
typological reasoning, and zero real lines means the whole spec is [CONFIRM].

### 2. Mine it

Read `references/evidence-analysis.md` for the full checklist. It is written
against this corpus and names the extraction hazards that have actually bitten
here (Cyrillic homoglyphs from PDF extraction, exercise sections with reversed
columns, slash alternatives).

### 3. Identify what cannot be deferred

The question is not "what is hard?" but **"what does this language force into
sentence one?"** Then grade by variety, not by presence.

### 4. Build the ladder from the language's own resources

Do not port Izon's ladder to Swahili, or Swahili's to Amharic. Ask what this
language offers as a natural progression — verbal extensions, TAM expansion,
noun-class range, clause chaining — and build on that.

### 5. Check the master story against the house style

Compare the master's genre to the teaching tradition's genre. **For Izon this is
already settled and the answer is dialogue** — see the worked example. A
narrative master handed to a call-and-response tradition produces material that
sounds translated and defers the learner's first question form by several levels.

### 6. Fill the spec

Use `references/spec-template.md`. Read `references/izon-worked-example.md`
first for the intended tagging density and tone.

Write to `userio-docs/graded-reader-<lang>-spec.md`, beside the other owner
artifacts. Do not write into `docs/` — that is the owner's, and not edited
without an explicit ask.

## When the user asks for target-language text

- **The language is Izon and the material is attested** — assemble only from
  quoted forms, mark the assembly as generation, and route it through the
  `update-lesson-content` Step 4 review gate. The owner is a native speaker;
  their revision *is* the attestation.
- **Moderate or low confidence** — decline A1/A2 text specifically, and say why
  beginners are the wrong audience for uncertain output. Offer instead: the
  spec, a per-level structural outline, glossable concept lists, or drafting
  from forms the user has themselves attested.
- **Tone unmarked in the corpus** — do not generate marked forms. In Ịzọn tone is
  meaning-bearing (`torú` native chalk vs `toru` river) and only ~13% of corpus
  lines carry accents at all. Guessing tone is the highest-damage error
  available, and it is also an id hazard: `slugify` strips tone marks and
  subdots, so `torú` and `toru` both derive `izon-toru` and silently overwrite
  each other on import (`update-lesson-content` Step 3).

## How a reader actually ships

A graded reader is not a new content type. It is lessons.

| Piece | Lane | Rule |
|---|---|---|
| The story text, per level | **Lesson CSV**, one file per level → `POST /import/lessons` | `style: immersive_story` (or `skit` for dialogue levels), `type: story`. Idempotent per (course, title) — decide the title before the first upload. |
| New words the story needs | **Unified CSV** → `POST /import/unified` | Lands in language-wide banks, attached to no course. Slugify-check every `text` for id collisions first. |
| Cultural framing | JSON-only `cultural` lane | Owner's say-so, never a silent import. |

The owner uploads. The importer stamps authorship and the four-eyes status from
*their* role — a Claude-side write would launder that provenance.

## Multi-language scaling

Beeli covers 70+ languages; the promotable set is Izon, Igbo, Swahili, Oromo,
Amharic, Twi, Hausa, Yoruba. Do not commission 70 ladders against an unproven
master.

1. **Izon end to end first** — it is the flagship and the only language with a
   deep attested corpus.
2. **Then two typologically distant languages**, because they break different
   things: **Swahili** (Bantu, obligatory noun-class concord — tests whether the
   template survives compulsory agreement) and **Amharic** (Semitic, SOV,
   non-Latin script — tests whether it survives a script change and verb-final
   order).
3. **Then revise master and template, then scale** — and gate promotion on
   content depth, per the one content rule in
   `beeli-skill/references/language-catalog.md`: never promote a language whose
   first lesson would disappoint.

## Reporting

Lead the chat response with, in this order:

1. **What the evidence settled** — quote the forms
2. **What it contradicted**, including corrections to your own earlier output
3. **What still needs the owner's decision**

The corrections are the most valuable part. Do not bury them.

## Files

- `references/spec-template.md` — the blank spec
- `references/evidence-analysis.md` — extraction checklist, written against this corpus
- `references/izon-worked-example.md` — a filled spec, evidenced from the real notes
- `references/standalone-prompt.md` — the same method as a paste-able prompt, for contributors without Claude Code
- `assets/master-story-001-EN.md` — "The Wallet", the six-level English master
