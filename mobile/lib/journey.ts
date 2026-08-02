import type { IconSymbolName } from "@/components/ui/icon-symbol";
import { getCourseTypeColors } from "@/constants/course-colors";
import { buildPathStops, type Checkpoint } from "@/lib/checkpoints";
import { contentLessons, isReferenceCourse, pathCourses } from "@/lib/course-path";
import { BUNDLED_AUDIO } from "@/lib/mock-data";
import { MUSEUM } from "@/lib/use-museum-theme";
import type { Course, CourseType, Lesson, LocalizedText } from "@/types";

/**
 * Journey map model — turns the real course/lesson/progress data into the
 * winding "story map" the Learn tab renders. Pure and deterministic so the
 * layout can be unit-tested without React.
 *
 * Areas  = courses (themed region labels down the path)
 * Nodes  = lessons (discs on the path), ordered course-by-course
 * Status = done (completed) · active (first incomplete) · open (every other
 *          lesson — all levels are unlocked, so any lesson can be started)
 */

/**
 * The story-map "daylight parchment" scene palette. Like the share card, this
 * immersive scene is intentionally mode-invariant — these exact shades come
 * from the design prototype and are not part of the mode-aware Museum tokens.
 * Centralized here (semantic keys, not `color`-named props) so the surface
 * shades live in one documented place rather than scattered across components.
 */
export const JOURNEY = {
  sheetBg: "#FDFAF5",
  sheetTitle: "#2A2018",
  sheetBody: "#5C4F42",
  hairline: "#E0D5C4",
  pillBg: "#F4EFE4",
  pillText: "#5C4F42",
  bronze: "#A66E1C",
  bronzeMid: "#C4862A",
  capLocked: "#8A7C66",
  trackEmpty: "#EDE6D6",
  success: "#16A34A",
  mote: "#FFE6A0",
  discDoneBorder: "#F0D49A",
  discLockedBorder: "#CBBC9F",
} as const;

/**
 * Bronze gradient ramp for a stop on the trail, by status. Shared by the round
 * lesson discs and the diamond checkpoint gates so the two read as the same
 * material — defined once here rather than as parallel hex tables per component.
 */
export const STOP_GRADIENT: Record<NodeStatus, [string, string]> = {
  done: ["#EFC479", "#A66E1C"],
  active: ["#F6D08A", "#B5781E"],
  open: ["#F2D9A0", "#C4862A"],
  locked: ["#EDE6D6", "#D6CAB2"],
};

export type NodeStatus = "done" | "active" | "open" | "locked";

export interface JourneyNode {
  lessonId: string;
  courseId: string;
  title: string | LocalizedText;
  description: string | LocalizedText;
  status: NodeStatus;
  /** 1-based position within its own course (the "Lesson N" label). */
  lessonNumber: number;
  durationSeconds?: number;
  /** Number of key vocabulary words taught (shown in the detail sheet). */
  wordCount?: number;
  skills: string[];
  /** Whether the lesson has playable audio — drives the program preview. */
  hasAudio: boolean;
  /** Whether the lesson carries a transcript/lyrics block. */
  hasTranscript: boolean;
  /** Whether the lesson is a song (story step vs. flashcards step). */
  isSong: boolean;
  /** The owning course's accent hex — tints the label and detail sheet. */
  areaColor: string;
  /** Center coordinates in map space. */
  x: number;
  y: number;
}

export interface JourneyArea {
  courseId: string;
  title: string | LocalizedText;
  /** Localized level ("beginner" | …) used as the area sub-label. */
  level: string;
  icon: IconSymbolName;
  /** Free-form emoji override for the cartouche badge; takes priority over `icon` when set. */
  emoji?: string | null;
  color: string;
  /** Owning course's type — picks the themed scenery drawn behind the nodes. */
  courseType?: CourseType | null;
  /** Short English category gloss shown on the cartouche ("· Community"). */
  gloss: string;
  /** Top of the area label pill in map space. */
  y: number;
}

/** A checkpoint gate laid out as a stop on the trail, between two lesson nodes. */
export interface JourneyCheckpointNode {
  checkpoint: Checkpoint;
  /** Center coordinates in map space. */
  x: number;
  y: number;
}

export interface JourneyData {
  nodes: JourneyNode[];
  areas: JourneyArea[];
  /** Checkpoint gates positioned between lesson nodes. */
  checkpointNodes: JourneyCheckpointNode[];
  /**
   * Every stop on the trail in walking order — lessons and checkpoints
   * interleaved — so the drawn path runs *through* the gates rather than
   * around them.
   */
  trail: { x: number; y: number }[];
  /** How many leading `trail` points are behind the learner (the bronze line). */
  trailDoneCount: number;
  /** Index into `nodes` of the active lesson, or -1 if none is startable. */
  activeIndex: number;
  /** Total scrollable height of the map in map space. */
  height: number;
}

