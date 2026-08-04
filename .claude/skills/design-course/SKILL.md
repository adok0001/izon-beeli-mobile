---
name: design-course
description: "Generate English-only lesson briefs — CSV templates with the target-language column left blank — for a speaker to fill, plus a Movement structure and culture sketch to place them in. Use when the user says 'create lessons for [language]', 'design a course for [language]', 'what would a [language] course look like', 'build the world for [language]', or names a language and asks where to start. Surveys the existing catalogue first and recommends which lessons to update and where new ones belong. The blank column IS the product: never supply target-language content, and never report placeholder lines as a gap. Does not create courses or restructure the catalogue. For turning existing tutor notes into import CSVs, use update-lesson-content instead."
---

# Design Course

Give a language a starting shape: a rough sketch of its culture and grammar, a
Movement structure that fits, and CSV templates an educator can fill in.

**Everything you write is English.** The target-language column goes out blank
for a speaker. That is the whole design — it is what makes the skill safe to run
on any of the 70+ languages, including ones nobody here speaks.

## The output is the placeholder. Read this before anything else.

**A lesson whose every transcript line is bracketed English is this skill
working. It is a finished brief, not an unfinished lesson.** The English, the
setting, the `canDo` and the speaker labels are the deliverable; the missing
target language is the point, not a defect.

This gets inverted constantly, so state it as a rule:

- **Never report placeholder density as a deficit.** "M6 is 48% real Ịzọn" is the
  wrong sentence. Those 37 bracketed lines are 37 completed briefs waiting on
  speaker time. Reporting them as a gap tells the owner their content is broken
  when it is finished and queued.
- **Never treat existing English scaffolds as debt to clear.** They are not work
  outstanding on this skill's side. Filling them is a speaker's evening, and
  nothing this skill can do makes it happen faster.
- **The measure of a run is how many well-briefed lines a speaker can sit down
  and fill.** Not coverage, not percentage authored, not lessons published. A
  Movement with 600 briefed blank lines is ahead of one with 40 finished lessons
  and nowhere to go next.

The corollary: when the owner asks where the work is, look for **Movements with
nothing in them at all** — no lessons, no placeholders, no brief. That is this
skill's hole. A Movement full of bracketed English is already served.

## What this skill does not do

Staying out of these is as much the job as producing the templates:

- **It does not supply target-language content.** Not a greeting, not a proverb,
  not a cast name, not a place name. Ever. See `references/world-architecture.md`.
- **It does not create courses.** The Movements already exist. Work either
  proposes a *new lesson inside an existing Movement* or *updates an existing
  lesson* — never a new course, and never a retired course shell as a target.
- **It does not restructure the catalogue** — no re-parenting lessons between
  Movements, no re-levelling, no migrations. Those need their own authorised
  script. Surveying the catalogue to decide what to write is not only allowed,
  it is required — see Step 0.
- **It produces at most two kinds of file**: one content CSV and one CSV per
  lesson. No companion question sheets, no placement maps as separate documents.

The sketch is general knowledge, offered quickly and openly as approximate. It is
a starting point for a conversation, not research. Don't hedge it into
uselessness, and don't dress it up as authority either.

---

## Step 0 — Survey what already exists

**Do this first, every run.** You cannot propose a lesson without knowing what is
already there, and the whole point of the survey is to end with a recommendation.

```bash
cd server && npm run db:list-lessons -- izon
cd server && npm run db:list-lessons -- izon --course course-izon-mv-village
```

Read the transcripts of anything that looks close to what you were about to
write. Then say, per Movement, which of three things applies:

| Finding | Recommendation |
|---|---|
| A lesson covers this and its English is good | **Nothing to do.** Say so and move on |
| A lesson covers this but its English is wrong for the culture | **Update it** — same title, rewritten brief. Re-import replaces the transcript wholesale |
| Nothing covers this | **New lesson** — name it and the Movement it belongs to |

Two rules for reading the results:

- **Judge a lesson by its English brief, not by how much target language it
  holds.** A lesson of pure bracketed English with a sharp `canDo` and a real
  setting is in good shape. One with fluent target language and a vague brief is
  not. See *The output is the placeholder* above.
- **A Movement with no lessons outranks a Movement with many blanks.** Empty is
  this skill's hole; briefed-but-unfilled is somebody else's queue.

The survey is a means, not a deliverable. If it has not produced a list of the
form *update X · add Y to Movement Z · leave W alone*, it is not finished — and
it should be a short list in chat, never a separate document.

## Step 1 — Sketch the language

