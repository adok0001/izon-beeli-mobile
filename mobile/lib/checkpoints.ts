import type { Course, Lesson } from "@/types";
import { contentLessons, gameLessons, pathCourses } from "@/lib/course-path";

/**
 * Gate model — the required mini-games punctuating the journey path.
 *
 * Two kinds, doing two different jobs:
 *
 *  - **intro**  opens each course. It *previews* the vocabulary the course is
 *               about to teach, so it is deliberately NOT pass/fail — a learner
 *               can't fail content they haven't met yet. Playing it clears it.
 *  - **checkpoint** sits after every run of five lessons and *tests* them.
 *               Retrieval practice over a block the learner has started to
 *               forget, scored, and cleared only at `CHECKPOINT_PASS_RATIO`.
 *
 * Both are grouped per course, so a course reads as: on-ramp → five lessons →
 * checkpoint → five lessons → checkpoint → …
 *
 * Gating is derived by walking the ordered path rather than doing arithmetic on
 * lesson indices. Index arithmetic is what previously made every lesson past
 * the fifth look gated on day one, and it can't express a gate that sits at a
 * course boundary rather than a multiple of five.
 *
 * Pure and deterministic, like `lib/journey`, so the rules can be unit tested
 * without React or a network.
 */

export const CHECKPOINT_INTERVAL = 5;

/**
 * The round format a gate runs. Rotated so consecutive gates never repeat and a
 * learner meets every format as they go.
 */
export type CheckpointFormat = "recall" | "listen" | "build" | "match";

export const CHECKPOINT_FORMATS: CheckpointFormat[] = ["recall", "listen", "build", "match"];

/** Fraction of questions that must be correct to clear a *checkpoint*. */
export const CHECKPOINT_PASS_RATIO = 0.7;

/** How many of a course's lessons an intro previews. */
const INTRO_PREVIEW_SIZE = CHECKPOINT_INTERVAL;

export type GateKind = "intro" | "checkpoint";

export type CheckpointStatus =
  /** Its lessons aren't all complete yet — not reachable, and gates nothing. */
  | "locked"
  /** Reachable and uncleared: this is the gate standing in the learner's way. */
  | "active"
  /** Cleared; whatever sits beyond it is open. */
  | "done";

export interface Checkpoint {
  /** Stable across content edits: `intro-<courseId>` or `cp-<anchorLessonId>`. */
  id: string;
  kind: GateKind;
  /** 1-based position among gates of this kind on the path ("Checkpoint 3"). */
  ordinal: number;
  /** Course this gate belongs to. */
  courseId: string;
  /** The lessons it draws its questions from, in path order. */
  lessonIds: string[];
  /** The lesson it sits directly after. Absent on intros, which open a course. */
  anchorLessonId?: string;
  /**
   * The `type: "game"` row occupying this slot, when the course declares one.
   * It carries the game's authored vocabulary — words held back from the
   * transcripts precisely so the closing game could draw on them.
   */
  gameLessonId?: string;
  /**
   * The playground mini-game this gate runs instead of its built-in round, taken
   * from the game row's `gameKey`. Absent means no game row, or one that names
   * none — either way the gate falls back to `format`.
   */
  gameKey?: string;
  format: CheckpointFormat;
  status: CheckpointStatus;
}

/** Whether a gate is scored. Intros are exposure, not assessment. */
export function isScored(checkpoint: Pick<Checkpoint, "kind">): boolean {
  return checkpoint.kind === "checkpoint";
}

// ── Ids ──────────────────────────────────────────────────────────────────────

export function checkpointIdFor(anchorLessonId: string): string {
  return `cp-${anchorLessonId}`;
}

export function introIdFor(courseId: string): string {
  return `intro-${courseId}`;
}

/** Whether an id names an intro gate. The server relies on this shape too. */
export function isIntroId(id: string): boolean {
  return id.startsWith("intro-");
}

