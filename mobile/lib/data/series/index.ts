/**
 * Series registry — static "bible" metadata for audio-drama seasons, keyed by
 * the season's `storyId` (which equals the StoryArc id the Discover card links
 * to). The Series screen fetches episode state (order, runtime, lock, level)
 * from the API story-arc, and enriches it with the cast + per-episode style
 * chips from here — authored static content, like course copy.
 *
 * Adding a new language's series = add its entry here, sourced from that
 * language's podcast package.
 */
import {
  IZON_PODCAST_SERIES,
  IZON_PODCAST_EPISODES,
} from "@/lib/data/podcasts/izon";

export interface SeriesCastMember {
  id: string;
  name: string;
  role: string;
}

export interface SeriesMeta {
  /** Equals the StoryArc id / DiscoverItem.storyId. */
  storyId: string;
  /** Target-language season title (flavor). */
  nativeTitle?: string;
  logline?: string;
  cast: SeriesCastMember[];
  /** episode lessonId -> style ("skit" | "immersive_story" | "host_narrated"). */
  styleByLessonId: Record<string, string>;
}

const IZON_SERIES: SeriesMeta = {
  storyId: `story-${IZON_PODCAST_SERIES.id}`,
  nativeTitle: IZON_PODCAST_SERIES.nativeTitle,
  logline: IZON_PODCAST_SERIES.logline.en,
  cast: IZON_PODCAST_SERIES.cast.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
  })),
  styleByLessonId: Object.fromEntries(
    IZON_PODCAST_EPISODES.map((e) => [e.id, e.style]),
  ),
};

export const SERIES_REGISTRY: Record<string, SeriesMeta> = {
  [IZON_SERIES.storyId]: IZON_SERIES,
};

export function getSeriesMeta(storyId: string | null | undefined): SeriesMeta | undefined {
  if (!storyId) return undefined;
  return SERIES_REGISTRY[storyId];
}

/** Human label for an episode style. */
export function styleLabel(style: string | undefined): string | null {
  switch (style) {
    case "skit":
      return "Skit";
    case "immersive_story":
      return "Immersive";
    case "host_narrated":
      return "Narrated";
    default:
      return null;
  }
}
