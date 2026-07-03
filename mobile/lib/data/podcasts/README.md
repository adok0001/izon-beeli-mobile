# Beeli Media Package (Podcasts · Films · Courses)

One coherent language world delivered three ways: a recurring-character **podcast**
season, a **film** mini-series, and structured **courses** — all sharing the same
cast, arc, and verified vocabulary. This directory is **self-contained and inert**:
nothing here is imported by existing app code, so adding it breaks nothing. An
integrator opts each piece in when it is recorded and verified.

> Folder is named `podcasts/` for historical reasons; it is now the package home for
> all three Izon-world content types.

```
podcasts/
├── podcast-types.ts      ← podcast schema (authoring superset) + adapters + validator
├── film-types.ts         ← film schema + DiscoverItem adapter + validator
├── course-types.ts       ← course typing (mirrors RawCourseEntry) + validator
├── README.md             ← you are here
├── SERIES-BIBLE.md       ← Izon world: cast, arc, episode/film/course list, verify ledger
├── CONTRIBUTOR-GUIDE.md  ← how to copy this for a new language
└── izon/                 ← the reference implementation
    ├── cast.ts           ← 7 recurring characters (shared across all three types)
    ├── beginner.ts       ← podcast episodes 1–3 (A1): skit / immersive / host-narrated
    ├── intermediate.ts   ← podcast episodes 4–6 (A2–B1)
    ├── advanced.ts       ← podcast episodes 7–9 (B1–C2)
    ├── films.ts          ← 3 films: documentary / narrative short / heritage
    ├── courses.ts        ← 3 courses (beg/int/adv) → LessonData + StoryArc
    └── index.ts          ← assembles everything + exposes app-shaped views
```

**One universe.** The three types interlock: the films slot between podcast episodes
(F2 "The Empty Net" sits between Eps 4 and 7; F3 dramatises the tale of Ep 8), and the
courses are the drill companion to the podcast situations (course lesson `izon-bmc-b1`
teaches the greetings of podcast Ep 1, etc.). Same Tari, same creeks, same proverbs.

## What a "podcast" is here

A **series** (`PodcastSeries`) is a season of **episodes** (`PodcastEpisode`). Each
episode has a rich HELPER **script** (speaker-labelled target-language dialogue +
`sfx`/`screen`/`pause`/`note` cues), plus pedagogy (hidden CEFR, target vocab, grammar,
cultural notes) and production notes (voices, sound design, visuals).

The **one inviolable rule** (from `userio-docs/BEELI_PODCAST_LESSON_TEMPLATE_v2.md`):
**no interface language is spoken in the audio.** English/French appear only on screen.

## How it fits the existing app schema

Every episode reduces to shapes the app already understands, via adapters in
`podcast-types.ts`:

| Podcast concept | App shape it maps to | Adapter |
|---|---|---|
| `PodcastEpisode` | `LessonData` (target-language `transcript`, `skills`, `duration`, `genre:"podcast"`) | `toLessonData()` |
| episode `script` | `TranscriptSegment[]` (pure Izon `text` + `translation`; cues stripped) | `toPlainTranscript()` |
| `PodcastSeries` (the season) | `StoryArc` + `StoryChapter[]` (chapters → lesson ids), like `stories/izon-basics.ts` | `toStoryArc()` |
| released series (Discover card) | `DiscoverItem` (`type: "podcast"`, shared `storyId`) | `toDiscoverItem()` |

So a podcast **is** a story-arc of lessons with a Discover card — the model the app
already has for "Tari's Journey Home" — just authored at higher fidelity.

**Films** (`film-types.ts`) map the same way to the Discover feed:

| Film concept | App shape | Adapter |
|---|---|---|
| `FilmItem` | `DiscoverItem` (`type:"film"`, `audioUrl`/`videoUrl`, `body`, `showNotes`, `duration`, `storyId`, `featured`) | `toFilmDiscoverItem()` |

The three films share a `storyId` (`story-izon-boumie-films`) so Discover groups them
as a mini-series. `toFilmDiscoverItem()` returns the **real** `DiscoverItem` type, so
any drift fails to compile.

**Courses** (`course-types.ts`) are already app-native — a course-registry entry
(`SeriesCourseEntry`, mirroring the unexported `RawCourseEntry` in `courses.ts`) + real
`LessonData[]` + a `StoryArc`. Nothing to down-convert; `validateCourse()` enforces the
discipline (language-prefixed ids, target-language transcript lines, skills tagged,
`isActive:false`).

## Wiring a series into the app (optional, per-series, when verified)

