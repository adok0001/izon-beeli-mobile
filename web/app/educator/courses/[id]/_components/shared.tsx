import type { LocalizedText } from "@/components/ui/localized-text-input";
// ─── Types ────────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  courseId: string;
  courseTitle: string;
  languageId: string;
  title: string;
  titleTranslations?: LocalizedText | null;
  description: string;
  descriptionTranslations?: LocalizedText | null;
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
  titleTranslations?: LocalizedText | null;
  description: string;
  descriptionTranslations?: LocalizedText | null;
  languageId: string;
  level: string;
  courseType: string | null;
  order: number;
}

export const LESSON_TYPES = ["lesson", "story", "music", "pronunciation"] as const;

/** The ten Movement course types `stubForCourse` scaffolds (server
 * `lib/lesson-stubs.ts`) — the only values /educator/generate-stubs accepts.
 * Labels match the mobile Studio generator panel. */
export const MOVEMENT_COURSE_TYPES = [
  { type: "mv_arrival", label: "Arrival" },
  { type: "mv_household", label: "The Household" },
  { type: "mv_village", label: "The Village" },
  { type: "mv_growing_up", label: "Growing Up" },
  { type: "mv_threshold", label: "The Threshold" },
  { type: "mv_working_year", label: "The Working Year" },
  { type: "mv_union", label: "The Union" },
  { type: "mv_assembly", label: "The Assembly" },
  { type: "mv_elders_voice", label: "The Elder's Voice" },
  { type: "mv_keeper", label: "The Keeper" },
] as const;

const MOVEMENT_LABELS: Record<string, string> = Object.fromEntries(
  MOVEMENT_COURSE_TYPES.map((m) => [m.type, m.label]),
);

/** Human label for a course type: Movement title for `mv_*`, otherwise the
 * snake_case value spaced out (legacy types like `first_words`). */
export function courseTypeLabel(courseType: string | null | undefined): string {
  if (!courseType) return "";
  return MOVEMENT_LABELS[courseType] ?? courseType.replace(/_/g, " ");
}

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
