/**
 * Shared types for lesson data used by both the app and the server seed.
 * Keep this file dependency-free so it can be imported from anywhere.
 */

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  translation?: string;
  translationFr?: string;
}

export type LessonType = "lesson" | "song";

export interface LessonData {
  id: string;
  courseId: string;
  /** @default "lesson" */
  type?: LessonType;
  title: string;
  titleFr?: string;
  description: string;
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
  transcript: TranscriptSegment[];
}