Nothing below is done automatically. When a series is recorded and `isActive` flips:

1. **Lessons** — in `lib/data/lessons/index.ts`, import and spread the podcast episodes
   and the course lessons:
   ```ts
   import { IZON_PODCAST_LESSONS, IZON_BM_COURSE_LESSONS } from "../podcasts/izon";
   export const ALL_LESSONS = [ …, ...IZON_PODCAST_LESSONS, ...IZON_BM_COURSE_LESSONS ];
   ```
2. **Courses** — in `lib/data/courses.ts`, spread `IZON_BM_COURSE_ENTRIES` into
   `RAW_COURSES` (lessonsCount is derived automatically from `ALL_LESSONS`).
3. **Story arcs** — in `lib/data/stories/index.ts`, register `IZON_PODCAST_STORY` and
   each of `IZON_BM_COURSE_STORIES` under their `courseId` in `STORY_REGISTRY`.
4. **Discover feed** — add `buildIzonPodcastDiscoverItem(publishedAt)` and the film
   cards `IZON_FILM_DISCOVER_ITEMS` to whatever feeds `useDiscover()`
   (see `lib/hooks/use-discover.ts`).

Until then the package just sits here, typechecked and ready. Run the validators in a
test — `IZON_MEDIA_ISSUES` (podcasts + films + courses combined) should have no
`error`-severity entries.

## Schema gaps (flagged, not silently worked around)

The app's shared types don't yet have a home for three things a character-driven
podcast needs. Rather than mutate `TranscriptSegment`/`Lesson` (and every language's
data) speculatively, the podcast layer carries them in its **authoring superset** and
drops them in the down-conversion. Recommended core additions, in priority order:

1. **`speaker?: string` on `TranscriptSegment`.** Without it the app can't show *who is
   talking* — essential for a recurring-cast drama. Today the speaker lives on
   `PodcastLine.speaker` and is dropped by `toPlainTranscript()`. This is the one worth
   adding first; the review that scoped this work confirmed there is no character
   entity, so the `speaker` label *is* the character model.
2. **`roman?: string` on `TranscriptSegment` (and `LessonWord`).** Romanized
   pronunciation guidance. Currently only in `PodcastLine.roman` / `VocabItem.roman`.
3. **`transcriptType?: "plain" | "helper"` on `Lesson`.** The v2 template distinguishes
   the published *plain* transcript (screen-safe, target-language only) from the
   *helper* script (production cues included). We model this with two functions —
   `toPlainTranscript()` (ships) and `toHelperScript()` (production/review) — but a
   field would let the app request either.

When these land: update the three functions in `podcast-types.ts` to pass the fields
through, and the podcast layer becomes a loss-less extension. All three are **additive
and optional** — safe, non-breaking migrations.

> There is deliberately **no** new character/persona table. Per the codebase review,
> recurring characters are modelled by the series `cast` + per-line `speaker` label.
> That is enough; a DB entity would be over-engineering for the content need.

## How verified is the Izon?

Lines are drawn from real, attributed sources already in the repo, and honesty about
uncertainty is a feature, not a weakness:

- **Attested, unflagged** — taken from `userio-docs/izon_master_dictionary.csv` (10k+
  entries from dated community lesson notes), `mobile/lib/data/lessons/izon-*.ts`,
  `sentences/izon.ts`, `proverbs/izon.ts`, `cultural/izon.ts`.
- **`verify: true`** — plausible recombinations of attested morphemes that a native
  Kolokuma speaker must confirm (spelling, tone, idiom) before recording.
- **`[[bracketed placeholders]]`** — content with no attested form, chiefly **heritage**
  (the Woyengi creation narrative, the festival libation). These are **never
  fabricated**; they must be sourced verbatim from a verified elder / Egbesu or Ekine
  authority, with credit.

Dialect anchor: **Kolokuma**, the Izon education standard (Bayelsa). Orthography follows
the corpus: dotted vowels `ọ ị ẹ ụ`, doubled long vowels, `n` for nasalization, acute
for high tone. **Every episode is `isActive: false`** until recorded and verified — see
`SERIES-BIBLE.md → Heritage & Verification Ledger`.

## Adding a language

See `CONTRIBUTOR-GUIDE.md`. Short version: copy `izon/`, rename ids to your `<langid>`,
recast the seven archetypes once (they are shared across podcast, films, and courses),
re-plot the podcast 9-cell grid + 3 films + 3 courses with *authentic* situations, keep
all interface language out of the audio, and never invent the target language.
