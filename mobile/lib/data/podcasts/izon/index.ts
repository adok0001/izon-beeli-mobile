/**
 * "The Long Way Home" (Bou Mie) — Izon podcast series, assembled.
 * ---------------------------------------------------------------
 * This is the single import surface for the Izon reference series. It:
 *   • collects the 9 episodes across the three levels,
 *   • declares the series header + cast,
 *   • exposes app-shaped views via the adapters (LessonData / StoryArc /
 *     DiscoverItem) so the series can be wired into the app WITHOUT touching
 *     any existing data file, and
 *   • runs the content validator so a broken/placeholder-but-active episode
 *     fails fast in tests/CI.
 *
 * To surface in the app (a separate, optional integration step — see
 * ../README.md "Wiring into the app"):
 *   - spread `IZON_PODCAST_LESSONS` into ALL_LESSONS (lessons/index.ts),
 *   - register `IZON_PODCAST_STORY` in stories/index.ts,
 *   - add `IZON_PODCAST_DISCOVER` to the Discover feed source.
 * None of that is done here, so this package is inert until an integrator
 * opts in — by design (nothing existing breaks).
 */

import type { PodcastSeries, PodcastEpisode } from "../podcast-types";
import {
  toLessonData,
  toStoryArc,
  toDiscoverItem,
  validatePodcast,
} from "../podcast-types";
import { validateFilms } from "../film-types";
import { toFilmDiscoverItem } from "../film-types";
import { validateCourse } from "../course-types";
import { IZON_CAST } from "./cast";
import { IZON_PODCAST_BEGINNER } from "./beginner";
import { IZON_PODCAST_INTERMEDIATE } from "./intermediate";
import { IZON_PODCAST_ADVANCED } from "./advanced";
import { IZON_FILMS } from "./films";
import {
  IZON_BM_COURSES,
  IZON_BM_COURSE_ENTRIES,
  IZON_BM_COURSE_LESSONS as IZON_BM_COURSE_LESSONS_RAW,
  IZON_BM_COURSE_STORIES,
} from "./courses";
import type { LessonData } from "../../lessons/types";

export const IZON_PODCAST_EPISODES: PodcastEpisode[] = [
  ...IZON_PODCAST_BEGINNER,
  ...IZON_PODCAST_INTERMEDIATE,
  ...IZON_PODCAST_ADVANCED,
];

export const IZON_PODCAST_SERIES: PodcastSeries = {
  id: "izon-pod-longwayhome",
  languageId: "izon",
  // Dedicated season courseId — the podcast is a cross-course narrative, so its
  // StoryArc gets its own id rather than shadowing an existing course's arc
  // (storyArcs.courseId is UNIQUE in the DB).
  courseId: "course-izon-longwayhome",
  title: "The Long Way Home",
  nativeTitle: "Bou Mie",
  logline: {
    en: "A young Izon returns from the city to the creeks — and learns to belong again, one word at a time.",
    fr: "Un jeune Izon revient de la ville vers les ruisseaux — et réapprend à appartenir, un mot à la fois.",
  },
  description: {
    en: "Bou Mie ('coming to the creek') follows Tari, a city-raised Izon, home to Grandmother Ebiere's village for the season of the water-spirit festival. Across nine episodes — from a first stumbled greeting at the jetty to speaking a praise at the libation — the learner rises with Tari from stranger to keeper of the words. Recurring cast, one season-long story, three styles and lengths at every level.",
    fr: "Bou Mie ('arriver au ruisseau') suit Tari, un Izon élevé en ville, de retour au village de Grand-mère Ebiere pour la saison de la fête des esprits de l'eau. En neuf épisodes, l'apprenant s'élève avec Tari, d'étranger à gardien des paroles.",
  },
  arc:
    "Tari comes home to Isampou for the Seigbein festival. Grandmother Ebiere, growing old, wants Tari able to 'carry the words' — to stand and speak for the family at the water. Beginner: arrival, the household, the market. Intermediate: the working river (the fish are fewer), the Ekine masquerade, a family union. Advanced: a dispute settled by proverb, the Woyengi creation story, and the festival libation where Tari finally speaks. An environmental thread — the creeks under strain, the water spirits withdrawn — binds the season and pays off at the closing pour.",
  cast: IZON_CAST,
  episodeIds: [
    "izon-pod-b1",
    "izon-pod-b2",
    "izon-pod-b3",
    "izon-pod-i1",
    "izon-pod-i2",
    "izon-pod-i3",
    "izon-pod-a1",
    "izon-pod-a2",
    "izon-pod-a3",
  ],
  coverEmoji: "🛶", // 🛶 canoe
  coverGradient: ["#0E3A46", "#C4862A"], // creek teal → bronze gold (Museum accent)
};

