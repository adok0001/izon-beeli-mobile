/**
 * Beeli Podcast — content schema (authoring superset) + app adapters
 * ------------------------------------------------------------------
 *
 * WHY THIS FILE EXISTS
 *
 * A Beeli "podcast" is a recurring-character audio drama that teaches a
 * language through story. It has to satisfy THREE things at once:
 *
 *   1. The audio/production reality — speaker labels, romanized pronunciation,
 *      sound-design cues, "no interface-language spoken" (see
 *      userio-docs/BEELI_PODCAST_LESSON_TEMPLATE_v2.md).
 *   2. The pedagogy — hidden CEFR, target vocab, grammar points, cultural notes
 *      (the "Living Culture" model in .claude/skills/design-course).
 *   3. The existing app data model — every episode must reduce to a plain
 *      `LessonData` with a target-language `transcript`, grouped by a `StoryArc`,
 *      and surfaced in the Discover feed as a `DiscoverItem` (type "podcast").
 *
 * The app's `TranscriptSegment` now carries `speaker` + `roman`, and `Lesson`
 * carries `transcriptType` + `canDo` (migration 0010_media_schema_enablers).
 * We still author against a richer SUPERSET here (kind/verify/vocab/grammar/
 * production) and DOWN-CONVERT to the app shapes via the adapters at the bottom;
 * the down-conversion is now loss-less for the fields the app can render.
 *
 * ┌── PodcastEpisode (rich authoring) ──┐   toLessonData()   ┌── LessonData ──┐
 * │  speaker · roman · kind · verify    │  ───────────────►  │  transcript[]  │
 * │  vocab · grammar · cultural · prod  │  toPlainTranscript │  (pure Izon)   │
 * └─────────────────────────────────────┘                    └────────────────┘
 *
 * >>> CORE-SCHEMA ADDITIONS — NOW LANDED (migration 0010_media_schema_enablers):
 *   • `speaker?: string`  on TranscriptSegment  (who is talking)
 *   • `roman?: string`    on TranscriptSegment   (pronunciation)
 *   • `transcriptType?: "plain" | "helper"` on Lesson
 *   • `canDo?` on Lesson (the "you can now …" competence line)
 * The down-conversion below now carries speaker/roman/transcriptType/canDo, so
 * the podcast layer is a loss-less extension for everything the app renders.
 *
 * This file is dependency-light: it imports ONLY app types (compile-time) so it
 * typechecks in isolation and stays copy-paste portable to a new language.
 */

import type {
  LessonData,
  TranscriptSegment,
  LessonType,
  LocalizedText,
} from "../lessons/types";

// Re-declared here (not imported) so a contributor copying this package to a
// new repo/branch has the axis vocabulary inline. Keep in sync with
// .claude/skills/design-course/scaffold/blueprint.ts — that file is the source
// of truth for the Living-Culture axes.
export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type SkillTag =
  | "listening"
  | "speaking"
  | "reading"
  | "writing"
  | "vocabulary"
  | "grammar";

/** The three episode STYLES the series rotates through at each level. */
export type EpisodeStyle =
  /** Fast, funny, dialogue-only two/three-hander. Shortest. */
  | "skit"
  /** Scene-driven story with narration + dialogue. Medium. */
  | "immersive_story"
  /**
   * A single native voice narrates context + threads dialogue through it.
   * NOTE: "host-narrated" does NOT mean an interface-language host. Per the
   * v2 template there is no bilingual host — the narration is IN THE TARGET
   * LANGUAGE (Speaker A). It is the longest, richest format.
   */
  | "host_narrated";

export type EpisodeLength = "short" | "medium" | "long";

/** What a line is, so the adapter knows what to keep in the plain transcript. */
export type LineKind =
  /** A character speaks target-language dialogue. -> kept in plain transcript. */
  | "dialogue"
  /** Speaker A narrates in the target language. -> kept in plain transcript. */
  | "narration"
  /** Non-verbal sound design (ambient, tone). -> stripped from plain. */
  | "sfx"
  /** Screen-sync direction for the app (illustration/card). -> stripped. */
  | "screen"
  /** A timed silence for the learner to echo/produce. -> stripped. */
  | "pause"
  /** Author/producer aside. -> stripped. Never reaches the learner. */
  | "note";

