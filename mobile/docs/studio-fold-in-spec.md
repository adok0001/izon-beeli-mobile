# Studio Fold-In (Option A) — Spec

**Status:** Draft for review · **Date:** 2026-07-08 · **Scope:** mobile Studio (educator/admin) + server contract

## 1. Goal

Make every piece of content reachable and editable by walking the hierarchy it
actually lives in — `Language → Course → Lesson → { facets }` — instead of a flat
menu of content *types* that point at each other by opaque ID.

Concretely: **retire the standalone Stories silo.** A "story" is not a content
type; it is narrative framing on a course and its lessons (the `story_arcs` row is
already keyed 1:1 by `courseId`, and each chapter already maps 1:1 to a lesson).
Fold that framing into the surfaces that already own the course and the lesson.

Non-goal for this spec: authoring branching `InteractiveStory` scenes (a separate
Discover-side content type with no editor — tracked separately, see §11).

## 2. The model today vs. after

| Concept | Today (type-siloed) | After fold-in |
| --- | --- | --- |
| Course narrative title/desc ("Bou Mie: The Keeper's Words") | `story_arcs` row, edited in `story-edit.tsx` | **Narrative** section on the Course editor |
| Chapter title | `story_chapters.title` (dup of lesson title) | the lesson's own title |
| Chapter order | `story_chapters.order` (dup of lesson order) | the lesson's own `order` |
| Chapter narrative intro/outro | `story_chapters.narrative_intro/outro` | **Narrative** section on the Lesson editor |
| Chapter → lesson link | `story_chapters.lesson_id` (opaque picker) | implicit: the lesson *is* the chapter |
| Lesson script / audio / cultural | Lesson editor (already) | unchanged, same screen |
| Authored quiz questions | `quiz_questions` keyed by `languageId` only, orphaned from the player | optional **Quiz** facet on the Lesson (see §7) |

**Result:** `story_chapters` collapses entirely into lesson columns + lesson order.
`story_arcs` shrinks to `(course_id, title, description)` — the per-course narrative
wrapper — and is edited from the Course, never from a separate screen.

## 3. Data model changes

### 3.1 Server (source of truth)

**`lessons`** — add two nullable columns:

```sql
ALTER TABLE lessons
  ADD COLUMN narrative_intro text,
  ADD COLUMN narrative_outro text;
```

**`story_arcs`** — unchanged shape `(course_id PK/FK, title, description, updated_at)`.
It stays as the course-level narrative wrapper. A course "is a story" iff a
`story_arcs` row exists for it.

**`story_chapters`** — **retired.** Migration (§8) copies each chapter's
`narrative_intro/outro` onto its `lesson_id`, then drops the table. `title`/`order`/
`lesson_id` are discarded (already represented by the lesson).

**`quiz_questions`** (optional Quiz facet, §7) — add nullable link:

```sql
ALTER TABLE quiz_questions ADD COLUMN lesson_id text REFERENCES lessons(id);
```

### 3.2 Client types

`lib/hooks/educator/use-lessons.ts` — extend the lesson interfaces:

```ts
export interface EducatorLesson {
  // …existing…
  narrativeIntro?: string | null;   // NEW
  narrativeOutro?: string | null;   // NEW
}
// CreateEducatorLessonInput / update payload gain the same two optional fields.
```

`lib/hooks/educator/use-story-arcs.ts` — `EducatorStoryChapter` and the
`useReplaceStoryChapters` hook are **removed**. `EducatorStoryArcDetail.chapters`
is removed. `useEducatorStoryArc(courseId)` now returns just
`{ courseId, title, description }` and is consumed by the Course editor. Keep
`useCreateStoryArc / useUpdateStoryArc / useDeleteStoryArc`.

## 4. Navigation / IA

No new tab. The existing home (`Learn / Explore / Tools`) already routes
`Learn → course`. Changes:

- **Course carousel / list** row → opens the **Course editor** (modal today via
  `CourseEditModal`; promote to a full screen, see §6) which now shows Narrative +
  the lessons list inline.
