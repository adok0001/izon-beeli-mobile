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
import type { AccentHue } from "@/constants/accent-colors";
import {
  IZON_PODCAST_SERIES,
  IZON_PODCAST_EPISODES,
  IZON_FILMS,
  IZON_BM_COURSE_ENTRIES,
} from "@/lib/data/podcasts/izon";

export interface SeriesCastMember {
  id: string;
  name: string;
  role: string;
  /** Emoji avatar shown on the cast strip — a character-specific touch, not a semantic icon. */
  avatar: string;
  /** Categorical accent used to tint the avatar's circle. */
  hue: AccentHue;
}

/**
 * Cast avatar + accent lookup, keyed by the IZON_CAST id. Presentation-only —
 * kept out of cast.ts so that file stays pure content/persona data.
 */
const IZON_CAST_AVATARS: Record<string, { avatar: string; hue: AccentHue }> = {
  "izon-cast-tari": { avatar: "🧑🏾", hue: "teal" },
  "izon-cast-ebiere": { avatar: "👵🏾", hue: "amber" },
  "izon-cast-preye": { avatar: "👨🏾", hue: "green" },
  "izon-cast-timi": { avatar: "🎣", hue: "blue" },
  "izon-cast-seibi": { avatar: "🧺", hue: "pink" },
  "izon-cast-ere": { avatar: "🛶", hue: "sky" },
  "izon-cast-amaokowei": { avatar: "🧓🏾", hue: "purple" },
};
const DEFAULT_CAST_AVATAR = { avatar: "🙂", hue: "teal" as AccentHue };

/** Cast avatar + accent for a cast id, e.g. a transcript segment's `speaker`. */
export function getCastAvatar(castId: string | null | undefined): { avatar: string; hue: AccentHue } {
  if (!castId) return DEFAULT_CAST_AVATAR;
  return IZON_CAST_AVATARS[castId] ?? DEFAULT_CAST_AVATAR;
}

export interface SeriesLevelBand {
  key: string;
  cefr: string;
  label: string;
  /** Companion-course title for this level, with the "Bou Mie: " prefix stripped. */
  subtitle: string;
}

/** Course-level -> CEFR band, shared with anywhere a course's level needs a CEFR badge. */
export const LEVEL_CEFR: Record<string, string> = {
  beginner: "A1",
  intermediate: "A2·B1",
  advanced: "B1·C2",
};
const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export interface SeriesMeta {
  /** Equals the StoryArc id / DiscoverItem.storyId. */
  storyId: string;
  /** Target-language season title (flavor). */
  nativeTitle?: string;
  logline?: string;
  cast: SeriesCastMember[];
  /** episode lessonId -> style ("skit" | "immersive_story" | "host_narrated"). */
  styleByLessonId: Record<string, string>;
  /** Language the season belongs to — used to fetch its companion courses. */
  languageId?: string;
  /** Films sharing this season's world (matched against DiscoverItem.storyId). */
  filmStoryIds?: string[];
  /** Companion courses that drill this season's world (course ids). */
  courseIds?: string[];
  /** Beginner/Intermediate/Advanced bands, sourced from the companion courses. */
  levelBands?: SeriesLevelBand[];
}

const IZON_SERIES: SeriesMeta = {
  storyId: `story-${IZON_PODCAST_SERIES.id}`,
  nativeTitle: IZON_PODCAST_SERIES.nativeTitle,
  logline: IZON_PODCAST_SERIES.logline.en,
  cast: IZON_PODCAST_SERIES.cast.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    ...getCastAvatar(c.id),
  })),
  styleByLessonId: Object.fromEntries(
    IZON_PODCAST_EPISODES.map((e) => [e.id, e.style]),
  ),
  languageId: IZON_PODCAST_SERIES.languageId,
  filmStoryIds: IZON_FILMS.map((f) => f.storyId).filter(
    (s): s is string => !!s,
  ),
  courseIds: IZON_BM_COURSE_ENTRIES.map((c) => c.id),
  levelBands: IZON_BM_COURSE_ENTRIES.map((c) => ({
    key: c.level,
    cefr: LEVEL_CEFR[c.level] ?? "",
    label: LEVEL_LABEL[c.level] ?? c.level,
    subtitle: (typeof c.title === "string" ? c.title : c.title.en ?? "").replace(/^Bou Mie:\s*/, ""),
  })),
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
