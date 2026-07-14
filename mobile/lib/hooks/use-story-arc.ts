import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { LocalizedText, SeasonCastMember, StoryArc, StoryChapter } from "@/types";

interface StoryArcSummary {
  id: string;
  courseId: string;
  title: string;
}

/** Re-exported: it lives in @/types so `Lesson.seasonCast` can carry it too. */
export type { SeasonCastMember };

/** A course that drills the season's world (`courses.seasonArcId`). */
export interface SeasonCompanionCourse {
  id: string;
  title: string | LocalizedText;
  level: string;
  order: number;
}

/** Chapter as served by the season endpoints — adds the episode's style chip. */
export interface SeasonChapter extends StoryChapter {
  /** "skit" | "immersive_story" | "host_narrated" — rendered via `styleLabel()`. */
  lessonStyle?: string | null;
}

/**
 * The season "bible" the Series screen renders. Everything below the base
 * StoryArc used to live in mobile's bundled SERIES_REGISTRY; it is now authored
 * in the CMS and served by `GET /story-arcs/arc/:id`.
 */
export interface SeasonStoryArc extends StoryArc {
  languageId?: string | null;
  /** Target-language season title (flavour), shown above the English title. */
  nativeTitle?: string | null;
  logline?: string | null;
  cast?: SeasonCastMember[];
  companionCourses?: SeasonCompanionCourse[];
  /** Films sharing this season's world (matched against DiscoverItem.storyId). */
  filmStoryIds?: string[];
  chapters: SeasonChapter[];
}

export function useStoryArcs() {
  return useQuery<StoryArcSummary[]>({
    queryKey: ["story-arcs"],
    queryFn: () => apiFetch<StoryArcSummary[]>("/story-arcs"),
    staleTime: 1000 * 60 * 10,
  });
}

export function useStoryArc(courseId: string) {
  return useQuery<StoryArc>({
    queryKey: ["story-arc", courseId],
    queryFn: () => apiFetch<StoryArc>(`/story-arcs/${encodeURIComponent(courseId)}`),
    enabled: !!courseId,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Fetch a story arc by its arc id (Discover cards carry this as `storyId`).
 * Used by the Series screen to resolve a season straight from a card.
 */
export function useStoryArcById(arcId: string) {
  return useQuery<SeasonStoryArc>({
    queryKey: ["story-arc-by-id", arcId],
    queryFn: () => apiFetch<SeasonStoryArc>(`/story-arcs/arc/${encodeURIComponent(arcId)}`),
    enabled: !!arcId,
    staleTime: 1000 * 60 * 10,
  });
}
