# Interactive Story Editor — Scope

**Status:** Draft for review · **Date:** 2026-07-08 · **Scope:** the genuinely missing surface — authoring `InteractiveStory` scene graphs (e.g. `izon-empty-net`, `izon-woyengi`, `izon-creeks`).

## 1. What's missing today

Interactive stories are a real, shipped **learner** feature — a branching scene player
(`app/discover-story/[id].tsx`) fed by `GET /interactive-stories`. But there is **no
authoring surface anywhere** in Studio or Admin: a repo-wide write-side search for
`StoryScene` / `nextSceneId` / `scenes:` in editor code returns nothing. Scenes and
choices are authored server-side / seed only.

Concretely: in `Admin → Culture Content`, a film's **Story Link** field lets you
*point* at `izon-empty-net`, but you cannot edit what that story *is*. This scopes the
editor that fills the gap.

## 2. Data model (exact — `types/index.ts:616-646`)

```ts
type StorySceneType = "narrative" | "choice" | "conclusion" | "skit"; // "skit" added §2.1

interface StoryChoice { id: string; text: string; nextSceneId: string; }

interface StoryScene {
  id: string;
  type: StorySceneType;
  gradient: [string, string];   // 2-colour background — FALLBACK once media exists
  backgroundEmoji: string;      //                        FALLBACK once media exists
  title?: string;
  text: string;
  choices?: StoryChoice[];      // choice scenes
  nextSceneId?: string;         // narrative + skit scenes
  lines?: SkitLine[];           // NEW §2.1 — present when type === "skit"
  media?: SceneMedia;           // NEW §2.2 — optional motion/visual layer
}

// §2.1 — a skit is a narrative scene whose body is dramatized dialogue.
// Mirrors the podcast PodcastLine / TranscriptSegment shape (speaker + gloss).
interface SkitLine {
  speaker: string;              // cast id ("izon-cast-timi") or free-text name
  text: string;                 // TARGET language
  translation: LocalizedText;   // en + fr gloss (forces LocalizedText — see decision #1)
  audioUrl?: string; startTime?: number; endTime?: number; // voiced skits (S4)
}

// §2.2 — optional motion layer; gradient + emoji remain the graceful fallback.
interface SceneMedia {
  kind: "image" | "gif" | "video" | "lottie";
  url: string;                  // from the Media Library
  fit?: "cover" | "contain";
  loop?: boolean;               // gif / video
  poster?: string;              // first frame — offline & reduced-motion fallback
}

interface InteractiveStory {
  id: string;
  title: string;
  description: string;
  coverGradient: [string, string];
  coverEmoji: string;
  estimatedMinutes: number;
  author: string;
  language?: string;
  initialSceneId: string;
  scenes: Record<string, StoryScene>;
}
```

Player semantics that constrain the editor (`discover-story/[id].tsx:220-256`):
- Playback starts at `initialSceneId`.
- `narrative` → auto-advances to `nextSceneId` on tap.
- `choice` → after ~700ms shows the choice overlay; each choice jumps to its `nextSceneId`.
- `conclusion` → terminal, no outgoing link.

## 3. The hard part: graph integrity

This is the whole reason a dedicated editor beats raw-JSON editing. The editor must
validate the scene graph continuously and block publish on any violation:

| Rule | Severity |
| --- | --- |
| `initialSceneId` is set and resolves to a real scene | error |
| every `narrative` scene has a `nextSceneId` that resolves | error |
| every `choice` scene has ≥ 2 choices, each `nextSceneId` resolves | error |
| every `conclusion` scene has **no** `nextSceneId` / `choices` | error |
| no scene links to a missing id (dangling edge) | error |
| every scene is reachable from `initialSceneId` (no orphans) | warning |
| at least one `conclusion` reachable (story can end) | warning |
| `gradient` / `coverGradient` are 2 valid colours; `backgroundEmoji` present | error |
| `text` non-empty per scene; `estimatedMinutes` > 0 | error |
| choice `text` non-empty; scene `id`s unique | error |
| `skit` scene has ≥ 1 line; each line has `text` + `translation.en`; advances via `nextSceneId` (or is a choice) | error |
| `skit` line `speaker` set (cast id or name) | warning |
| `media.url` resolves; `video` media has a `poster` (offline / reduced-motion) | error |
| `media.kind === "video"` on a story shipped offline — flag as online-only | warning |

Implement as one pure `validateStory(story): {errors[], warnings[]}` in
`lib/interactive-story-validate.ts` — reused by the editor's live panel, the publish
gate, and ideally server-side on write.

## 4. Server contract (new admin endpoints)

Mirror the culture-content pattern (`/culture-items/admin`). The **read** routes
already exist (`/interactive-stories`, `/interactive-stories/story/:id`).

