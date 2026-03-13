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

export interface LessonData {
  id: string;
  courseId: string;
  title: string;
  titleFr?: string;
  description: string;
  descriptionFr?: string;
  /** null = bundled/local audio (app uses BUNDLED_AUDIO map) */
  audioUrl: string | null;
  /** Duration in minutes; null = not yet timed */
  duration: number | null;
  order: number;
  transcript: TranscriptSegment[];
}
