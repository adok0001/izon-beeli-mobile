import type { Course, CourseType, Lesson } from "@/types";

/**
 * Which courses count as steps on the numbered journey path.
 *
 * Split out of `lib/journey` so consumers that only need the classification
 * (the checkpoint model, tests) don't pull in the map layout's dependency chain
 * — `journey` imports `mock-data`, which reaches the API/netinfo layer and
 * can't load outside a React Native runtime. `lib/journey` re-exports both
 * helpers, so existing import sites are unaffected.
 */

/**
 * Reference tracks (Grammar & Structure, Sounds & Script, dictionary-scale
 * drill shelves, the Old Stories and Songs shelves) sit OFF the numbered
 * journey path — they support every Movement rather than being a step on it.
 * They stay reachable via the "Explore All Courses" rail below the map.
 *
 * `order` runs in bands, and the threshold is what separates journey from shelf:
 *
 *   1–10    the ten Movements, Arrival → The Keeper — the whole journey
 *   20, 21  the Old Stories and Songs shelves — feeder content folded into the
 *           Movements, not steps of their own (mobile/docs/izon-course-plan.md)
 *   23      the dictionary drill shelf
 *   100+    reference tracks from the original journey migration
 *
 * The threshold was 100, which knew only "Movement" and "reference". That put
 * `course-izon-dc` — 343 auto-generated "Dictionary A–Z" rows at order 23 with
 * courseType `communicative` — ON the path, where it contributed 78% of the
 * journey map's nodes. 20 puts everything above the Movement band on a shelf.
 */
const REFERENCE_COURSE_TYPES = new Set<CourseType>(["grammar", "sound_script", "script"]);
const REFERENCE_ORDER_THRESHOLD = 20;

export function isReferenceCourse(course: Pick<Course, "courseType" | "order">): boolean {
  if (course.courseType && REFERENCE_COURSE_TYPES.has(course.courseType)) return true;
  return course.order != null && course.order >= REFERENCE_ORDER_THRESHOLD;
}

/** The numbered journey path — every course except the reference tracks. */
export function pathCourses(courses: Course[]): Course[] {
  return courses.filter((c) => !isReferenceCourse(c));
}

/**
 * Whether a row is a block-closing mini-game rather than a lesson.
 *
 * A Movement is authored as blocks of four lessons plus a closing game, and the
 * game occupies a real slot in the course's `order` sequence — Movement 1's sit
 * at 5, 10, … 50. Storing them as rows makes the gate positions explicit rather
 * than inferred, and gives the game's authored vocabulary somewhere to live
 * that an educator can edit like any other content.
 *
 * The cost is that `/lessons` serves them alongside lessons, so every surface
 * that counts or lists *lessons* has to say so. That is what these two helpers
 * are for; the catalog itself deliberately still carries both, because the
 * journey path needs to know where the games are.
 */
export function isGameLesson(lesson: Pick<Lesson, "type">): boolean {
  return lesson.type === "game";
}

/** Lessons proper — what a learner works through, and what progress counts. */
export function contentLessons(lessons: Lesson[]): Lesson[] {
  return lessons.filter((l) => !isGameLesson(l));
}

/** The block-closing games, which mark where the gates sit. */
export function gameLessons(lessons: Lesson[]): Lesson[] {
  return lessons.filter(isGameLesson);
}
