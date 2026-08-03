import type { ContentStatus } from "@/lib/content-workflow";

/**
 * Shapes for the Studio Web season (story arc) editor, mirroring
 * `server/src/routes/educator/story-arcs.ts`. Kept beside the editor rather
 * than in the course-detail `shared.tsx` because that file models the partial
 * course-bound view (courseId is never null there).
 */

/** A recurring character. `castId` is what a transcript segment's `speaker` refers to. */
export type CastMember = {
  castId: string;
  name: string;
  role: string;
  hue: string;
};

/** Accents a cast avatar can take — mirrors CAST_HUES server-side, which rejects anything else. */
export const CAST_HUES = [
  "rose", "purple", "blue", "teal", "indigo",
  "orange", "green", "amber", "sky", "pink", "fuchsia",
] as const;

/** A persisted chapter row as returned by `GET /educator/story-arcs/arc/:id`. */
export type ServerChapter = {
  id: string;
  lessonId: string;
  title: string;
  narrativeIntro: string;
  narrativeOutro: string;
  order: number;
  isActive: boolean;
};

export type StoryArcSummary = {
  id: string;
  /** Null for a standalone season — a cross-course narrative with no owning course. */
  courseId: string | null;
  languageId: string | null;
  title: string;
  description: string;
  updatedAt: string;
  status?: ContentStatus;
  createdBy?: string | null;
  isActive?: boolean;
};

export type StoryArcDetail = {
  id: string;
  courseId: string | null;
  languageId: string | null;
  title: string;
  description: string;
  /** Target-language season title, e.g. "Bou Mie". */
  nativeTitle: string | null;
  /** One-line hook shown on the Series screen. */
  logline: string | null;
  isActive: boolean;
  chapters: ServerChapter[];
  cast: CastMember[];
};

/**
 * A chapter being edited. `order` is deliberately absent: the list position IS
 * the order, so reordering never leaves stale numbers behind. `key` is a stable
 * React key that survives moves; `id` is absent for chapters not yet saved.
 */
export type ChapterDraft = {
  key: string;
  id?: string;
  lessonId: string;
  title: string;
  narrativeIntro: string;
  narrativeOutro: string;
  isActive: boolean;
};