Three or four sentences, no more:

- **Where and how people live** — region, landscape, the livelihood that shapes
  daily vocabulary. *Ijaw communities are in the Niger Delta creeks; fishing and
  the water are central.*
- **Grammar shape** — constituent order, tone, noun classes or their absence,
  anything a learner meets immediately. *Izon is SOV and tonal, with no noun
  classes.*
- **Anything that changes the course** — a script other than Latin, a formality
  system, a widely-used lingua franca alongside it.

Say plainly that this is from general knowledge and may be wrong in places. The
user corrects it; that exchange is the point of the step.

**Don't research this.** No corpus mining, no dictionary lookups, no reading up
on the culture. If you happen to know the repo has material for the language,
mention it in one line and move on.

This is about the *sketch* only — the culture and grammar paragraph. It does not
countermand Step 0, which reads the catalogue on every run. Look up what lessons
exist; don't look up what the language is like.

## Step 2 — Propose a Movement structure

Read `references/world-architecture.md` for the ten Movements and the eight
Pillars and Places.

Propose the structure the sketch implies: which Movements, in what order, and
what each one is *about in this culture*. A fishing culture's Working Year is the
flood cycle; a herding culture's is transhumance. The Movements are fixed; what
fills them is not.

Ten is the default. Offer a shorter cut when the language is starting cold —
**1, 2, 3, 6** (Arrival, Household, Village, Working Year) covers everyday life
without needing ceremony or heritage material.

Name the Places and cast roles in English (*the compound, the market, the Elder*)
and say the language's own words for them are for the educator to supply. **Do
not invent them.** A plausible-sounding word for "the market" is the single
easiest way to put a wrong term into permanent circulation.

### What fills a Movement

A Movement is roughly **48 chapters** — a chapter is one lesson. A single story
arc cannot carry that, so the story is the spine and the rest is built around it
by type:

| Chapter type | Per Movement | What each one is | Filled from |
|---|---:|---|---|
| **Story** | 5 | the Newcomer arc's beats for this Movement | a speaker |
| **Vocabulary set** | 16 | one themed set each — family, food, body, tools | **the dictionary table** |
| **Structure** | 10 | one grammar point each — possession, negation, past, questions | dictionary; examples need a speaker |
| **Practice** | 10 | drill or review tied to the chapters before it | **the preceding chapters** |
| **Culture** | 4 | a proverb, a song, a custom, a place | a speaker; heritage rules apply |
| **Checkpoint** | 3 | can-do review closing a scene band | **the preceding chapters** |
| | **48** | | |

Each type has a distinct job — this is volume without padding, and it is roughly
the shape the mature languages already have.

**Only about 9 of the 48 genuinely need a speaker.** Vocabulary sets pull from
`dictionary_entries`; practice and checkpoints derive from chapters already
written. Say this when proposing — it is the difference between a plausible ask
and an impossible one.

Chapters group into **scene bands** of about 12 — a quarter of a Movement, and
the natural unit to generate and review in one pass.

## Step 3 — Ask, including how much

Present the sketch and the structure together and stop. Something like:

> *Ijaw communities live in the Niger Delta creeks — fishing, canoes, the water
> as the axis of everything. Izon is SOV and tonal. Here's a ten-Movement shape:
> Arrival is a stranger greeted at the waterside, the Working Year is the flood
> cycle rather than planting seasons…*
>
> *Reroll, or generate? And how much — one scene band (~12 chapters), a full
> Movement (~48), or something else?*

**Always ask how much. Never assume a size.** The right amount depends on who is
filling the sheets and how much time they have, and that is not knowable from
here. Offer the units — band, Movement, several Movements, the whole journey —
say roughly how many chapters and how many rows each implies, and let them pick.

If they name a number that doesn't fit a band boundary, follow their number; the
band is a convenience, not a constraint.

Reroll means a different angle on the same language. Take the correction and
propose again — don't defend the first attempt.

Nothing is written until they answer both questions.

## Step 4 — Generate

Two things: the CSVs, and a sheet telling whoever fills them what to do.

**The CSVs.** One file per lesson (`mobile/lib/lesson-import.ts`) — metadata
block, a `---` line, then the transcript grid with `translation` carrying the
English and `text` blank:

```csv
title,The Newcomer — Arrival
description,A stranger reaches the community and is welcomed
style,skit
canDo,Greet someone and say where you are from
---
text,translation,speaker,roman
,Welcome! You have come.,Host,
,I have come. Good morning.,Newcomer,
```

