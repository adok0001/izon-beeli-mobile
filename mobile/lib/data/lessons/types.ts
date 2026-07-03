/**
 * Shared types for lesson data used by both the app and the server seed.
 * Keep this file dependency-free so it can be imported from anywhere.
 */

/** BCP-47 UI language code → localized string. Mirrors LocalizedText in @/types. */
export type LocalizedText = Partial<Record<"en" | "fr" | "pcm" | "ar" | "pt", string>>;

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  translation?: string | LocalizedText;
  /** @deprecated Use `translation` as LocalizedText */
  translationFr?: string;
  /** Who speaks this line (audio-drama attribution). Omit for narration. */
  speaker?: string;
  /** Romanized / pronunciation guidance for the learner (never spoken). */
  roman?: string;
}

export type LessonType = "lesson" | "song";

/** How to interpret a transcript. `plain` = published target-language lines. */
export type TranscriptType = "plain" | "helper";

export interface LessonData {
  id: string;
  courseId: string;
  /** @default "lesson" */
  type?: LessonType;
  title: string | LocalizedText;
  /** @deprecated Use `title` as LocalizedText */
  titleFr?: string;
  description: string | LocalizedText;
  /** @deprecated Use `description` as LocalizedText */
  descriptionFr?: string;
  /** null = bundled/local audio (app uses BUNDLED_AUDIO map) */
  audioUrl: string | null;
  /** Duration in minutes; null = not yet timed */
  duration: number | null;
  order: number;
  /** Artist or traditional source (songs only) */
  artist?: string;
  /** e.g. "lullaby", "praise", "work_song", "festival", "contemporary" */
  genre?: string;
  /** @default true — false for stub/template lessons pending educator content */
  isActive?: boolean;
  /** Competency tags — e.g. ["listening", "vocabulary"] */
  skills?: string[];
  /** Scene slug within a contextual place course, e.g. "house.kitchen" */
  scene?: string;
  /** Display title for the scene section header, e.g. "Kitchen" */
  sceneTitle?: string;
  /** Sort order of this scene within its course (lower = first) */
  sceneOrder?: number;
  /** How to interpret `transcript`. Defaults to "plain". */
  transcriptType?: TranscriptType;
  /** Honest real-world competence statement ("You can now …"). */
  canDo?: string | LocalizedText;
  transcript: TranscriptSegment[];
}
