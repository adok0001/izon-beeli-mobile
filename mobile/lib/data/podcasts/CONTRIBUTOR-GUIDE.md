# Contributor Guide — Add a Podcast Series in a New Language

This package is a **template** for three interlocking content types — a **podcast**
season, a **film** mini-series, and structured **courses** — all sharing one cast and
world. The Izon world *Bou Mie / The Long Way Home* (`izon/`) is the reference
implementation; you build a new language by copying its shape and replacing the
content. You should not need to touch `podcast-types.ts`, `film-types.ts`, or
`course-types.ts` — only the `izon/` data files.

**Time to a minimum viable world:** the 3 beginner podcast episodes for one language.
Add the films, the courses, and the intermediate/advanced episodes as your community
contributors supply verified material. The seven **archetypes** in `cast.ts` are shared
across all three content types — recast them once.

---

## 0. Before you write a single line — the two laws

1. **No interface language is ever spoken.** English/French exist only on screen
   (card `title`/`description`, `translation` glosses, `culturalNotes`). Every
   `dialogue`/`narration` line's `text` is **target language only**. This is the core
   design principle of `userio-docs/BEELI_PODCAST_LESSON_TEMPLATE_v2.md` — read it once.
2. **Never fabricate the language.** Draw words from a verified source (a dictionary,
   community lesson notes, a native educator). Where you don't have an attested form,
   write a `[[bracketed English placeholder]]` and set the line `verify: true`. Any
   episode containing a placeholder or an unverified line **must** stay
   `isActive: false`. The validator enforces this.

If you honour nothing else, honour these two.

---

## 1. Copy the folder

```
cp -r lib/data/podcasts/izon lib/data/podcasts/<langid>
```

`<langid>` **must** match the app's language registry id (e.g. `yoruba`, `hausa`).
Then, in every file, replace:

- the series id `izon-pod-longwayhome` → `<langid>-pod-<slug>`
- every episode id `izon-pod-b1 …` → `<langid>-pod-b1 …` (IDs must be
  **language-prefixed and globally unique**, per `lessons/TEMPLATE.ts`)
- every `cast id` `izon-cast-*` → `<langid>-cast-*`
- `languageId: "izon"` → `languageId: "<langid>"`
- `courseId: "course-izon-*"` → the target language's real course ids

---

## 2. Recast the seven archetypes

Keep the **archetypes**, rename to real names and roles for the culture. The minimum
viable cast is: a **returnee/learner-surrogate**, a **keeper-elder**, a **peer**, a
**livelihood figure**, and a **ceremonial authority**. Fill `cast.ts`:

```ts
{
  id: "<langid>-cast-<name>",
  name: "…",                 // a real, common name in the culture
  role: "…",                 // one line
  persona: "…",              // age band + register (guides casting + vocab level)
  relationships: "…",        // how they connect to the others (kinship/community)
  culturalNote: "…",         // real-world grounding for this archetype
  voice: "…",                // casting + direction brief for the producer
  levels: ["beginner", …],
}
```

> There is **no character/persona entity in the app database** (see
> `README.md → Schema gaps`). Recurring characters live *here* — in the series `cast`
> plus the `speaker` label on each line. That is deliberate and sufficient; you do not
> need a DB migration to ship a series.

---

## 3. Re-plot the season for *your* culture

Do **not** transplant Izon customs. The *structure* is portable; the *content* is not.
Keep the emotional spine (a learner-surrogate is welcomed home/in by a keeper-elder and
rises to belonging) and the **9-cell grid** (3 levels × skit/immersive/host-narrated),
but replace every situation with what is authentic for the culture:

| Grid cell | Izon used… | You choose… |
|---|---|---|
| Beginner · skit | arrival at a creek jetty | your culture's true "arrival" |
| Beginner · immersive | compound, kitchen, banga soup | your home & staple foods |
| Beginner · host-narrated | the waterside market, base-20 counting | your market & number system |
| Interm. · skit | dawn fishing, the thinning catch | your core livelihood |
| Interm. · immersive | the Ekine water-spirit masquerade | your signature festival/art |
| Interm. · host-narrated | a marriage negotiation | your union/rite customs |
| Adv. · skit | a dispute settled by proverb | your justice/oratory |
| Adv. · immersive | the Woyengi creation story | your origin story (from a keeper) |
| Adv. · host-narrated | festival libation, a first praise | your highest ceremonial speech |

Vary style **and** length meaningfully: short skit (~6–9m), medium immersive
(~12–15m), long host-narrated (~16–19m).

---

## 4. Write each episode

Fill the `PodcastEpisode` fields (types in `../podcast-types.ts`). The load-bearing ones:

- **Metadata:** `title`/`description` (interface language — what the learner can *do*),
  `logline`, `level`, `style`, `length`, `targetMinutes`.
- **Hidden pedagogy** (never shown as a learner-facing level): `cefr`, `movementId`,
  `pillars`, `place` (the Living-Culture axes from the design-course blueprint),
  `skills`, `newVocabTarget`, `recycledFrom` (spaced repetition — recycle ≥3 earlier
  items).
- **`targetVocab`** — every item with `izon`/`roman`/`gloss{en,fr}` and a `source`
  (dictionary/lesson note) or `verify: true`.
- **`grammarPoints`** — taught by pattern, with examples; remember the app teaches
  grammar by *visual alignment*, not spoken metalanguage.
- **`culturalNotes`** — customs, food, geography, music, proverb. Attribute heritage.
- **`script`** — the HELPER script: `dialogue`/`narration` lines (target language +
  `roman` + `translation`) interleaved with `sfx` / `screen` / `pause` / `note` cues.
  This is what a producer records; `toPlainTranscript()` strips the cues for the app.
