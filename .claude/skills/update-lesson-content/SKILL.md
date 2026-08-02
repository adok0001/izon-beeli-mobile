---
name: update-lesson-content
description: "Turn lesson notes — a tutor PDF/DOCX in userio-docs/, the owner's `Izon_Lesson Notes Extras` file, notes typed in chat, or a mix — into Studio-importable CSVs, checked against the live dictionary and placed into lessons by the owner before anything is written. Use when the user says 'update [language] with lesson notes', 'add lesson notes from [date]', mentions extra or additional notes, references a userio-docs file, or gives new words, glosses, or corrections directly in the conversation."
---

# Update Lesson Content

Lesson content arrives as tutor notes (PDF/DOCX in `userio-docs/`), as the
owner's running `userio-docs/Izon_Lesson Notes Extras` file, and as notes typed
straight into the conversation. This skill turns any of them — usually a mix —
into **import-ready CSVs** the owner uploads through Studio, via a mandatory
review gate (Step 4) where they revise every new entry and confirm which lesson
it belongs to.

## The database is the source of truth

`mobile/lib/data/**` was deleted in `5b8dcfc` — there are no content TypeScript
files, no `e(...)` dictionary entries, and no `db:sync-*` commands. **Never
re-create them.** Content reaches learners exactly two ways:

| Path | Use for |
|---|---|
| **Studio bulk import** (Educator → Bulk Import; web `/educator/import`) | Everything in a lesson note — words, sentences, proverbs, quizzes, lessons |
| **A one-off `server/src/seed/*.ts` script** (dry-run → `--apply`) | Structural work a sheet can't express: re-parenting lessons, deactivating rows, backfills |

Claude's deliverable is the CSV, not a database write. Uploading is the owner's
step — the importer stamps authorship and the four-eyes status from *their* role
(admin → `published`, reviewer → `in_review`), so a Claude-side write would
launder that provenance.

## Step 0 — What has already been processed?

Nothing in the database records which note a word came from — `dictionary_entries`
has no source column. So "is this note done?" is inferred, not looked up:

```bash
cd server && npm run db:note-status            # every tutor note
cd server && npm run db:note-status -- --extras  # the extras file's dated sections
```

Three independent signals per note:

| Column | Means |
|---|---|
| **extracted** | it appears in `izon_lesson_notes_content.csv` — someone parsed it into glossed lines |
| **sourced** | it is cited in `izon_master_dictionary.csv`, with the row count |
| **in db** | share of the note's distinct Ịzọn tokens that now exist in `dictionary_entries` |

Read them together. A low **in db** score is a reliable "not done". A high score
is *not* proof — common words recur across notes, so an ordinary-vocabulary note
scores high whether or not anyone imported it. Treat ≥90% as "probably done,
spot-check before redoing" and anything under ~80% as worth a look.

**A worked example of the false positive.** The extras file's `0722` section scored
**100% in db** — its one word, `Bụ`, exists in `dictionary_entries`. But the note
glosses it "past" (a tense marker) and the table says "Pond". The token matched; the
meaning didn't. 100% meant "this string exists somewhere", not "this note is done".
Match on meaning, not on tokens (Step 3).

Run this before asking the user which note to work on: "these three are
outstanding, which do you want?" beats making them remember.

**Then close the loop.** After a run, append a line to
`userio-docs/processed-notes.csv` (`source,section,date,csv_written,rows,notes`)
so the next run doesn't have to infer. The file exists and already covers the
Feb–Jul 2026 corpus — read it before inferring anything from the three signals
above. This is the only record that a sheet was actually produced —
the three signals above can't distinguish "imported" from "never touched but
made of common words".

## Step 1 — Gather the input

**Open `userio-docs/Izon_Lesson Notes Extras` before you read anything else** —
including before the tutor note the user named. It is the owner's running file, it
changes between sessions, and its newest material sits at the top. It routinely
carries corrections to, and overlaps with, the very note you are about to parse: the
`0727` section duplicated most of the 27 July tutor note, and a gloss the owner wrote
there **overrides** the tutor's. Reading it second means re-doing work; reading it
last means shipping a gloss the owner already corrected. Details in *The extras file*
below.