/** A cast member, defined once per series and referenced by `id`. */
export interface PodcastCharacter {
  /** Language-prefixed, stable: e.g. "izon-cast-ebiere". */
  id: string;
  /** Display name as it appears on screen and in the bible. */
  name: string;
  /** One-line who-they-are. */
  role: string;
  /** Age band / register — guides casting and vocabulary. */
  persona: string;
  /** How they relate to the others (kinship/community). */
  relationships: string;
  /** Real-world Izon/Niger-Delta grounding for this archetype. */
  culturalNote: string;
  /** Casting + voice-direction brief for the audio producer. */
  voice: string;
  /** Which levels this character appears in. */
  levels: CourseLevel[];
}

/**
 * One line of an episode. In the target language when kind is
 * dialogue/narration; otherwise a production cue that is stripped for learners.
 */
export interface PodcastLine {
  /** 1-based order within the episode. */
  seq: number;
  kind: LineKind;
  /** Cast `id` (or "SPEAKER_A" / "SPEAKER_B" for pronunciation-only episodes).
   *  Omitted for sfx/screen/pause/note. */
  speaker?: string;
  /**
   * TARGET-LANGUAGE text only (dialogue/narration). Never the gloss.
   * For sfx/screen/pause/note this holds the CUE text (e.g. "ambient: jetty").
   * Use a [[bracketed English placeholder]] when a real Izon form is NOT yet
   * attested — and set the episode `isActive: false`.
   */
  text: string;
  /** Romanized / pronunciation guidance for the learner (never spoken). */
  roman?: string;
  /** On-screen gloss. en + fr required on real dialogue/narration lines. */
  translation?: LocalizedText;
  /** Optional word-for-word gloss for idioms/proverbs. */
  literal?: string;
  /** Attestation for this line (dictionary/lesson-note), or a VERIFY note. */
  source?: string;
  /** true = this exact form/spelling needs a native-speaker check. */
  verify?: boolean;
  /** Seconds into the audio (fill during production). */
  startTime?: number;
  endTime?: number;
}

export interface VocabItem {
  /** Target-language headword. */
  izon: string;
  roman: string;
  gloss: LocalizedText;
  /** Part of speech, optional. */
  pos?: string;
  /** Source/attestation, or a VERIFY note. */
  source?: string;
  verify?: boolean;
}

export interface GrammarPoint {
  point: LocalizedText;
  explanation: LocalizedText;
  examples: { izon: string; roman: string; gloss: LocalizedText; source?: string; verify?: boolean }[];
}

export interface CulturalNote {
  title: LocalizedText;
  body: LocalizedText;
  /** e.g. ["festival", "food", "cosmology"]. */
  tags?: string[];
}

export interface ProductionNotes {
  /** Casting + direction per character used in this episode. */
  voices: { character: string; direction: string }[];
  /** Ambient beds and one-shot sound design, in order. */
  soundDesign: string[];
  /** Music cues (sparingly — the v2 template forbids music under speech). */
  music?: string[];
  /** What the app screen should show, synced to the audio (v2 SEGMENT sync). */
  visuals: string[];
  /** Anything else the producer needs. */
  notes?: string;
}

/**
 * A single podcast episode — the rich authoring unit.
 * `toLessonData(ep)` reduces it to the app's `LessonData`.
 */
export interface PodcastEpisode {
  /** Language-prefixed, globally unique: e.g. "izon-pod-b1". */
  id: string;
  /** The series this belongs to: e.g. "izon-pod-longwayhome". */
  seriesId: string;
  languageId: string;
  /** The course this episode is filed under in the app (existing course id). */
  courseId: string;
  /** 1..N across the whole season (drives StoryArc chapter order). */
  order: number;

  level: CourseLevel;
  style: EpisodeStyle;
  length: EpisodeLength;
  /** Target runtime in minutes (short≈6–8, medium≈12–14, long≈16–18). */
  targetMinutes: number;

  /** Interface-language card title (NOT spoken). */
  title: LocalizedText;
  /** Interface-language card description — what the learner can DO. */
  description: LocalizedText;
  /** One-line teaser for the series/episode list. */
  logline: LocalizedText;

  // ── Hidden pedagogy (never surfaced as a learner-facing level) ──
  cefr: CEFRLevel;
  /** Living-Culture movement id (see blueprint.ts). Documentation only. */
  movementId: string;
  /** Living-Culture pillars touched. Documentation only. */
  pillars: string[];
  /** Living-Culture place. Documentation only. */
  place: string;
  skills: SkillTag[];