- Each **lesson row** → opens the **Lesson editor** (`lesson-edit.tsx`) which now
  has Narrative + optional Quiz sections.
- **Tools strip** (`components/studio/panel-nav-sections.tsx:309`): remove the
  `Stories` pill. `Quiz Bank` stays only if we keep a language-level bank view
  (§7); otherwise it also folds into the lesson.

## 5. The Lesson editor (the "hub")

`lesson-edit.tsx` is already a single ScrollView of stacked cards with one Save:
`Lesson Details → Audio → Transcript Segments → Cultural Content → Preview →
Publish`. Add two cards, gated so they only appear when relevant:

### 5.1 Narrative card (new)

- **Shown when** the lesson's course has a `story_arcs` row (i.e. the course is a
  story). Otherwise hidden — a plain course's lessons don't show narrative fields.
- Two multiline inputs: **Narrative intro**, **Narrative outro** — identical to the
  old `ChapterEditor` fields (`app/(tabs)/educator/story-edit.tsx:104-129`), same
  i18n keys (`educator.story.chapterNarrativeIntro/OutroLabel`).
- Persists via the existing lesson update (`useUpdateEducatorLesson`, new payload
  fields) — folded into the screen's existing Save, no separate mutation.

### 5.2 Quiz card (new, optional — see §7)

- Lists authored `quiz_questions` where `lesson_id = this lesson`, with add/edit/
  delete reusing the existing quiz editor UI from `quiz-bank.tsx`.
- Gated behind the server work in §7; ship §5.1 first.