// ── Layout constants (map-space pixels) ──────────────────────────────────────
const TOP_PAD = 124;
const STEP = 132; // vertical gap between consecutive nodes
const CHECKPOINT_STEP = 116; // gap after a checkpoint — slightly tighter than a lesson step
const AREA_GAP = 108; // node-free band reserved above each new area's cartouche
const LABEL_RISE = 92; // how far the cartouche sits above its first node (clears the disc + active pennant)
const BOTTOM_PAD = 176;
const AMP_FRAC = 0.26; // horizontal sway as a fraction of map width

/** Icon per course type — the glyph shown in the floating area label. */
const COURSE_ICON: Record<CourseType, IconSymbolName> = {
  first_words: "sunrise.fill",
  sound_script: "textformat.abc",
  everyday_life: "house.fill",
  numbers_trade: "basket.fill",
  oral_tradition: "sailboat.fill",
  communicative: "bubble.left.fill",
  contemporary: "building.2.fill",
  songs: "music.note",
  colors: "paintpalette.fill",
  house: "house.fill",
  community: "person.2.fill",
  work: "basket.fill",
  modern_life: "building.2.fill",
  grammar: "puzzlepiece.fill",
  script: "pencil",
  mv_arrival: "hand.wave.fill",
  mv_household: "house.fill",
  mv_village: "person.2.fill",
  mv_growing_up: "figure.child",
  mv_threshold: "moon.stars.fill",
  mv_working_year: "basket.fill",
  mv_union: "party.popper.fill",
  mv_assembly: "building.columns.fill",
  mv_elders_voice: "megaphone",
  mv_keeper: "flame.fill",
};

function iconFor(courseType?: CourseType | null): IconSymbolName {
  return (courseType && COURSE_ICON[courseType]) || "mappin";
}

/**
 * Short English category gloss per course type — the "· Community / · House …"
 * tag on each chapter cartouche. Mirrors the themed scenery so the gloss reads
 * as the place the chapter lives in (kitchen, market, waterside, city, …).
 */
const COURSE_GLOSS: Record<CourseType, string> = {
  first_words: "Community",
  community: "Community",
  sound_script: "Script",
  songs: "Songs",
  colors: "Colors",
  grammar: "Grammar",
  everyday_life: "House",
  house: "House",
  communicative: "Kitchen",
  numbers_trade: "Market",
  work: "Market",
  oral_tradition: "Waterside",
  contemporary: "City",
  modern_life: "City",
  script: "Script",
  mv_arrival: "Arrival",
  mv_household: "House",
  mv_village: "Village",
  mv_growing_up: "Waterside",
  mv_threshold: "Threshold",
  mv_working_year: "Market",
  mv_union: "Union",
  mv_assembly: "Assembly",
  mv_elders_voice: "Oratory",
  mv_keeper: "Keeper",
};

function glossFor(courseType?: CourseType | null): string {
  return (courseType && COURSE_GLOSS[courseType]) || "";
}

function colorFor(courseType?: CourseType | null): string {
  const tick = getCourseTypeColors(courseType).tickActive;
  return tick && tick !== "#737373" ? tick : MUSEUM.accent;
}

/**
 * Lessons for a course, sorted by `order` then a stable id fallback.
 *
 * Game rows are dropped: they hold a slot in the same `order` sequence, but
 * they are rendered as gates (`checkpointNodes`), so laying one out as a lesson
 * disc would put a stop on the trail that opens nothing.
 */