// ── Go-live curation ─────────────────────────────────────────────────────────
// Everything else in Bou Mie still goes live per the owner's call. The items
// below are held back because the educator review
// (userio-docs/izon_educator_translation_worksheet.csv) found their Izon
// FABRICATED — teki / ina ẹrẹ / ẹrẹmẹ are unattested, and "Baịyo" means GOODBYE,
// not "good evening". Those forms have been replaced with [[placeholders]], and a
// placeholder must never reach a learner (podcast-types.ts: any [[placeholder]]
// ⇒ isActive:false). Clear an id from these sets only once a keeper has supplied
// the attested form — not before.
const HELD_PODCAST_IDS = new Set<string>(["izon-pod-b1"]);
const HELD_COURSE_LESSON_IDS = new Set<string>(["izon-bmc-b1", "izon-bmc-b2"]);
const withGoLive = (l: LessonData, held: Set<string>): LessonData => ({
  ...l,
  isActive: !held.has(l.id),
});

// ── App-shaped views (adapters). Import these when wiring into the app. ──
export const IZON_PODCAST_LESSONS = IZON_PODCAST_EPISODES.map(toLessonData).map(
  (l) => withGoLive(l, HELD_PODCAST_IDS),
);
export const IZON_BM_COURSE_LESSONS = IZON_BM_COURSE_LESSONS_RAW.map((l) =>
  withGoLive(l, HELD_COURSE_LESSON_IDS),
);
export const IZON_PODCAST_STORY = toStoryArc(
  IZON_PODCAST_SERIES,
  IZON_PODCAST_EPISODES,
);
/** publishedAt is passed in by the integrator (Date.* is avoided in data). */
export function buildIzonPodcastDiscoverItem(publishedAt: string) {
  return toDiscoverItem(IZON_PODCAST_SERIES, IZON_PODCAST_EPISODES, publishedAt);
}

// ── Films (mini-series) — app-shaped views ──────────────────────────────────
export { IZON_FILMS } from "./films";
/** Discover cards (type "film"); integrator supplies publishedAt or uses each film's. */
const IZON_CAST_NAMES: Record<string, string> = Object.fromEntries(
  IZON_CAST.map((c) => [c.id, c.name]),
);
export const IZON_FILM_DISCOVER_ITEMS = IZON_FILMS.map((f) =>
  toFilmDiscoverItem(f, undefined, IZON_CAST_NAMES),
);

// ── Courses (the podcast-world companion) — app-shaped views ─────────────────
export {
  IZON_BM_COURSES,
  IZON_BM_COURSE_ENTRIES,
  IZON_BM_COURSE_STORIES,
} from "./courses";
// IZON_BM_COURSE_LESSONS is re-exported above with go-live curation applied.

// ── Content validation. Call in a test; returns issues (empty = clean). ──
export const IZON_PODCAST_ISSUES = validatePodcast(
  IZON_PODCAST_SERIES,
  IZON_PODCAST_EPISODES,
);
export const IZON_FILM_ISSUES = validateFilms("izon", IZON_FILMS);
export const IZON_COURSE_ISSUES = IZON_BM_COURSES.flatMap(validateCourse);

/** One combined view of everything in the Izon media package. */
export const IZON_MEDIA_ISSUES = [
  ...IZON_PODCAST_ISSUES.map((i) => ({ kind: "podcast" as const, ...i })),
  ...IZON_FILM_ISSUES.map((i) => ({ kind: "film" as const, ...i })),
  ...IZON_COURSE_ISSUES.map((i) => ({ kind: "course" as const, ...i })),
];

export { IZON_CAST } from "./cast";