- **`production`** — `voices` (casting/direction), `soundDesign`, `music` (none under
  speech), `visuals` (screen-sync).
- **`isActive: false`** and **`sources[]`** (always).

**Line kinds** (`kind`): `dialogue`, `narration` (kept in the published transcript);
`sfx`, `screen`, `pause`, `note` (stripped — production/screen cues only).

**Romanization:** put reader-friendly pronunciation in `roman` (e.g. `"TOO-bah-rah"`).
The app's `TranscriptSegment` has no pronunciation field yet, so `roman` currently
lives only in this authoring layer — see `README.md → Schema gaps`.

---

## 5. Assemble & validate

Edit `<langid>/index.ts` to point at your files, then wire the validator into a test:

```ts
import { IZON_PODCAST_ISSUES } from "./<langid>";   // rename export
// expect IZON_PODCAST_ISSUES.filter(i => i.severity === "error") to be empty
```

`validatePodcast()` checks: language-prefixed ids, non-empty spoken `text`, en gloss
present, `roman` present, and — critically — that any placeholder/unverified content
forces `isActive: false`.

---

## 6. Hand off for verification (do NOT skip)

Everything ships `isActive: false`. Before any episode goes live:

- a **native speaker** records it and confirms every `verify: true` line;
- **heritage content** (creation story, libation, sacred song, praise oratory) is
  sourced **verbatim from a community/religious authority**, with permission and
  credit — never authored by us;
- the producer follows `production` and the v2 template's audio standards.

A series that ships slower but true is the only acceptable kind. Rushing fabricated
heritage to `isActive: true` is the worst outcome for the learner and the community.

---

---

## 7. Add the three films (`<langid>/films.ts`)

Films are `FilmItem`s that down-convert to Discover cards via `toFilmDiscoverItem()`.
Vary the three meaningfully and tie them to the world:

- **Documentary** (short) — an observational piece on livelihood/land, narrated by a
  cast elder. (Izon: *The Creeks Remember*.)
- **Narrative short** (medium) — a self-contained story using the cast, ideally slotting
  between podcast episodes. (Izon: *The Empty Net*, between Eps 4 & 7.)
- **Heritage film** (short–medium) — dramatises a sacred story/custom the podcast
  references. **Heritage narration is a `[[placeholder]]` sourced from a keeper.** (Izon:
  *Woyengi*, the Ep-8 tale on screen.)

Each film carries a `script` (narration/dialogue in the target language + `roman` +
`translation`, plus `sfx`/`screen`/`chapter`/`note` cues), a `synopsis`, `culturalNotes`,
`production` notes, and `body`/`showNotes` (the Discover long-text + credits). Give
related films a shared `storyId` so they group as a mini-series. All `isActive:false`.

## 8. Add the three courses (`<langid>/courses.ts`)

Courses are the drill companion — Beeli's real `Course → Lesson → TranscriptSegment`
schema, one per level, tied to the same situations as the podcast. For each:

- a `SeriesCourseEntry` (`id: course-<langid>-<slug>`, `languageId`, `title`,
  `description`, `level`, `order`, `courseType`). **Use the `CourseType` enums where they
  fit** — the Izon world uses `communicative` (beginner), `everyday_life` (intermediate),
  `oral_tradition` (advanced). Pick what matches your content (also available:
  `first_words`, `sound_script`, `numbers_trade`, `songs`, `colors`, `house`, `community`,
  `work`, `grammar`, …).
- several `LessonData` lessons — **language-prefixed ids** (`<langid>-…`), a
  target-language-only `transcript` (each segment `text` = target language, `translation`
  = `{en,fr}`), and `skills` tagged.
- a `StoryArc` grouping the lessons into chapters.

> The app's `TranscriptSegment` has no per-line `verify`/`roman` field, so course lessons
> can't flag individual lines. Keep transcript lines to **attested** phrases where you
> can, put unattested heritage in `[[placeholders]]`, and hold the whole course
> `isActive:false` until a native speaker records it. Romanization for these lines lives
> in the parallel podcast/course-vocab material.

Wire them up in `<langid>/index.ts` and assert `validateFilms(...)` / `validateCourse(...)`
return no `error`-severity issues.

---

## Checklist (per episode)

```
□ id is <langid>-prefixed and globally unique
□ languageId matches the app registry; courseId is a real course
□ NO interface language in any dialogue/narration `text`
□ every spoken line has roman + translation.en (+ .fr)
□ unattested forms are [[placeholders]] and/or verify:true
□ episode is isActive:false; sources[] filled
□ ≥3 recycled items from earlier episodes (recycledFrom)
□ style & length distinct within the level
□ heritage content attributed and flagged for authority verification
□ validatePodcast() returns no `error`-severity issues
```

## Checklist (per film)

```
□ id is <langid>-film-… ; kind is documentary / narrative_short / heritage
□ NO interface language in any narration/dialogue `text`
□ every spoken beat has roman + translation.en (+ .fr)
□ synopsis, body, showNotes filled; culturalNotes attributed
□ related films share a storyId (mini-series grouping)
□ heritage narration is a [[placeholder]] for a keeper; isActive:false
□ validateFilms() returns no `error`-severity issues
```

## Checklist (per course)

```
□ course id is course-<langid>-… ; courseType is a valid enum that fits
□ every lesson id is <langid>-prefixed; lesson.courseId == course id
□ transcript `text` is target-language only; translation has en (+ fr)
□ each lesson has skills tagged and isActive:false
□ lessons grouped into a StoryArc (chapters → lessonIds)
□ unattested heritage lines are [[placeholders]]
□ validateCourse() returns no `error`-severity issues
```