/** The lesson id a checkpoint id was minted from. Inverse of `checkpointIdFor`. */
export function anchorLessonIdFrom(checkpointId: string): string {
  return checkpointId.startsWith("cp-") ? checkpointId.slice(3) : checkpointId;
}

// ── Path ordering ────────────────────────────────────────────────────────────

/** Rows of one course in `order`, ids breaking ties so the walk is stable. */
function byOrder(courseId: string, rows: Lesson[]): Lesson[] {
  return rows
    .filter((l) => l.courseId === courseId)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

/**
 * The journey path's lessons in the exact order `buildJourney` lays them out:
 * course by course (reference tracks excluded), lessons by `order`.
 *
 * Game rows are excluded. They sit on the path, but as gates — `orderedPathGames`
 * is where they come out, and rendering one as a lesson node would put a stop on
 * the map that no learner can work through.
 */
export function orderedPathLessons(courses: Course[], lessons: Lesson[]): Lesson[] {
  const content = contentLessons(lessons);
  return pathCourses(courses).flatMap((course) => byOrder(course.id, content));
}

/** The block-closing game rows on the path, in the same walking order. */
export function orderedPathGames(courses: Course[], lessons: Lesson[]): Lesson[] {
  const games = gameLessons(lessons);
  return pathCourses(courses).flatMap((course) => byOrder(course.id, games));
}

/** Consecutive runs of lessons sharing a course, in path order. */
function groupByCourse(orderedLessons: Lesson[]): { courseId: string; lessons: Lesson[] }[] {
  const groups: { courseId: string; lessons: Lesson[] }[] = [];
  for (const lesson of orderedLessons) {
    const last = groups[groups.length - 1];
    if (last && last.courseId === lesson.courseId) last.lessons.push(lesson);
    else groups.push({ courseId: lesson.courseId, lessons: [lesson] });
  }
  return groups;
}

// ── Where the games sit ──────────────────────────────────────────────────────

/** A block of lessons and the game that closes it. */
interface Block {
  lessons: Lesson[];
  /** The `type: "game"` row in this slot, when the course declares one. */
  game?: Lesson;
}

/**
 * The blocks of a course, each with the lessons its closing game tests.
 *
 * A Movement is authored as blocks of four lessons plus a game, and the game
 * holds a real slot in the `order` sequence — Movement 1's lessons occupy
 * 1–4, 6–9, … 46–49 with games at 5, 10, … 50. Where those rows exist they say
 * exactly where each block ends, so a block is simply the lessons between one
 * game and the previous.
 *
 * Counting lessons in fives instead lands every gate in the wrong place, and
 * the error compounds: over Movement 1 it gives eight gates rather than ten,
 * the first closing Block 1 *plus Block 2's opening lesson*. That fallback is
 * still right for a course with no authored blocks — contiguous orders and no
 * game rows — so it stays, but only as the fallback.
 *
 * A trailing partial run gets no block either way: a gate that can never be
 * reached would render as a permanent lock.
 */
function courseBlocks(lessons: Lesson[], games: Lesson[]): Block[] {
  if (games.length > 0) {
    let from = 0;
    return games
      .map((game) => {
        const block = lessons.filter((l) => l.order > from && l.order < game.order);
        from = game.order;
        return { lessons: block, game };
      })
      // A block whose lessons have all been retired leaves its game stranded.
      // It gates nothing, so it gets no gate.
      .filter((b) => b.lessons.length > 0);
  }

  const runCount = Math.floor(lessons.length / CHECKPOINT_INTERVAL);
  return Array.from({ length: runCount }, (_, run) => ({
    lessons: lessons.slice(run * CHECKPOINT_INTERVAL, (run + 1) * CHECKPOINT_INTERVAL),
  }));
}

// ── Building ─────────────────────────────────────────────────────────────────

/**
 * Build every gate on the path: one intro per course, plus a checkpoint closing
 * each block of that course (see `checkpointRuns`).
 *
 * A course with no lessons gets no intro — a gate with nothing behind it would
 * render as a permanent lock.
 */
export function buildCheckpoints(
  orderedLessons: Lesson[],
  completedIds: Set<string>,
  passedCheckpointIds: Set<string>,
  orderedGames: Lesson[] = []
): Checkpoint[] {
  const gates: Checkpoint[] = [];
  let formatCursor = 0;
  let introOrdinal = 0;
  let checkpointOrdinal = 0;

  const nextFormat = () => CHECKPOINT_FORMATS[formatCursor++ % CHECKPOINT_FORMATS.length];

  for (const group of groupByCourse(orderedLessons)) {
    if (group.lessons.length === 0) continue;

    const blocks = courseBlocks(
      group.lessons,
      orderedGames.filter((g) => g.courseId === group.courseId)
    );

    // ── Intro: opens the course, previews what it's about to teach ──
    // The preview is the course's first block where one is declared, so an
    // intro doesn't reach past the block boundary into material the first
    // checkpoint won't test. Failing that, its opening lessons.
    const preview = blocks[0]?.lessons ?? group.lessons.slice(0, INTRO_PREVIEW_SIZE);
    const introId = introIdFor(group.courseId);
    introOrdinal += 1;
    gates.push({
      id: introId,
      kind: "intro",
      ordinal: introOrdinal,
      courseId: group.courseId,
      lessonIds: preview.map((l) => l.id),
      format: nextFormat(),
      // An intro has no prerequisites — it's the on-ramp, so it's never locked.
      status: passedCheckpointIds.has(introId) ? "done" : "active",
    });

    // ── Checkpoints: one closing each block of this course ──
    for (const { lessons: covered, game } of blocks) {
      const anchor = covered[covered.length - 1];
      // Named for the game row where there is one: that id outlives edits to
      // the lessons it tests, whereas retiring the anchor lesson would mint a
      // new gate id and re-lock a block the learner has already cleared.
      const id = checkpointIdFor(game?.id ?? anchor.id);
      checkpointOrdinal += 1;
      gates.push({
        id,
        kind: "checkpoint",
        ordinal: checkpointOrdinal,
        courseId: group.courseId,
        lessonIds: covered.map((l) => l.id),
        anchorLessonId: anchor.id,
        ...(game ? { gameLessonId: game.id } : {}),
        // `format` is still assigned even when a game takes over, so the cursor
        // keeps rotating and the fallback is ready if the key is later cleared.
        ...(game?.gameKey ? { gameKey: game.gameKey } : {}),
        format: nextFormat(),
        status: passedCheckpointIds.has(id)
          ? "done"
          : covered.every((l) => completedIds.has(l.id))
            ? "active"
            : "locked",
      });
    }
  }

  return gates;
}

// ── The path as an ordered walk ──────────────────────────────────────────────

export type PathStop =
  | { kind: "lesson"; lesson: Lesson }
  | { kind: "gate"; checkpoint: Checkpoint };

/**
 * Every stop on the path in walking order — intros, lessons and checkpoints
 * interleaved. This is the single source of "what comes after what", used for
 * gating here and for the map's layout in `lib/journey`.
 */
export function buildPathStops(orderedLessons: Lesson[], checkpoints: Checkpoint[]): PathStop[] {
  const introByCourse = new Map(
    checkpoints.filter((c) => c.kind === "intro").map((c) => [c.courseId, c])
  );
  const checkpointByAnchor = new Map(
    checkpoints
      .filter((c) => c.kind === "checkpoint" && c.anchorLessonId)
      .map((c) => [c.anchorLessonId!, c])
  );

  const stops: PathStop[] = [];
  let currentCourseId: string | null = null;

  for (const lesson of orderedLessons) {
    if (lesson.courseId !== currentCourseId) {
      currentCourseId = lesson.courseId;
      const intro = introByCourse.get(lesson.courseId);
      if (intro) stops.push({ kind: "gate", checkpoint: intro });
    }
    stops.push({ kind: "lesson", lesson });
    const gate = checkpointByAnchor.get(lesson.id);
    if (gate) stops.push({ kind: "gate", checkpoint: gate });
  }

  return stops;
}

/**
 * The ids of every lesson currently behind an uncleared gate.
 *
 * Derived by walking the path: once an **active** gate is passed on the walk,
 * everything after it is locked. A `locked` gate deliberately doesn't block —
 * it means the learner hasn't finished its own run yet, so the lessons before
 * it are what stands in the way, not the gate.
 *
 * Callers get an id-keyed answer because the journey map renders one course at
 * a time and can't reason about whole-path positions.
 */
export function gatedLessonIds(
  orderedLessons: Lesson[],
  checkpoints: Checkpoint[]
): Set<string> {
  const gated = new Set<string>();
  let blocked = false;
  for (const stop of buildPathStops(orderedLessons, checkpoints)) {
    if (stop.kind === "gate") {
      if (stop.checkpoint.status === "active") blocked = true;
      continue;
    }
    if (blocked) gated.add(stop.lesson.id);
  }
  return gated;
}

/**
 * The gate standing between the learner and `lessonId`, or undefined if the
 * lesson is reachable.
 *
 * This is what lets the *lesson screen* enforce gating for every entry point at
 * once — the map, "Jump Back In", Up Next, downloads, classroom assignments and
 * deep links all funnel through it, so enforcing there beats teaching each
 * surface about gates.
 */
export function blockingCheckpoint(
  lessonId: string,
  orderedLessons: Lesson[],
  checkpoints: Checkpoint[]
): Checkpoint | undefined {
  let blocker: Checkpoint | undefined;
  for (const stop of buildPathStops(orderedLessons, checkpoints)) {
    if (stop.kind === "gate") {
      if (stop.checkpoint.status === "active" && !blocker) blocker = stop.checkpoint;
      continue;
    }
    if (stop.lesson.id === lessonId) return blocker;
  }
  return undefined;
}

/**
 * The gate a learner lands on after completing `lessonId`, if that lesson is
 * the last before an uncleared gate. This is what turns the lesson summary's
 * "Continue" into a checkpoint hand-off.
 */
export function checkpointAfterLesson(
  lessonId: string,
  checkpoints: Checkpoint[]
): Checkpoint | undefined {
  return checkpoints.find((cp) => cp.anchorLessonId === lessonId && cp.status !== "done");
}

/** Look up a gate by id. */
export function findCheckpoint(
  checkpointId: string,
  checkpoints: Checkpoint[]
): Checkpoint | undefined {
  return checkpoints.find((cp) => cp.id === checkpointId);
}

/**
 * The lesson that follows a gate — where "Continue" goes once it's cleared.
 * For an intro that's the course's first lesson; for a checkpoint, the lesson
 * after its anchor. Undefined when the gate closes out the path.
 */
export function lessonAfterCheckpoint(
  checkpoint: Checkpoint,
  orderedLessons: Lesson[]
): Lesson | undefined {
  // Placing just this one gate is enough to find what follows it: an intro
  // lands at its course boundary, a checkpoint right after its anchor.
  const stops = buildPathStops(orderedLessons, [checkpoint]);
  const idx = stops.findIndex((s) => s.kind === "gate");
  if (idx < 0) return undefined;
  const next = stops.slice(idx + 1).find((s) => s.kind === "lesson");
  return next?.kind === "lesson" ? next.lesson : undefined;
}

/**
 * Whether a score clears the gate. Intros are exposure rather than assessment —
 * playing one clears it, because failing content you haven't been taught yet
 * isn't a meaningful outcome.
 */
export function isPassingScore(
  correct: number,
  total: number,
  kind: GateKind = "checkpoint"
): boolean {
  if (kind === "intro") return true;
  if (total <= 0) return false;
  return correct / total >= CHECKPOINT_PASS_RATIO;
}