function lessonsForCourse(courseId: string, lessons: Lesson[]): Lesson[] {
  return contentLessons(lessons)
    .filter((l) => l.courseId === courseId)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

/** Build the ordered node list with status, before any positions are assigned. */
function orderNodes(
  courses: Course[],
  lessons: Lesson[],
  completedIds: Set<string>,
  gatedIds: Set<string>
): { nodes: JourneyNode[]; activeIndex: number } {
  const nodes: JourneyNode[] = [];
  for (const course of courses) {
    const courseLessons = lessonsForCourse(course.id, lessons);
    courseLessons.forEach((lesson, i) => {
      nodes.push({
        lessonId: lesson.id,
        courseId: course.id,
        title: lesson.title,
        description: lesson.description,
        status: completedIds.has(lesson.id) ? "done" : "open",
        lessonNumber: i + 1,
        durationSeconds: lesson.duration,
        wordCount: lesson.vocab?.length,
        skills: (lesson.skills ?? []) as string[],
        hasAudio: !!(lesson.audioUrl ?? BUNDLED_AUDIO[lesson.id]),
        hasTranscript: !!lesson.transcript?.length,
        isSong: lesson.type === "song",
        areaColor: colorFor(course.courseType),
        x: 0,
        y: 0,
      });
    });
  }

  // Lessons sitting behind an uncleared checkpoint are locked — this is what
  // makes the gate required rather than advisory. Keyed by id, not index: this
  // map is often rendered for a single course, where positions are course-local
  // but gating is defined across the whole path.
  for (const node of nodes) {
    if (node.status !== "done" && gatedIds.has(node.lessonId)) node.status = "locked";
  }

  // The active node is the first lesson that's startable — the "you are here"
  // marker. When the next lesson is behind an uncleared gate there is no active
  // lesson at all: the checkpoint itself is what's in front of the learner.
  const activeIndex = nodes.findIndex((n) => n.status === "open");
  if (activeIndex >= 0) nodes[activeIndex].status = "active";
  return { nodes, activeIndex };
}

/**
 * Assign serpentine positions, emit the area labels at course boundaries, and
 * drop each checkpoint onto the trail after the lesson it follows.
 */
function layoutNodes(
  nodes: JourneyNode[],
  courses: Course[],
  mapWidth: number,
  checkpoints: Checkpoint[]
): {
  areas: JourneyArea[];
  checkpointNodes: JourneyCheckpointNode[];
  trail: { x: number; y: number }[];
  trailDoneCount: number;
  height: number;
} {
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const nodeByLessonId = new Map(nodes.map((n) => [n.lessonId, n]));
  const center = mapWidth / 2;
  const amp = mapWidth * AMP_FRAC;
  const areas: JourneyArea[] = [];
  const checkpointNodes: JourneyCheckpointNode[] = [];
  const trail: { x: number; y: number }[] = [];
  let trailDoneCount = 0;
  // Stops are placed in walking order, so the sway phase has to advance across
  // lessons *and* checkpoints — otherwise a gate would sit on top of a lesson.
  let stop = 0;

  const swayX = () => center + amp * Math.sin(stop * 0.9 + 0.6);

  const pushArea = (courseId: string, atY: number) => {
    const course = courseById.get(courseId);
    areas.push({
      courseId,
      title: course?.title ?? "",
      level: course?.level ?? "",
      icon: iconFor(course?.courseType),
      emoji: course?.emoji,
      color: colorFor(course?.courseType),
      courseType: course?.courseType,
      gloss: glossFor(course?.courseType),
      y: atY - LABEL_RISE,
    });
  };

  // Walk the same ordered stop list the gating rules use, so the map can never
  // disagree with the model about what sits where — an intro opens its course,
  // a checkpoint follows its anchor lesson.
  const stops = buildPathStops(
    nodes.map((n) => ({ id: n.lessonId, courseId: n.courseId }) as unknown as Lesson),
    checkpoints
  );

  let y = TOP_PAD;
  let placedLessons = 0;
  let lastCourseId: string | null = null;

  for (const item of stops) {
    if (item.kind === "gate") {
      const { checkpoint } = item;
      // An intro opens a new area, so the cartouche band is reserved before it
      // rather than before the first lesson.
      if (checkpoint.kind === "intro" && checkpoint.courseId !== lastCourseId) {
        if (placedLessons > 0) y += AREA_GAP;
        lastCourseId = checkpoint.courseId;
        pushArea(checkpoint.courseId, y);
      }
      const x = swayX();
      checkpointNodes.push({ checkpoint, x, y });
      trail.push({ x, y });
      if (checkpoint.status === "done") trailDoneCount = trail.length;
      stop += 1;
      y += CHECKPOINT_STEP;
      continue;
    }

    const node = nodeByLessonId.get(item.lesson.id);
    if (!node) continue;

    // A course with no intro (none built) still needs its area label.
    if (node.courseId !== lastCourseId) {
      if (placedLessons > 0) y += AREA_GAP;
      lastCourseId = node.courseId;
      pushArea(node.courseId, y);
    }

    node.x = swayX();
    node.y = y;
    trail.push({ x: node.x, y: node.y });
    if (node.status === "done") trailDoneCount = trail.length;
    stop += 1;
    placedLessons += 1;
    y += STEP;
  }

  return { areas, checkpointNodes, trail, trailDoneCount, height: y + BOTTOM_PAD };
}

// Course path classification lives in `lib/course-path` so the checkpoint model
// can use it without pulling in this module's mock-data/API dependency chain.
export { isReferenceCourse, pathCourses };

/**
 * Gating input for the map. Both halves are derived from the *whole* language
 * path (see `useCheckpoints`), then handed down — the map itself is usually
 * scoped to one course and can't compute them.
 */
export interface JourneyGate {
  checkpoints: Checkpoint[];
  gatedLessonIds: Set<string>;
}

const NO_GATE: JourneyGate = { checkpoints: [], gatedLessonIds: new Set() };

export function buildJourney(
  courses: Course[],
  lessons: Lesson[],
  completedIds: Set<string>,
  mapWidth: number,
  gate: JourneyGate = NO_GATE
): JourneyData {
  const { checkpoints, gatedLessonIds } = gate;
  const onPath = pathCourses(courses);
  const { nodes, activeIndex } = orderNodes(onPath, lessons, completedIds, gatedLessonIds);
  const { areas, checkpointNodes, trail, trailDoneCount, height } = layoutNodes(
    nodes,
    onPath,
    mapWidth,
    checkpoints
  );
  return { nodes, areas, checkpointNodes, trail, trailDoneCount, activeIndex, height };
}

/**
 * Per-course progress — computed client-side since `Course.progress` is never
 * populated by the API. Filter all-language lessons by courseId and count hits
 * in the completedIds set.
 */
export function courseProgress(
  lessons: Lesson[],
  completedIds: Set<string>,
  courseId: string
): { completed: number; total: number; percent: number } {
  // Games are excluded from the denominator: there is no completion row for a
  // game, so counting them would hold every finished course short of 100%.
  const courseLessons = contentLessons(lessons).filter((l) => l.courseId === courseId);
  const completed = courseLessons.filter((l) => completedIds.has(l.id)).length;
  const total = courseLessons.length;
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
}

/** Return the next course in the ordered list after `courseId`, or null. */
export function nextCourse(courses: Course[], courseId: string): Course | null {
  const idx = courses.findIndex((c) => c.id === courseId);
  return idx >= 0 ? (courses[idx + 1] ?? null) : null;
}

/**
 * 1-based unit number of `courseId` within the numbered journey path.
 * Reference tracks are off the path and return 0 — callers label them
 * "Reference" instead of "Unit N".
 */
export function courseUnitNumber(courses: Course[], courseId: string): number {
  const course = courses.find((c) => c.id === courseId);
  if (course && isReferenceCourse(course)) return 0;
  const idx = pathCourses(courses).findIndex((c) => c.id === courseId);
  return idx >= 0 ? idx + 1 : 1;
}

/**
 * Approximate week-strip: returns a boolean[7] (Sun…Sat) where true = that day
 * is part of the learner's current streak. Derived from summary fields only —
 * no per-day history endpoint exists yet, so days older than the streak window
 * may be inaccurate, but today and yesterday are always correct.
 */
export function weekStreakDays(
  streak: number,
  refreshedToday: boolean,
  streakBroken: boolean,
  today: Date = new Date()
): boolean[] {
  const result = Array(7).fill(false) as boolean[];
  if (streak <= 0 || (streakBroken && !refreshedToday)) return result;
  const todayIdx = today.getDay(); // 0=Sun … 6=Sat
  // Determine which day is the last "active" day
  const lastActiveIdx = refreshedToday ? todayIdx : ((todayIdx + 6) % 7);
  const daysToMark = Math.min(streak, 7);
  for (let i = 0; i < daysToMark; i++) {
    result[(lastActiveIdx - i + 7) % 7] = true;
  }
  return result;
}

/** Map course type to its icon — exported so CourseArtwork can reuse it. */
export { COURSE_ICON };

/**
 * A CEFR-style proficiency label derived from how far along the language path
 * the learner is (e.g. 7% → "A1.1"). Six bands (A1…C2), each split into two
 * sub-levels, so the header's "Niveau" cell reflects real progress.
 */
export function pathLevelLabel(percent: number): string {
  const bands = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const span = 100 / bands.length; // ~16.67% per band
  const clamped = Math.max(0, Math.min(99.999, percent));
  const idx = Math.floor(clamped / span);
  const sub = clamped - idx * span < span / 2 ? 1 : 2;
  return `${bands[idx]}.${sub}`;
}

/**
 * Smooth cubic path through the given points — the same vertical-tangent easing
 * the design prototype used, so the trail flows rather than zig-zags.
 */
export function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dy = (b.y - a.y) * 0.5;
    d += ` C ${a.x.toFixed(1)} ${(a.y + dy).toFixed(1)}, ${b.x.toFixed(1)} ${(
      b.y - dy
    ).toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  return d;
}