  /** Cast `id`s that appear. */
  cast: string[];
  /** Episode `id`s whose vocabulary is deliberately recycled here. */
  recycledFrom: string[];
  /** Count of genuinely new vocab items (v2 target: 8–15). */
  newVocabTarget: number;

  targetVocab: VocabItem[];
  grammarPoints: GrammarPoint[];
  culturalNotes: CulturalNote[];

  /**
   * The full HELPER script: dialogue/narration + sfx/screen/pause/note cues.
   * `toPlainTranscript` strips everything but dialogue/narration.
   */
  script: PodcastLine[];

  production: ProductionNotes;

  /** Audio asset (null = not yet recorded; app resolves bundled audio). */
  audioUrl: string | null;

  /**
   * false = contains [[placeholders]] or unverified heritage content and MUST
   * NOT ship as a live lesson. Mirrors the design-course discipline.
   */
  isActive: boolean;

  /** Attribution: dictionaries, lesson notes, educators consulted. */
  sources: string[];
}

/** The series header — one per language, groups the season. */
export interface PodcastSeries {
  /** Language-prefixed: e.g. "izon-pod-longwayhome". */
  id: string;
  languageId: string;
  /** The course id the StoryArc attaches to (existing app course). */
  courseId: string;
  /** Interface-language series title. */
  title: string;
  /** Target-language series title (shown as flavor, not required to parse). */
  nativeTitle: string;
  logline: LocalizedText;
  description: LocalizedText;
  /** The season-arc synopsis, for the bible / series card. */
  arc: string;
  cast: PodcastCharacter[];
  /** Episode ids in season order. */
  episodeIds: string[];
  /** Cover art hints for the Discover card. */
  coverEmoji: string;
  coverGradient: [string, string];
}

// ─── Adapters: superset -> exact app shapes ──────────────────────────────────

/** Lines that carry actual audio the learner hears (kept in the transcript). */
function isSpokenLine(l: PodcastLine): boolean {
  return l.kind === "dialogue" || l.kind === "narration";
}

/**
 * The published, screen-safe transcript: target-language lines only.
 * Now carries `speaker` + `roman` — the core TranscriptSegment gained those
 * fields (see migration 0010_media_schema_enablers), so the audio-drama
 * attribution and pronunciation guidance are no longer lost on down-conversion.
 */
export function toPlainTranscript(ep: PodcastEpisode): TranscriptSegment[] {
  return ep.script.filter(isSpokenLine).map((l, i) => ({
    id: `${ep.id}-${i + 1}`,
    startTime: l.startTime ?? 0,
    endTime: l.endTime ?? 0,
    text: l.text,
    translation: l.translation,
    speaker: l.speaker,
    roman: l.roman,
  }));
}

/**
 * A speaker-attributed reading of the transcript — used by the contributor
 * review tooling and by the bible. This is the "helper" view; it is NOT what
 * ships to learners. Returns plain strings, no app type coupling.
 */
export function toHelperScript(ep: PodcastEpisode): string[] {
  return ep.script.map((l) => {
    if (l.kind === "sfx") return `[SOUND: ${l.text}]`;
    if (l.kind === "screen") return `[SCREEN: ${l.text}]`;
    if (l.kind === "pause") return `[PAUSE: ${l.text}]`;
    if (l.kind === "note") return `[NOTE: ${l.text}]`;
    const who = l.speaker ? `${l.speaker}: ` : "";
    const roman = l.roman ? `  (${l.roman})` : "";
    return `${who}${l.text}${roman}`;
  });
}

/** Reduce an episode to the app's `LessonData`. */
export function toLessonData(ep: PodcastEpisode): LessonData {
  const type: LessonType = "lesson";
  return {
    id: ep.id,
    courseId: ep.courseId,
    type,
    title: ep.title,
    description: ep.description,
    audioUrl: ep.audioUrl,
    duration: ep.targetMinutes, // minutes, matching LessonData convention
    order: ep.order,
    genre: "podcast",
    isActive: ep.isActive,
    skills: ep.skills,
    scene: `podcast.${ep.level}`,
    sceneTitle: "Podcast",
    sceneOrder: ep.order,
    transcriptType: "plain",
    // Surface the "what the learner can DO" description as the competence line.
    canDo: ep.description,
    transcript: toPlainTranscript(ep),
  };
}

/**
 * Build a `StoryArc` (the app's series-grouping mechanism) from the series +
 * its episodes. Chapters point at the LessonData ids in season order.
 */
