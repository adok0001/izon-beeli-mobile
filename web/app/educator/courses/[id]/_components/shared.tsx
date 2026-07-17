// ─── Types ────────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  courseId: string;
  courseTitle: string;
  languageId: string;
  title: string;
  titleFr: string | null;
  description: string;
  descriptionFr: string | null;
  type: string;
  audioUrl: string | null;
  duration: number | null;
  order: number;
  artist: string | null;
  genre: string | null;
  isActive: boolean;
}

export interface Course {
  id: string;
  title: string;
  titleFr: string | null;
  description: string;
  descriptionFr: string | null;
  languageId: string;
  level: string;
  courseType: string | null;
  order: number;
}

export const LESSON_TYPES = ["lesson", "story", "music", "pronunciation"] as const;

// ─── Story Arc Types ──────────────────────────────────────────────────────────

export interface StoryChapterDraft {
  id: string;
  lessonId: string;
  title: string;
  narrativeIntro: string;
  narrativeOutro: string;
  order: number;
}

export interface StoryArc {
  id: string;
  courseId: string;
  title: string;
  description: string;
  chapters: StoryChapterDraft[];
}

export function fmtDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
