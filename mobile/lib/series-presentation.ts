/**
 * Presentation-only helpers for audio-drama seasons ("series").
 *
 * The season's *content* — native title, logline, cast, companion courses, film
 * links, per-episode style — now comes from the API (`GET /story-arcs/arc/:id`,
 * see `useStoryArcById`). What lives here is the client-side chrome around it:
 * CEFR bands, level labels, style chip copy, and the cast avatar fallback. No
 * imports from `lib/data/*` — this file is deliberately content-free.
 */
import type { AccentHue } from "@/constants/accent-colors";
import { localize } from "@/lib/localize";
import type { SeasonCastMember, SeasonCompanionCourse } from "@/lib/hooks/use-story-arc";
import type { UiLanguage } from "@/store/ui-language-store";

/** Course-level -> CEFR band, shared with anywhere a course's level needs a CEFR badge. */
export const LEVEL_CEFR: Record<string, string> = {
  beginner: "A1",
  intermediate: "A2·B1",
  advanced: "B1·C2",
};

export const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

/** Human label for an episode style. */
export function styleLabel(style: string | null | undefined): string | null {
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

export interface SeriesLevelBand {
  key: string;
  cefr: string;
  label: string;
  /** Companion-course title for this level, with the season-name prefix stripped. */
  subtitle: string;
}

/**
 * Companion courses are titled "<Season>: <Theme>" (e.g. "Bou Mie: River Life").
 * On a band card the season name is already implied, so only the theme is shown.
 */
function stripSeasonPrefix(title: string, seasonTitle?: string | null): string {
  const prefixes = [seasonTitle, "Bou Mie"].filter((p): p is string => !!p);
  for (const prefix of prefixes) {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const stripped = title.replace(new RegExp(`^${escaped}:\\s*`), "");
    if (stripped !== title) return stripped;
  }
  return title;
}

/**
 * Beginner/Intermediate/Advanced bands, derived from the season's companion
 * courses. Course titles may arrive as a JSON-serialized LocalizedText.
 */
export function buildLevelBands(
  companionCourses: SeasonCompanionCourse[] | undefined,
  uiLanguage: UiLanguage,
  seasonTitle?: string | null
): SeriesLevelBand[] {
  if (!companionCourses?.length) return [];
  return companionCourses.map((c) => ({
    key: c.level,
    cefr: LEVEL_CEFR[c.level] ?? "",
    label: LEVEL_LABEL[c.level] ?? c.level,
    subtitle: stripSeasonPrefix(localize(c.title, uiLanguage), seasonTitle),
  }));
}

const DEFAULT_CAST_AVATAR: { initial: string; hue: AccentHue } = { initial: "•", hue: "teal" };

/** First letter of a cast member's name, for the initial-in-circle avatar. */
export function castInitial(name: string): string {
  const ch = [...name.trim()][0];
  return ch ? ch.toUpperCase() : "•";
}

/**
 * Avatar initial + accent for a speaker id (e.g. a transcript segment's
 * `speaker`), resolved against the season's cast from the API. Speakers outside
 * the cast — or callers with no cast to hand — get a neutral default.
 */
export function castAvatarFor(
  cast: SeasonCastMember[] | undefined,
  castId: string | null | undefined
): { initial: string; hue: AccentHue } {
  if (!castId || !cast?.length) return DEFAULT_CAST_AVATAR;
  const member = cast.find((c) => c.castId === castId);
  if (!member) return DEFAULT_CAST_AVATAR;
  return { initial: castInitial(member.name), hue: member.hue as AccentHue };
}