`style` is `skit` | `immersive_story` | `host_narrated`. The target course is
picked in the Studio UI at upload, not named in the file.

Write to `userio-docs/<lang>-<nn>-<slug>-template.csv`, numbered in story order.

**Chapters live in their Movement's course.** Language → Course (the Movement) →
Chapter (the lesson). A Movement's 48 chapters all upload into that Movement's
course; the mix of types is what varies, not the destination.

**The story chapters stay adjacent.** The five story chapters in a Movement are
consecutive, and grouped under one `scene` so they read as a run rather than
scattering among the vocabulary sets. Don't hand-author `scene`/`sceneTitle`/
`sceneOrder` — educators assign scene grouping in Studio — but say in the hand-off
which chapters belong together so they can.

The arc across Movements is a **standalone story arc**: `story_arcs` with
`courseId` null, which the schema supports precisely for "a narrative spanning"
more than one course. `story_arc_cast` registers the four recurring roles, and a
transcript segment's `speaker` resolves to a `castId` there. Izon has four arcs
already, the "Bou Mie" seasons among them.

The arc and its cast are created in Studio (`routes/educator/story-arcs.ts`); the
lesson CSV has no arc field and cannot create one. Say so in the hand-off — the
arc and cast come first, then the chapters upload into their courses.

**Where the story chapters come from.** `assets/master-newcomer.md` carries the
Newcomer arc — a stranger arrives and becomes someone who can welcome the next
stranger — with the story beats for each Movement. Use it unless the user wants
something else. Its standing rule: **dialogue first**, the early Movements as
`skit` with `speaker` filled, narration entering only when there is something to
recount. Teaching traditions in these languages start with
call-and-response, and a narrative opening defers the learner's first question
form by several episodes.

**The other chapter types.** Story is 5 of 48; here is how the rest are built.

- **Vocabulary set** — one theme per chapter, 8–12 items. If the language has
  dictionary entries, pull them and **pre-fill `text`**, citing the source; the
  educator is then reviewing, not authoring. If it has none, the rows go out
  blank with the English meaning in `translation`.
- **Structure** — one grammar point per chapter, framed as a short exchange that
  demonstrates it rather than a rule explained. Put the point in `description`
  and the pattern in `canDo`.
- **Practice** — built from the chapters immediately before it. Never introduce
  new vocabulary in a practice chapter; if a word isn't in a preceding chapter it
  doesn't belong here.
- **Culture** — a proverb, a song, a custom, a place. Write the English framing
  freely; the cultural item itself is always `[[placeholder]]` unless the user
  supplies it. **Never compose a proverb or a blessing.**
- **Checkpoint** — a can-do review closing the band. Draws only on what the band
  covered; the `canDo` is the band's own promise restated.

**Placeholders, not guesses.** Cast names, proverbs, blessings, ceremony language
— leave them as `[[bracketed]]` notes describing what is needed. A `[[…]]` in a
transcript line also makes `db:guard-content` hold the lesson, so it fails safe
if one slips through unfilled.

**The instruction sheet.** Written for an educator who has never seen this
repo. Alongside the CSVs, as `userio-docs/<lang>-templates-README.md`:

- Which column to fill (`text`) and which to leave (`translation` is the English
  meaning; `speaker` is who says the line)
- **Fill every row.** A row with an empty `text` is dropped silently on import —
  a half-filled sheet becomes a short lesson and nobody is warned. State the row
  count per file so a short import is noticeable.
- Replace every `[[…]]` with real material, or delete the row. Never leave
  brackets in.
- Names: use names natural to the region. Keep one spelling per character across
  every file.
- Proverbs, blessings and ceremony language must be real and attributed — not
  composed for the lesson.
- How to upload: **Studio → Educator → Bulk Import**, pick the language and the
  course, then publish from the review queue.

## Hand off

Say what was written, how many rows per file, which episodes were skipped and
why, and how many lines are now briefed and ready for a speaker. Don't write to
the database, don't deploy.

**Report the count as an achievement, not a shortfall.** "312 lines briefed and
ready to fill, 41 of them needing the speaker's own words — the rest pre-filled
from the dictionary for review" is the shape. Not "312 lines still missing
Ịzọn." Same number, and only one of them is true to what happened.

**Then name the next empty Movement.** The owner's next decision is where to
point the following run, and the answer is whichever Movement has no brief at
all — not whichever has the most blanks.

## Files

- `references/world-architecture.md` — the ten Movements, eight Pillars, eight Places
- `assets/master-newcomer.md` — the ten-episode master story with beat sheets