| Endpoint | Purpose |
| --- | --- |
| `GET /interactive-stories/admin` | list incl. inactive/draft (author view) |
| `POST /interactive-stories/admin` | create story (metadata + scenes) |
| `PATCH /interactive-stories/admin/:id` | update metadata and/or `scenes` map |
| `DELETE /interactive-stories/admin/:id` | delete |
| (optional) `POST …/:id/publish` | status flip if we adopt the four-eyes workflow |

Scenes persist as the whole `scenes` map on the story (single document), matching how
`toApiInteractiveStory` reconstructs it (`content-snapshot.ts:50`). No per-scene table
needed — the graph is small and always edited as a unit.

Server should run `validateStory` and reject invalid graphs (defense in depth); the
snapshot generator already round-trips this exact shape.

## 5. Client hooks (`lib/hooks/educator/use-interactive-stories.ts`, new)

```ts
useEducatorInteractiveStories()          // GET /interactive-stories/admin
useEducatorInteractiveStory(id)          // reuse story/:id or admin/:id
useCreateInteractiveStory()              // POST
useUpdateInteractiveStory()              // PATCH  { id, patch }
useDeleteInteractiveStory()              // DELETE
```

All keyed under `["educator","interactive-stories", …]`, invalidating the learner
`["interactive-stories"]` / `["interactive-story", id]` caches on success so edits
show immediately.

## 6. Editor UX

Three screens, Museum design system, matching the existing Studio editors.

### 6.1 Story list — `app/admin/interactive-stories.tsx`
List of stories (title, cover emoji, language, scene count, a validity chip: ✓ /
⚠ n issues). `+ New`, Edit, Delete. Reuses the card/row idiom from
`culture-content.tsx`.

### 6.2 Story editor — `app/admin/interactive-story-edit.tsx`
Stacked sections (one Save), like `lesson-edit.tsx`:

1. **Story details** — title, description, author, language picker, `estimatedMinutes`,
   `coverEmoji`, `coverGradient` (two colour swatches).
2. **Start scene** — picker over existing scene ids → `initialSceneId`.
3. **Scenes (the graph)** — a list of SceneCards. Each card shows: type pill, emoji,
   title/first line, and its **outgoing edges** ("→ scene-3", or choices
   "A → s4 · B → s7"). Badges: `START` on the initial scene; `⚠ dangling` /
   `orphan` inline. Add scene, reorder (cosmetic), delete (with edge-repair prompt).
4. **Validation panel** (sticky) — live `errors` / `warnings` from `validateStory`;
   Save allowed with warnings, **blocked on errors**.
5. **Preview** — push the real player (`discover-story/[id]`) against the draft.

### 6.3 Scene editor (modal / pushed) — `components/studio/scene-editor.tsx`
- **Type** toggle: Narrative · Skit · Choice · Conclusion (switching prunes now-invalid
  fields — e.g. Choice→Narrative drops `choices`, adds `nextSceneId`).
- `title?`, `text` (multiline), **Background** (see 6.4), plus per-type controls:
- **Narrative:** one **Next scene** picker (dropdown of scene ids + "＋ new scene").
- **Skit:** a **line list** (see 6.5) + one **Next scene** picker (skits advance like
  narrative, or lead into a choice scene).
- **Choice:** a list of choices — each `text` + **Next scene** picker; add/remove; min 2.
- **Conclusion:** no outgoing controls.
- Every scene-picker offers "create a new scene" inline so authors build forward
  without leaving the flow; new scenes get a generated id (`scene-{n}`).

### 6.4 Background control — gradient · emoji · **media**
Replaces the bare gradient/emoji inputs with a **Background** control on every scene:

- Default state = the two gradient swatches + emoji (today's look, the fallback).
- A **"＋ Add motion / image"** button opens the **Media Library**
  (`app/admin/media.tsx`, already built) to pick or upload an asset → sets
  `scene.media`. Shows an inline preview (animated for gif/webp via `expo-image`).
- `fit` (cover/contain) and `loop` toggles; for `video`, a **required poster** picker
  (used offline & under reduced-motion). Clear-media returns to gradient+emoji.

### 6.5 Skit line list (reuses the lesson segment editor)
The skit body is the **segment editor you already have** (`SegmentItem` in
`lesson-edit.tsx`) with one added field: a **speaker** picker over the story's
language **cast** (`IZON_CAST` etc., `lib/data/podcasts/izon/cast.ts`) with a
free-text fallback. Each line: speaker · target `text` · `translation` (en/fr) ·
optional audio + timings (S4). Add/remove/reorder as with segments.

## 7. Studio nav placement

Add an **Interactive Stories** entry to the admin side of the Explore section
(`components/studio/panel-nav-sections.tsx` `ExploreSection`, near "Discover"),
`badge="Admin"`. The culture-content **Story Link** picker is unchanged — it keeps
*linking* films/podcasts to stories; this editor authors the stories it links to.

## 8. Reuse

- **Player as preview** — no new render code; drive `discover-story/[id]` with the draft.
- **Card/list/search idiom** — from `culture-content.tsx`.
- **Stacked-section + Save + status/publish** — from `lesson-edit.tsx` (and the
  `usePublishContent` workflow if we gate stories too).
- **Gradient/emoji inputs** — from the course/culture cover controls.
- **Skit line editor** — the lesson `SegmentItem` editor + a speaker picker (6.5).
- **Media Library** — `app/admin/media.tsx` + `use-media-assets` already upload/browse
  images; GIF/WebP ride the existing image path. Video is a new `kind` (S4, §11).
- **Animated rendering** — `expo-image` (animated gif/webp, in deps) for backdrops;
  `expo-av` `Video` (already used for lesson audio) for motion picture.

## 9. Phasing

Skits and motion both land in the **player**, and converge with audio in S4 — that
convergence is the "motion comic / FMV" milestone. Sequence accordingly:

- **S1 — Read-only admin list + preview.** Ship `/interactive-stories/admin` list and
  reuse the player as preview. *Value: stories become visible/inventoried in Studio.*
- **S2 — Metadata editor.** Title/description/cover/start-scene/minutes. *Value: fix
  copy & covers without touching scenes.*
- **S3 — Scene graph editor + text skits + GIF/image backdrops.** The core: scene CRUD,
  choice editing, `validateStory` + publish gate; **skit scenes** (text lines + speaker,
  reusing the segment editor); **animated-image/GIF backdrops** (`expo-image`, rides the
  existing Media Library image path, offline-cacheable). All cheap and offline-safe.
  *Value: the missing surface exists — and it's already rich.*
- **S4 — The motion wave.** Everything that needs the silent, offline-first player to
  grow: **video backdrops** (new Media Library `kind`, `expo-av` `Video`, poster +
  reduced-motion + online-only handling), **voiced skit audio** (per-line timings),
  and the **`LocalizedText` migration** for dialogue/scene text. Grouped because
  audio-in-player, video, and gloss are one body of work — see §10 #1.

## 10. Open decisions

1. **Localization.** Scene `text`/`title`/choice `text` are plain `string` today, but
   the story has a `language?` field and the app is multilingual. Author single-language
   per story (simplest, matches current data), or migrate scene text to `LocalizedText`
   (bigger; touches the player and snapshot)? **Recommend single-language per story for
   S3; revisit in S4.** Note: **skit lines force the issue early** — dialogue needs an
   en/fr gloss (`SkitLine.translation: LocalizedText`), so even the S3 single-language
   story has bilingual *skit* lines. Keep narrative/choice text single-language in S3.
5. **Asset production, not code, is the real pace-setter.** Motion at every scene is an
   asset-authoring commitment (someone makes the GIFs/clips). The editor should make
   media **optional per scene** (gradient+emoji fallback) so stories ship without it and
   gain motion incrementally.
6. **Skit reuse vs. divergence.** Reuse `TranscriptSegment`/`SegmentItem` verbatim, or
   fork a lighter `SkitLine`? **Recommend reuse** — the shapes match and the player
   already renders `speaker`.
2. **Publish workflow.** Adopt the `ContentStatus` four-eyes flow (like lessons/quiz) or
   a simple active/inactive toggle (like culture-items)? **Recommend match culture-items
   (active toggle) — stories are admin-authored.**
3. **Where it lives.** Admin-only under Explore (recommended), or expose to trusted
   educators later?
4. **Delete-scene edge repair.** On deleting a scene that others point to, prompt to
   repoint or convert those edges — never leave dangling silently.

## 11. Risks

- **Invalid graphs reaching the player** — mitigated by shared `validateStory` on both
  client publish-gate and server write. The player already assumes well-formed graphs
  (`story.scenes[id]` with no guard, `[id].tsx:321`), so a bad graph = soft-lock. This
  is the #1 correctness risk.
- **Snapshot drift** — the offline snapshot embeds full stories
  (`content-snapshot.ts:89`); regenerate after edits or stale stories play offline.
  **Video can't be embedded** — a `video`-backed story is online-only; the snapshot
  should carry the `poster` and the player fall back to it offline.
- **Motion pushes work into the player, not the editor** — S3/S4 render modes (skit
  dialogue sequence, animated/video backdrop) are net-new in `discover-story/[id].tsx`,
  which is today a silent, gradient-only renderer. Budget the player work explicitly.
- **Reduced-motion & battery** — honor `prefers-reduced-motion` (freeze GIF, show video
  poster, don't autoplay); a story that's all motion is a battery/bandwidth cost.
- **Scope vs. the fold-in** — this is a *new* type, orthogonal to the Course/Lesson
  fold-in (Option A). Track and ship independently; they don't block each other.