Content arrives in several shapes, and any run can involve more than one:

| Shape | Where it lives |
|---|---|
| **A tutor note** | a PDF/DOCX in `userio-docs/` |
| **Extra notes** | `userio-docs/Izon_Lesson Notes Extras` — the owner's running file |
| **Chat** | words or corrections the user types in the conversation |
| **Any combination** | a tutor note plus "…and also add these" — the common case |

Extra notes and chat notes are first-class input, not side comments. The user is
a native speaker: material they supply is attested by that fact (see Step 9), and
a correction they make to a tutor note wins over the note.

### The extras file

`userio-docs/Izon_Lesson Notes Extras` is where extra notes usually are. **Read
it on every run** — it changes between sessions, and the newest material is at
the top. Two halves, and only the first is importable:

**Dated vocabulary** — `MMDD` header (no year; infer it, `0727` is 27 July),
newest section first, then `Izon, English` lines:

```
0727
Benii, The water
Garii mịẹnẹ/ teminẹ, The garri is prepared (native oral, mịẹdẹ/temidẹ is written form)
```

**This is a person's notebook, not a data file — read the lines, don't regex
them.** The conventions hold most of the time and then don't:

- **The comma is the separator, never the colon.** Both sides can carry colons:
  `Warị mị beni fa: Miebi a mu beni zu bo, There's no water: Miebi go and fetch water`
  is one row.
- **But "first comma" is not a rule you can trust.** `Tamara, nụa o!, Tamara,
  hi/welcome!` splits after the *second* comma — the Izon and the English each
  contain one. Lines like this need reading; the Step 4 gate is where a bad split
  gets caught.
- **A slash means different things on each side.** On the Izon side it is
  alternative forms — `Garii mịẹnẹ/ teminẹ` and `Butter mị yọị de/Butter mị sanị nị`
  are two rows each. On the English side it is one gloss with alternatives —
  `Ago, Metal/enamel (traditional) cup` and `Tẹmẹ, Image/Spirit` stay single rows.
- **Some entries use a parenthetical instead of a comma.** `O kuroemi (we are
  fine)` and `Ye emi o (singular)` are vocabulary, not stray notes.