Placement: Narrative directly under **Lesson Details** (it's framing, read first);
Quiz after **Transcript Segments** (questions derive from the script).

## 6. The Course editor

Today `CourseEditModal` (`components/studio/course-editor.tsx`) is a modal with
ID / Title / Description / Level / Emoji / Type / Order, and the lessons list lives
on a *separate* screen (`lessons.tsx`). Fold-in wants narrative + lessons in one
place. Two options:

- **6a (recommended):** Promote the course editor to a full screen that stacks:
  `Course Details (existing modal fields) → Narrative (arc title/description +
  "This course is a story" toggle) → Lessons (the draggable list from lessons.tsx,
  each row = a chapter; drag = reorder = chapter order) → New lesson CTA`.
- **6b (smaller):** Keep the modal for details; add a "Narrative" collapsible to
  the existing `lessons.tsx` header (which already lists lessons for the course).
  Less unification but far less churn.

**Narrative subsection fields:** `arc.title`, `arc.description`, and a toggle that
creates/deletes the `story_arcs` row (`useCreateStoryArc` / `useDeleteStoryArc`).
When off, the course is a normal course and lesson Narrative cards (§5.1) hide.

## 7. Quiz facet (optional sub-track — reconnects orphaned content)

Findings: authored `quiz_questions` are keyed by `languageId` only and the learner
quiz is **generated at runtime** by `lib/quiz-engine.ts` from dictionary/sentence
data — so hand-authored questions never reach the player. This sub-track fixes that.

1. Add `lesson_id` to `quiz_questions` (§3.1) + `useEducatorQuizBank` variant
   filtered by `lessonId`.
2. Quiz card on the Lesson (§5.2).
3. Runtime: `app/quiz.tsx` / `quiz-engine.ts` prefer authored questions for the
   `lessonId`, falling back to generated ones to fill `questionCount`.

**Depends on server confirmation** that quiz-bank questions are indeed unused by the
player (verify before touching the engine). Shippable independently of §5.1/§6.

## 8. Migration

1. Ship server columns (`lessons.narrative_intro/outro`; later `quiz_questions.lesson_id`).
2. Backfill: for each `story_chapters` row, copy `narrative_intro/outro` onto
   `lessons WHERE id = chapter.lesson_id`. Log any chapter whose `lesson_id` is null
   or dangling (orphan narrative — surface for manual reassignment, don't drop
   silently).
3. Verify counts match, then drop `story_chapters`.
4. `story_arcs` untouched.

## 9. Backward compatibility & the learner runtime

- Confirm how the **learner** renders a story today (does anything read
  `story_chapters`? `GET /story-arcs/:id` shape?). The server must expose narrative
  from lessons (`GET /courses/:id` including per-lesson `narrativeIntro/Outro` +
  the arc title/description) so the learner story player keeps working after the
  chapter table is dropped. **This is the top pre-implementation unknown.**
- Offline snapshot (`lib/content-snapshot.ts`) — regenerate if it embeds chapters.

## 10. Endpoint summary

| Endpoint | Change |
| --- | --- |
| `PATCH /educator/lessons/:id` | accept `narrativeIntro`, `narrativeOutro` |
| `POST /educator/lessons` | accept the same two fields |
| `PUT /educator/story-arcs/:id/chapters` | **removed** |
| `GET /educator/story-arcs/:id` | return `{courseId,title,description}` (no chapters) |
| `GET /courses/:id` (learner) | include per-lesson narrative + arc title/desc |
| `quiz-bank/admin` (§7) | add `lessonId` to shape + `?lessonId=` filter |

## 11. File-by-file change list (mobile)

**Removed**
- `app/(tabs)/educator/story-edit.tsx`
- `app/(tabs)/educator/story-new.tsx`
- `app/(tabs)/educator/stories.tsx`
- `ChapterEditor` and story-chapter code paths

**Changed**
- `lib/hooks/educator/use-lessons.ts` — narrative fields on types + payloads
- `lib/hooks/educator/use-story-arcs.ts` — drop chapter types + `useReplaceStoryChapters`
- `app/(tabs)/educator/lesson-edit.tsx` — Narrative card (§5.1), Quiz card (§5.2)
- `components/studio/course-editor.tsx` (+ `lessons.tsx`) — Narrative subsection & lessons fold-in (§6)
- `components/studio/panel-nav-sections.tsx` — remove `Stories` (and maybe `Quiz Bank`) from Tools
- `app/quiz.tsx`, `lib/quiz-engine.ts` — authored-question preference (§7)
- locales `en/fr/ar/pt/pcm.ts` — reuse existing story narrative keys; remove dead story-screen keys last

**Kept**
- `story_arcs` table + create/update/delete hooks
- All lesson script/audio/cultural code

## 12. Phasing (each phase ships on its own; builds on the C cross-link already shipped)

- **P0 (done):** C cross-link — chapter's lesson row deep-links into the lesson.
- **P1:** Server `lessons.narrative_intro/outro` + Narrative card on the Lesson
  editor (§5.1). Story-edit still exists but its narrative fields become read-only
  mirrors that point to the lesson. *Value: narrative editable where the lesson is.*
- **P2:** Narrative subsection on the Course (§6), migrate chapters → lessons (§8),
  drop `story_chapters`, delete the three story screens (§11). *Value: silo retired.*
- **P3 (optional):** Quiz facet + engine reconnect (§7). *Value: authored questions
  reach the player.*

## 13. Open decisions

1. **§6a vs §6b** — full course screen vs. modal + collapsible. (Recommend 6a.)
2. **Quiz Bank fate** — keep a language-level bank view alongside the per-lesson
   facet, or fold entirely into lessons? (Recommend: keep a read-only language view
   for cross-lesson reuse; author per-lesson.)
3. **Non-story courses** — hide Narrative cards entirely, or show a dimmed "Make
   this a story" affordance? (Recommend: toggle on the course; hidden on lessons
   until on.)
4. **Learner contract (§9)** — confirm nothing learner-side reads `story_chapters`
   before P2. **Blocking for P2.**

## 14. Risks

- **Learner runtime coupling to `story_chapters`** (§9) — the one thing that can
  break users. Gate P2 on confirming the learner reads narrative from lessons.
- **Orphan chapters** during migration (dangling `lesson_id`) — surface, don't drop.
- **Scope creep from Quiz** — keep §7 as an independent track so P1/P2 aren't blocked
  by the engine work.