export function toStoryArc(
  series: PodcastSeries,
  episodes: PodcastEpisode[],
): {
  id: string;
  courseId: string;
  title: string;
  description: string;
  chapters: {
    id: string;
    lessonId: string;
    title: string;
    narrativeIntro: string;
    narrativeOutro: string;
    order: number;
  }[];
} {
  const byId = new Map(episodes.map((e) => [e.id, e]));
  const chapters = series.episodeIds
    .map((id, i) => {
      const ep = byId.get(id);
      if (!ep) return null;
      return {
        id: `${series.id}-ch-${i + 1}`,
        lessonId: ep.id,
        title: ep.title.en ?? ep.id,
        narrativeIntro: ep.logline.en ?? "",
        narrativeOutro: ep.description.en ?? "",
        order: i + 1,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);
  return {
    id: `story-${series.id}`,
    courseId: series.courseId,
    title: series.title,
    description: series.description.en ?? series.arc,
    chapters,
  };
}

/**
 * Build the Discover-feed `DiscoverItem` (type "podcast") for the released
 * series. `storyId` links the card to the StoryArc above.
 */
export function toDiscoverItem(
  series: PodcastSeries,
  episodes: PodcastEpisode[],
  publishedAt: string,
): {
  id: string;
  type: "podcast";
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  duration: number;
  coverGradient: [string, string];
  coverEmoji: string;
  featured?: boolean;
  storyId: string;
  showNotes: string;
} {
  const totalMinutes = episodes
    .filter((e) => series.episodeIds.includes(e.id))
    .reduce((sum, e) => sum + e.targetMinutes, 0);
  return {
    id: `discover-${series.id}`,
    type: "podcast",
    title: series.title,
    description: series.description.en ?? series.arc,
    author: "Beeli · community-voiced",
    publishedAt,
    duration: totalMinutes * 60,
    coverGradient: series.coverGradient,
    coverEmoji: series.coverEmoji,
    featured: true,
    storyId: `story-${series.id}`,
    showNotes: series.arc,
  };
}

// ─── Validation (run in tests / CI content checks) ───────────────────────────

export interface PodcastValidationIssue {
  episodeId: string;
  severity: "error" | "warn";
  message: string;
}

/**
 * Enforce the invariants that matter for this content type:
 *  • language-prefixed ids
 *  • dialogue/narration lines carry a target-language `text` (no bare gloss)
 *  • "no interface language spoken" — spoken lines must not be plain English
 *    unless explicitly a [[placeholder]] (which forces isActive:false)
 *  • any [[placeholder]] or verify:true line ⇒ episode must be isActive:false
 */
export function validatePodcast(
  series: PodcastSeries,
  episodes: PodcastEpisode[],
): PodcastValidationIssue[] {
  const issues: PodcastValidationIssue[] = [];
  const prefix = `${series.languageId}-`;

  for (const ep of episodes) {
    const add = (severity: "error" | "warn", message: string) =>
      issues.push({ episodeId: ep.id, severity, message });

    if (!ep.id.startsWith(prefix))
      add("error", `id must start with "${prefix}" (v TEMPLATE.ts convention)`);
    if (ep.languageId !== series.languageId)
      add("error", `languageId "${ep.languageId}" != series "${series.languageId}"`);

    let hasPlaceholder = false;
    let hasUnverified = false;

    for (const l of ep.script) {
      if (!isSpokenLine(l)) continue;
      if (!l.text || l.text.trim() === "")
        add("error", `line ${l.seq}: spoken line has empty text`);
      if (/\[\[.*?\]\]/.test(l.text)) hasPlaceholder = true;
      if (l.verify) hasUnverified = true;
      if (l.kind === "dialogue" || l.kind === "narration") {
        if (!l.translation?.en)
          add("warn", `line ${l.seq}: spoken line missing en gloss`);
        if (!l.roman && !/\[\[.*?\]\]/.test(l.text))
          add("warn", `line ${l.seq}: spoken line missing roman guidance`);
      }
    }

    if ((hasPlaceholder || hasUnverified) && ep.isActive)
      add(
        "error",
        `episode has placeholders/unverified forms but isActive:true — set isActive:false until a native speaker verifies`,
      );

    if (ep.targetVocab.length === 0)
      add("warn", `no targetVocab listed`);
  }

  // Every declared episode id should resolve to an episode.
  const known = new Set(episodes.map((e) => e.id));
  for (const id of series.episodeIds)
    if (!known.has(id))
      issues.push({ episodeId: id, severity: "error", message: "episodeId in series has no episode" });

  return issues;
}