- **Some lines aren't entries at all.** `Mene signifies present tense or
  habitual`, `-a signifies a question`, and `Dot under` are grammar observations.
  Valuable, but not dictionary rows — surface them to the owner as notes or as
  material for a lesson description.
- Parentheticals elsewhere are register or dialect notes (`(native oral, mịẹdẹ is
  written form)`, `(Clan of Ekeremor & ors)`), not part of the gloss.

**Prose reference material** — everything after the dated sections: Ijaw
ethnography, religion, the Woyengi creation myth, Egbesu initiation, art, death
beliefs, dress. **None of it is lesson content and none of it goes in a sheet.**
It is background for authoring, and it needs handling under Step 9's heritage
rules: sacred and initiation material stays for a keeper to verify, and passages
carrying a third party's wording (the quoted poetry, the encyclopedia-style
paragraphs) must not be republished as Beeli content. If a cultural item really
should ship, it takes the JSON-only `cultural` lane with the owner's say-so —
never a silent dictionary import.

### Chat notes

Material typed straight into the conversation has no file behind it, and every
row of `izon_master_dictionary.csv` cites a filename as its source. Before using
it, **append it to `Izon_Lesson Notes Extras`** under today's `MMDD` header,
matching the file's existing `Izon, English` style. Record the words as given —
don't tidy the Izon, don't fill gaps, keep the English they wrote beside it.

Where a note corrects a tutor note, write both and say which replaced which; a
silent overwrite hides the disagreement from the next reader.

For the tutor-note shape:

```bash
ls -t userio-docs/*.pdf userio-docs/*.docx | head
```

Naming pattern: `ỊZỌN LESSON NOTE for [Day] DD-MM-YYYY_[timestamp].pdf`. Read it
with the Read tool. If the user named neither a date nor inline content, list the
directory and ask.

**Check the extracted corpus first.** 40 of the 41 tutor notes (11 Feb – 22 Jul 2026)
are already parsed into `userio-docs/izon_lesson_notes_content.csv` — 1,573 glossed
lines with `source_file,date,section,izon,english,notes`. (The 27 Jul note was
transcribed straight from its PDF and is not in the CSV yet. There are no January
notes — the corpus starts 11 February.) If the note's filename appears in that CSV,
work from those rows instead of re-parsing the PDF:

```bash
grep -c "22-07-2026" userio-docs/izon_lesson_notes_content.csv
```

`mobile/docs/izon-lesson-notes-coverage.md` maps the corpus's sections onto
Movements — use it to decide where new material lands.

To (re)generate plain text for a note not yet in the CSV:

```bash
./scripts/convert-izon-docs.sh   # → scripts/.cache/izon-docs-text/*.txt
```

## Step 2 — Route each section to an import lane

Tutor notes use numbered sections (I. More Vocabulary, II. Animals, III.
Proverbs…). Extra and chat notes usually don't — route those line by line on
what each line *is*, and ask rather than guess when a line could be either a
vocabulary entry or a drill sentence. Map to a lane:

| Section content | `type` column | Lane |
|---|---|---|
| Vocabulary, animals, food, body parts, single words | `dictionary` | Unified CSV |
| Drill sentences, fill-in-the-blank | `sentence` | Unified CSV |
| Proverbs | `proverb` | Unified CSV |
| Comprehension questions | `quiz` | Unified CSV |
| A new lesson or story **with a transcript** | — | Lesson CSV (one file per lesson) |
| Multi-turn scenarios, cultural notes with key terms | — | JSON only (`POST /import/scenarios` / `/import/cultural`) — no CSV template exists; hand these to the owner as a note, don't force them into a sheet |

Stories are lessons with `type: "story"` — same lesson CSV.

**Exercise-prompt sections are drills, not content — exclude them from both lanes.**
Sections like `Write these Ịzọn words in English`, `Write the numbers 1 to 20 in
Ịzọn`, and `Write the Ịzọn forms of the following` put the *answer* in one column and
the *prompt* in the other, so their rows are column-misaligned. This is where the
English words `hers` (glossed "Ours.") and `yours` (glossed "His.") turned up in the
Izon column on the Feb–Jul run. `Title/Header` rows are likewise not content.

## Step 3 — Check what the dictionary already has

The old `grep mobile/lib/data/izon.ts` step is dead. Query the live table:

```bash
cd server && npm run db:lookup-words -- izon --file /tmp/new-words.txt
```

(or pass words as arguments). It prints a "drop these" list and a "these are the
new rows" list, matching on NFC-normalised lowercase `word`.

**This step is not optional**, and the reason is stronger than "you might get a
duplicate". The importer's upsert conflicts on **`id`**, and the id a CSV row can
generate is `${languageId}-${slugify(word)}`. Almost nothing in the table uses that
scheme — for Izon it is **2 rows out of 10,627**:

| id scheme | izon rows | can a CSV row conflict with it? |
|---|---:|---|
| `other` | 6,266 | no |
| `d<n>` (original seed) | 4,339 | no |
| `edu-<uuid>` (educator) | 20 | no |
| `izon-<slug>` (CSV scheme) | 2 | yes |

So importing a word that already exists doesn't *risk* a duplicate — it **creates
one, every time**. Step 3 is the only thing preventing that. (Correcting an existing
entry is not possible through this path at all; that needs a seed script.)

### The lookup output is not the new-word list

A raw token dump of a note reports far more "new" words than are real — on the
Feb–Jul 2026 run, **103 reported, 60 genuine**. Clean the candidates *before*
querying, or you will both miss real hits and import junk:

- **Trailing punctuation** — `beni.`, `kọn.`, `owei.` are existing headwords wearing
  a full stop. Strip `.,;:!?` first.
- **Slash alternatives** — split `akalụ/akalị`, `yọị/sanị` into two candidates before
  the lookup, or each pair reads as one unknown word.
- **Cyrillic homoglyphs** — PDF extraction emits Cyrillic а/к/р/о/м/е inside
  otherwise-Latin words (`акромị`). They never match their Latin twins, so they
  surface as new *and* silently fail `grep`. Normalize before comparing.
- **Parenthetical forms** — `ede(mefu)` is not a headword; both expansions (`ede`,
  `edemefu`) were already published under `food`. Expand and check each. Never let a
  literal `(` reach the sheet — the importer slugifies `text` into the row id.
- **English leaked from the Izon column** — see the exercise-section warning in Step 2.

### Tone-marked variants are never new words

Matching is on the bare surface, so **every tone-marked form reads as new**. On the
same run, 26 candidates were tone or plural demonstrations of headwords already
present: `ànì`/`ání`, `ènì`/`éní`, `òwò`/`ówó`, `èré`, `èyè`, `fún-ámá`. The 25 March
lesson teaches tone *through minimal pairs*, which is exactly the `torú` (native
chalk) / `toru` (river) hazard Step 9 warns about.

A candidate differing from an existing entry only by tone marks or a plural suffix
goes on the owner's questions list — never into the sheet.

### When the note and the dictionary disagree, put both in the sheet

A word can be "already in the dictionary" and still be wrong there, or be a homonym
the table doesn't know about. Don't silently drop it as a duplicate and don't
silently overwrite the note's gloss.

**Emit ONE importable row — the owner's — and carry the competing gloss in
`source`.** Never emit the word twice: two rows with the same word derive the same
id and break the whole batch (see the id-collision warning below).

```
dictionary,ago,Metal/enamel (traditional) cup,nouns,,,,,,,"Extras 0719 [CONFLICT: db has ""Orange"" (nouns, published) — confirm which is right]"
```

Real examples from the 0719/0727 run:

| Word | Note / extras (owner) | Database |
|---|---|---|
| `Bụ` | "past" (tense marker) | "Pond" `[nouns, published]` |
| `ago` | "Metal/enamel (traditional) cup" | "Orange" `[nouns, published]` |
| `die` | "fifteen" | "Fifteen (alternate word)" — but filed `[phonetics]` |

**Say the consequence out loud in the hand-off, every time.** The sheet is both a
review document and an upload artifact, and the importer inserts rather than updates
(Step 3). Where the database holds the wrong gloss, **no sheet can fix it** —
uploading the owner's version adds a second entry beside the wrong one. Correcting an
existing entry needs a seed script. Say which of the two you believe and why, and
leave the decision with the owner.

### Two words, one id — the collision that eats data

The importer derives `id = izon-<slugify(word)>`, and **`slugify` strips tone marks
and subdots** (`server/src/lib/slug.ts` — NFKD, then combining marks removed). Those
are exactly the marks that carry meaning in Ịzọn:

| Words | Meaning | Derived id |
|---|---|---|
| `torú` / `toru` | native chalk / **river** | both `izon-toru` |
| `ẹrẹ` / `ere` / `èré` | — | all `izon-ere` |
| `ànì` / `ání` | 25 March minimal pairs | both `izon-ani` |
| `kọn` / `kon` | — | both `izon-kon` |
| `Bụ` / `bu` | past / pond | both `izon-bu` |

Two consequences, and the second is the dangerous one:

1. **Two colliding rows in one sheet fail the batch.** Postgres raises
   `21000: ON CONFLICT DO UPDATE command cannot affect row a second time`. `BATCH`
   is 500 and neon-http has no transactions, so earlier batches are already
   committed — a partial import with nothing to roll back.
2. **Colliding rows in *different* uploads silently overwrite.** Import `torú`
   (chalk) today, `toru` (river) next month: same id → `DO UPDATE` → the chalk row's
   word, gloss and category are replaced. No error, no warning, entry gone.

**The dry run does not catch either.** `validate()` is per-row and never compares ids
across rows, so the preview says "valid" and the real run explodes — or worse,
succeeds destructively.

**Therefore, before writing any sheet: slugify every dictionary `text` and check the
results are unique.** If two rows collide, they cannot both go in — and they cannot
both be imported by CSV at all. Put both on the owner's list and flag that
distinguishing them needs a seed script with explicit ids. This is the one place
where "the CSV is the deliverable" doesn't hold.

## Step 4 — Review gate: the owner revises and places every new entry

**Never write a sheet straight from a first parse, and never skip this step.**
Once Step 3 has narrowed the note to genuinely new entries, present *all* of them
to the user and wait for a reply.

See what the new material could extend:

```bash
cd server && npm run db:list-lessons -- izon
cd server && npm run db:list-lessons -- izon --course course-izon-mv-household
```

Then show one table, grouped by the lesson each entry probably belongs to:

| # | Izon | English | Category | Movement / course | Probable lesson | Source |
|---|---|---|---|---|---|---|
| 1 | … | … | `verbs` | M2 The Household · `course-izon-mv-household` | `izon-cm-6` Everyday Verbs | note §II |
| 2 | … | … | `animals` | M4 Growing Up · `course-izon-mv-growing-up` | **NEW** — "Names of Fishes" | note §IV |
| 3 | … | … | `phrases` | M2 The Household · `course-izon-mv-household` | `izon-fw-4` Family Members | Extras 0727 |

- **Movement / course** — name the course a group of rows *supports*, with the
  Movement number, its title, and the course id (the live list is the table in
  Step 8). **This is authoring guidance, not upload routing.** Content-CSV rows go
  into language-wide banks and are attached to no course — the column tells the
  owner which lessons this vocabulary could extend, and which are worth authoring
  next. Only a Step 8 lesson CSV actually targets a course.
  Resolve every pair with `db:list-lessons izon` **in the current session** — the
  counts move, and a prefix in a lesson id is not a course (Step 8).
- **Probable lesson** — the existing lesson title the entry extends, or
  `NEW: <working title>` under that Movement when no current lesson covers it.
  Place from the note's own section headings and
  `mobile/docs/izon-lesson-notes-coverage.md`; take candidate titles from
  `db:list-lessons`, never from memory.
- **Never leave a group unplaced without saying so.** A section heading that
  matches no Movement is a real gap — report the row count and the heading, and
  ask. Silently defaulting everything to Arrival is worse than an empty cell.
- For a run spanning many notes, write the placement map to a companion file
  next to the sheet (`import-[lang]-<range>-placement.md`) rather than burying a
  200-row table in chat. Label it **authoring guidance** — what this material could
  support — not an upload checklist; the content CSV uploads in one piece regardless
  of what the map says.
- **Source** — the tutor note's section, or the extras file's `MMDD` header, the
  line came from, so any gloss traces back to something on disk.
- Flag every uncertain gloss or category inline rather than burying it below the
  table.

Owner-supplied rows still go through this gate. The point isn't to re-ask what
they just told you — it's that placement, category, and spelling are decisions
they haven't made yet, and a pasted line is easy to mis-split into the wrong
lane. Present them alongside the note's rows, marked with their source, and say
plainly which rows came from them.

Ask explicitly for: gloss corrections, category changes, and confirmation of each
placement. The owner is a native speaker — their revision **is** the attestation,
not a courtesy review. Batch the questions; don't ask row by row.

Write CSVs only after they reply, and only for what they approved. Fold every
correction into the sheet itself — a fix acknowledged in chat but not written to
the CSV is a fix that never happened.

## Step 5 — Never assign content ids

There is no "next id" to find. The unified CSV has no `id` column: dictionary
rows get a stable id derived from the word server-side, everything else gets a
fresh one. Ids are a DB concern, not an educator's.

This is about **content rows**. *Lesson* ids are a separate matter with a real
convention — see Step 8.

## Step 6 — Assign categories

The server's `DICTIONARY_CATEGORIES` is the only authority
(`server/src/lib/dictionary-categories.ts`, which every write and import route
validates against via its `isDictionaryCategory()` guard) — an unlisted category
fails the whole batch:

```
greetings numbers family pronouns time verbs body market occupations nouns
phrases food possessives ordinals commands animals phonetics money proverbs
adjectives ideophones adverbs
```

`adjectives`, `adverbs`, and `ideophones` are real categories now — do **not**
file qualities under `verbs`, and do not default anything to `nouns`. A
wrong-but-valid category passes validation and is never flagged again. If a word
genuinely resists classification, leave it out of the sheet and list it for the
owner rather than guessing.

**`DICTIONARY_CATEGORIES` says what is *legal*, not what the table already *uses*.**
Check two or three semantic neighbours before assigning, because the conventions
aren't guessable: `endi` (fish) is filed under `animals`, but `ede`/`edemefu`
(crayfish) are under `food`.

```bash
cd server && npm run db:lookup-words -- izon endi nama ede edemefu
```

The section heading is the primary signal. Generic headings — `General`, `More Ịzọn
Vocabulary`, `More short sentences and phrases` — carry none, and on the Feb–Jul run
17 of 60 words landed under one. Falling back to the gloss is fine (a gloss longer
than two words is a `phrases` entry, not a bare noun), but **every row categorised
that way must be listed separately at the Step 4 gate as inferred**, not folded in
silently with the ones read off a heading.

## Step 7 — Write the unified CSV

Columns (`mobile/lib/unified-import.ts`, mirrored in `web/lib/`), plus a `source`
column this skill always adds:

```
type,text,english,category,pronunciation,example,example_english,answer,meaning,options,source
```

- **dictionary** — `text` = word · `english` = meaning · `category` required · `pronunciation`, `example`, `example_english` optional
- **sentence** — `text` = full sentence · `english` = translation · `answer` = the word to blank out (blank vs. equivalent is derived: `blank` when `answer` appears inside `text`)
- **proverb** — `text` = proverb · `english` = translation · `meaning` = the lesson it teaches
- **quiz** — `text` = prompt · `english` = correct answer · `category` = `word-to-english` | `english-to-word` | `fill-in-the-blank` | `listening` · `options` = choices separated by `|`

- **source** — where the line came from: the tutor note's date and section
  (`2026-05-13 §More Ịzọn Vocabulary`) or the extras file's header (`Extras 0727`).
  Mark a category that was **inferred from the gloss** rather than read off a section
  heading by appending ` [category inferred]`, so the reviewer knows which ones to
  check. The importer ignores unknown columns — `UNIFIED_COLUMNS` only builds the
  template header and `validate` reads named fields — so `source` rides along
  harmlessly and never reaches the database.

Blank cells are expected — each type fills only its own columns. Quote any cell
containing a comma. Translations beyond English use per-language columns
(`english:fr`, `english:pcm`) — never a `*Fr` sidecar.

### The two artifacts — and which one can touch a lesson

A run produces **one content CSV, plus one CSV per lesson**. They are different
files going to different endpoints, and only the second can create or update a
lesson:

| Artifact | Endpoint | Course? | Rule |
|---|---|---|---|
| **One** content CSV per run — `dictionary`, `sentence`, `proverb`, `quiz` | `/import/unified` | **none** | rows land in language-wide banks |
| **One CSV per lesson** (Step 8) | `/import/lessons` | picked in the UI | **idempotent per (course, title)** |

**`POST /import/unified` never reads a `courseId`** — only `/import/lessons` does
(`bulk-import.ts`, and the UI gates on `needsCourse = mode === "lessons"`). Unified
rows go into `dictionary_entries`, `sentence_templates`, `proverbs` and `quiz_bank`
for the whole language, attached to no lesson and no course.

So **do not split the content CSV by lesson.** Every such file would upload
identically into the same banks; naming one `import-izon-m1-02-…csv` implies a link
the endpoint doesn't have. Split it only to stay under the role cap.

Write to `userio-docs/import-[lang]-DD-MM-YYYY.csv` for a single note, or
`import-[lang]-<range>.csv` when one run covers many.

**A lesson is not a pile of sentences.** Four unrelated drill lines are bank content,
not a lesson. A lesson needs a coherent arc and a transcript — that is Step 8's file,
and its `title` (with the course) is the idempotency key: a matching title replaces
that lesson's transcript, a new title creates a lesson. Decide the title before the
first upload, because changing it later makes a second lesson instead of updating the
first.

**Batch caps:** 5,000 rows for admin, 100 for a reviewer. Split larger runs.

## Step 8 — Write the lesson CSV (one file per lesson)

Metadata block, a `---` line, then the transcript grid
(`mobile/lib/lesson-import.ts`):

```csv
title,A Visit to Grandmother's House
description,Greetings and family words through a conversation
style,skit
canDo,Greet an elder and ask after their household
---
text,translation,speaker,roman
Nene! Baidẹ!,Grandmother! Good morning!,Child,
Tau! Bo dẹkị.,Grandchild! Come in.,Nene,
```

`style` is `skit` | `immersive_story` | `host_narrated`. The target course is
picked in the Studio UI, not in the file. Re-import is idempotent per
(course, title) and replaces the transcript wholesale.

**The 10 Movements are the journey spine, but they are not the only live courses.**
Five active non-Movement courses hold **378 lessons — more than every Movement
combined (119)**. Verify with `db:list-lessons izon`; these counts move.

| Course id | Title | Lessons |
|---|---|---:|
| `course-izon-mv-arrival` | Arrival (M1) | 66 |
| `course-izon-mv-household` | The Household (M2) | 15 |
| `course-izon-mv-growing-up` | Growing Up (M4) | 13 |
| `course-izon-mv-assembly` | The Assembly (M8) | 10 |
| `course-izon-mv-working-year` | The Working Year (M6) | 7 |
| `course-izon-mv-keeper` | The Keeper (M10) | 4 |
| `course-izon-mv-elders-voice` | The Elder's Voice (M9) | 2 |
| `course-izon-mv-union` | The Union (M7) | 2 |
| `course-izon-dc` | Izon Dictionary — Core Vocabulary | **343** |
| `course-izon-cm` | Izọn Ọkọsụọ — Grammar & Structure | **18** |
| `course-izon-ot` | Teme Gba — The Old Stories | 8 |
| `course-izon-ss` | Izọn Fiye — Sounds & Script | 6 |
| `course-izon-sg` | Ịzọn Tịnmọ — Songs & Sing-Along | 3 |

**Retired — inactive, zero lessons, never target these:** `course-izon-fw`,
`course-izon-el`, `course-izon-wk`, `course-izon-co`, `course-izon-nt`,
`course-izon-cl`, `course-izon-bm-fw`, `course-izon-bm-el`, `course-izon-bm-ot`.

**Awaiting staffing — real Movements, but inactive and empty:**
`course-izon-mv-village` (The Village, M3 — awaiting an educator; this id was
`course-izon-mv-naming` until 2026-08-02) and
`course-izon-mv-threshold` (The Threshold, M5 — awaiting a keeper). Don't place
content into either without saying so.

### Never infer a course from a lesson id prefix

The journey migration re-parented lessons **without renaming them**, so a prefix is a
historical artifact, not a namespace:

| Lesson | Actually lives in | *Not* |
|---|---|---|
| `izon-fw-4` Family Members | The Household | the dead `course-izon-fw` |
| `izon-cm-6` Everyday Verbs | The Household | `course-izon-cm` |
| `izon-nt-2` Vigesimal System | Growing Up | the dead `course-izon-nt` |
| `izon-cl-3` All the Colour Words | The Assembly | the dead `course-izon-cl` |
| `izon-el-2` Getting Around | The Working Year | the dead `course-izon-el` |

Always resolve a lesson's course with `db:list-lessons izon`, in the current session.

**Current id convention: `izon-m<N>-NN`, where N is the Movement number.** Only M1
was ever migrated — 58 of Arrival's 66 lessons are `izon-m1-*`; M2, M4, M6 and M8
have **none** and still run entirely on legacy prefixes. So:

- **New lessons take the current convention** — The Village → `izon-m3-*`, The
  Threshold → `izon-m5-*`.
- **Existing legacy ids are valid and in use.** Don't rewrite them by hand. Renaming
  them is a real migration (six FK tables reference `lessons.id`, plus deeplinks and
  user progress) and needs its own authorised script.

Scene grouping within a Movement is assigned by educators via the Scene button on
the course's lesson list — don't hand-author `scene`/`sceneTitle`/`sceneOrder`.

## Step 9 — Attest every line

The corpus's value is that every line traces to a person who knows the language —
a tutor who taught it to a real class, or the owner, who is a native speaker.
What is never attested is Izon that *Claude* produced. The test is who supplied
the line, not how confident it looks:

| Source | Status |
|---|---|
| Tutor note, transcribed as written | attested |
| Owner, via `Izon_Lesson Notes Extras` or chat | attested — and it overrides a tutor note it contradicts |
| `izon_master_dictionary.csv` | sourced — cite the row |
| Recombined, inferred, or tone-folded by Claude | **not attested**, ever |

- **Only transcribe what the source says.** Never recombine dictionary words into
  new "example" sentences and present them as attested — that is how fabricated
  Izon (`ereịn` ≠ sibling, `teki`) got into the seed.
- Verify anything uncertain against `userio-docs/izon_master_dictionary.csv`
  (10,175 sourced rows), not against plausibility.
- A word you cannot gloss from a note, the extras file, or the master dictionary
  goes on a **questions list for the owner**, not into the sheet with a guessed
  meaning.
- Mark anything unverified with a `[[...]]` placeholder — `db:guard-content`
  holds lessons containing one, so it fails safe.

Then check whether the new lesson leaves untranslatable words for learners:

```bash
cd server && npx tsx src/seed/audit-dictionary-coverage.ts izon
```

It lists transcript words with no dictionary entry and no approved contribution,
each with a probable gloss from `izon_master_dictionary.csv`. **Read the gloss
column carefully:** a bare gloss is an exact headword match, but anything marked
`[? tone: …]` matched only after folding tone marks, and tone is meaning-bearing
— `torú` is native chalk, `toru` is river. A `[?` gloss is a lead to verify with
the owner, never a meaning to paste into the sheet.

Fold the real gaps back into Step 7's sheet — through the Step 4 review gate,
like everything else.

## Step 10 — Hand off

Report:

- The CSV paths written, and the row count per `type`
- **Which artifact is which** — the one content CSV (banks, no course) and each
  lesson CSV (with the course to pick at upload). Don't imply the content sheet
  targets a lesson; it can't.
- **The Movement and lesson each group of rows supports** — as authoring guidance
  (Step 4), so the owner knows what this material makes possible next
- **Any conflict pairs in the sheet** — both rows are present by design, and
  uploading them unedited creates a duplicate. Name the rows to delete.
- Anything appended to `Izon_Lesson Notes Extras`, and which rows in the sheet
  came from the extras file rather than from the tutor note
- The line appended to `userio-docs/processed-notes.csv` (Step 0) — without it,
  the next run has only inference to go on
- Which lesson each group of rows is destined for, and which are **NEW** lessons
  the owner still has to create in Studio
- Corrections the owner made at the Step 4 gate, confirmed as applied to the sheet
- Rows dropped as already present (from Step 3), listed by word
- Words left out for lack of an attested gloss — the owner's questions list
- Any section that needs the JSON-only lane or a seed script
- The upload path: **Studio → Educator → Bulk Import**, language = Izon, then
  publish from the review queue

Do not deploy, and do not run a migration, unless the user asks separately.

