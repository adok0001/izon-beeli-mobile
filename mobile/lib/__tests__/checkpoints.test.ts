import {
  blockingCheckpoint,
  buildCheckpoints,
  buildPathStops,
  checkpointAfterLesson,
  checkpointIdFor,
  anchorLessonIdFrom,
  gatedLessonIds,
  introIdFor,
  isIntroId,
  isPassingScore,
  isScored,
  lessonAfterCheckpoint,
  orderedPathGames,
  orderedPathLessons,
  CHECKPOINT_INTERVAL,
} from "../checkpoints";
import type { Course, Lesson } from "@/types";

function lesson(id: string, courseId: string, order: number): Lesson {
  return { id, courseId, order, title: id, description: "" } as Lesson;
}

/** A block-closing game row — a real slot on the path, but not a lesson. */
function game(id: string, courseId: string, order: number): Lesson {
  return { ...lesson(id, courseId, order), type: "game" };
}

function course(id: string, order: number, courseType: Course["courseType"] = "first_words"): Course {
  return { id, order, courseType, title: id, level: "beginner" } as Course;
}

/**
 * Two courses: c1 has 7 lessons (intro + one checkpoint after c1-l5),
 * c2 has 5 (intro + one checkpoint after c2-l5).
 */
function fixture() {
  const courses = [course("c1", 1), course("c2", 2)];
  const lessons = [
    ...Array.from({ length: 7 }, (_, i) => lesson(`c1-l${i + 1}`, "c1", i + 1)),
    ...Array.from({ length: 5 }, (_, i) => lesson(`c2-l${i + 1}`, "c2", i + 1)),
  ];
  return { courses, lessons, ordered: orderedPathLessons(courses, lessons) };
}

const { ordered: ORDERED } = fixture();

const INTRO_C1 = introIdFor("c1");
const INTRO_C2 = introIdFor("c2");
const CP_C1 = checkpointIdFor("c1-l5");
const CP_C2 = checkpointIdFor("c2-l5");

/** Both intros cleared — the common starting state once a learner is moving. */
const INTROS_DONE = new Set([INTRO_C1, INTRO_C2]);
const C1_RUN_DONE = new Set(["c1-l1", "c1-l2", "c1-l3", "c1-l4", "c1-l5"]);

describe("orderedPathLessons", () => {
  it("orders course by course, then by lesson order", () => {
    expect(ORDERED.map((l) => l.id)).toEqual([
      "c1-l1", "c1-l2", "c1-l3", "c1-l4", "c1-l5", "c1-l6", "c1-l7",
      "c2-l1", "c2-l2", "c2-l3", "c2-l4", "c2-l5",
    ]);
  });

  it("excludes reference tracks from the path", () => {
    const courses = [course("c1", 1), course("ref", 101, "grammar")];
    const lessons = [lesson("c1-l1", "c1", 1), lesson("ref-l1", "ref", 1)];
    expect(orderedPathLessons(courses, lessons).map((l) => l.id)).toEqual(["c1-l1"]);
  });
});

describe("buildCheckpoints", () => {
  const gates = buildCheckpoints(ORDERED, new Set(), new Set());

  it("opens every course with an intro", () => {
    const intros = gates.filter((g) => g.kind === "intro");
    expect(intros.map((g) => g.courseId)).toEqual(["c1", "c2"]);
  });

  it("places a checkpoint after each complete run of five within a course", () => {
    const cps = gates.filter((g) => g.kind === "checkpoint");
    expect(cps.map((g) => g.anchorLessonId)).toEqual(["c1-l5", "c2-l5"]);
  });

  it("does not carry a run across a course boundary", () => {
    // c1's trailing l6/l7 must not combine with c2's lessons into a run.
    const cps = gates.filter((g) => g.kind === "checkpoint");
    for (const cp of cps) {
      const courses = new Set(cp.lessonIds.map((id) => id.split("-")[0]));
      expect(courses.size).toBe(1);
    }
  });

  it("gives a checkpoint exactly the five lessons before it", () => {
    const cp = gates.find((g) => g.id === CP_C1)!;
    expect(cp.lessonIds).toEqual(["c1-l1", "c1-l2", "c1-l3", "c1-l4", "c1-l5"]);
    expect(cp.lessonIds).toHaveLength(CHECKPOINT_INTERVAL);
  });

  it("previews the course's opening lessons in its intro", () => {
    const intro = gates.find((g) => g.id === INTRO_C1)!;
    expect(intro.lessonIds).toEqual(["c1-l1", "c1-l2", "c1-l3", "c1-l4", "c1-l5"]);
  });

  it("previews only what a short course has", () => {
    const courses = [course("c1", 1)];
    const lessons = Array.from({ length: 3 }, (_, i) => lesson(`l${i + 1}`, "c1", i + 1));
    const short = buildCheckpoints(orderedPathLessons(courses, lessons), new Set(), new Set());
    expect(short.find((g) => g.kind === "intro")!.lessonIds).toEqual(["l1", "l2", "l3"]);
  });

  it("leaves a trailing partial run without an unreachable checkpoint", () => {
    const courses = [course("c1", 1)];
    const lessons = Array.from({ length: 9 }, (_, i) => lesson(`l${i + 1}`, "c1", i + 1));
    const built = buildCheckpoints(orderedPathLessons(courses, lessons), new Set(), new Set());
    expect(built.filter((g) => g.kind === "checkpoint")).toHaveLength(1);
  });

  /**
   * A Movement is authored as blocks of four lessons plus a closing game. The
   * lessons occupy orders 1-4, 6-9, … and a `type: "game"` row holds each
   * multiple of five. Movement 1's real shape: 40 lessons, 10 games at orders
   * 5, 10, … 50.
   */
  describe("authored block grid", () => {
    const BLOCKS = 10;
    const COURSES = [course("m1", 1)];

    /** 4 lessons then a game row, per block. */
    const movementRows = (blocks = BLOCKS) =>
      Array.from({ length: blocks }, (_, b) => [
        ...[1, 2, 3, 4].map((n) => {
          const order = b * CHECKPOINT_INTERVAL + n;
          return lesson(`m1-${String(order).padStart(2, "0")}`, "m1", order);
        }),
        game(`m1-g${b + 1}`, "m1", (b + 1) * CHECKPOINT_INTERVAL),
      ]).flat();

    const build = (rows: Lesson[]) =>
      buildCheckpoints(
        orderedPathLessons(COURSES, rows),
        new Set(),
        new Set(),
        orderedPathGames(COURSES, rows)
      );

    const built = build(movementRows());
    const cps = built.filter((g) => g.kind === "checkpoint");

    it("puts one gate in every game slot", () => {
      expect(cps).toHaveLength(BLOCKS);
    });

    it("keeps game rows off the lesson path", () => {
      // A game is a stop, but not one a learner works through — rendering it as
      // a lesson node would put an unopenable disc on the map.
      const path = orderedPathLessons(COURSES, movementRows());
      expect(path).toHaveLength(BLOCKS * 4);
      expect(path.some((l) => l.id.includes("-g"))).toBe(false);
    });

    it("names each gate for its game row, not its last lesson", () => {
      // The game id outlives edits to the lessons it tests; retiring the anchor
      // lesson would otherwise mint a new gate id and re-lock a cleared block.
      expect(cps.map((g) => g.id)).toEqual(
        Array.from({ length: BLOCKS }, (_, b) => `cp-m1-g${b + 1}`)
      );
      expect(cps[0].gameLessonId).toBe("m1-g1");
    });

    it("closes each block on its own last lesson", () => {
      expect(cps.map((g) => g.anchorLessonId)).toEqual([
        "m1-04", "m1-09", "m1-14", "m1-19", "m1-24",
        "m1-29", "m1-34", "m1-39", "m1-44", "m1-49",
      ]);
    });

    it("never lets a gate reach into the next block", () => {
      // Counting lessons in fives instead would give this gate orders 1,2,3,4,6
      // — Block 1 plus Block 2's opening lesson — and drift further each block.
      expect(cps[0].lessonIds).toEqual(["m1-01", "m1-02", "m1-03", "m1-04"]);
      expect(cps[1].lessonIds).toEqual(["m1-06", "m1-07", "m1-08", "m1-09"]);
    });

    it("still gates the block that closes the course", () => {
      // Slot 50 sits past every lesson, so a rule that only looks *between*
      // lessons would drop Block 10's game entirely.
      expect(cps[BLOCKS - 1].lessonIds).toEqual(["m1-46", "m1-47", "m1-48", "m1-49"]);
    });

    it("previews the first block, not the first five lessons", () => {
      const intro = built.find((g) => g.kind === "intro")!;
      expect(intro.lessonIds).toEqual(["m1-01", "m1-02", "m1-03", "m1-04"]);
    });

    it("strands no gate on a block whose lessons were all retired", () => {
      // Block 2's four lessons are gone but its game row remains. A gate with
      // nothing behind it can never be reached, so it renders as a permanent
      // lock — it must not be built at all.
      const rows = movementRows(3).filter((r) => !/^m1-(0[6-9])$/.test(r.id));
      const gates = build(rows).filter((g) => g.kind === "checkpoint");
      expect(gates.map((g) => g.id)).toEqual(["cp-m1-g1", "cp-m1-g3"]);
      // …and block 3 keeps its own lessons rather than absorbing the gap.
      expect(gates[1].lessonIds).toEqual(["m1-11", "m1-12", "m1-13", "m1-14"]);
    });

    it("falls back to counting runs for a course with no game rows", () => {
      // Most courses are authored as a flat run of lessons and declare no
      // blocks. They still get gates — every five lessons, as before.
      const courses = [course("c", 1)];
      const lessons = Array.from({ length: 12 }, (_, i) => lesson(`l${i + 1}`, "c", i + 1));
      const built = buildCheckpoints(orderedPathLessons(courses, lessons), new Set(), new Set());
      const cps = built.filter((g) => g.kind === "checkpoint");
      expect(cps.map((g) => g.anchorLessonId)).toEqual(["l5", "l10"]);
      expect(cps.every((g) => g.gameLessonId === undefined)).toBe(true);
    });
  });

  it("rotates format so consecutive gates differ", () => {
    for (let i = 1; i < gates.length; i++) {
      expect(gates[i].format).not.toBe(gates[i - 1].format);
    }
  });

  describe("status", () => {
    it("makes an intro active immediately — it has no prerequisites", () => {
      expect(gates.find((g) => g.id === INTRO_C1)!.status).toBe("active");
      expect(gates.find((g) => g.id === INTRO_C2)!.status).toBe("active");
    });

    it("marks an intro done once played", () => {
      const played = buildCheckpoints(ORDERED, new Set(), new Set([INTRO_C1]));
      expect(played.find((g) => g.id === INTRO_C1)!.status).toBe("done");
    });

    it("locks a checkpoint until every covered lesson is complete", () => {
      const partial = new Set(["c1-l1", "c1-l2", "c1-l3", "c1-l4"]);
      const built = buildCheckpoints(ORDERED, partial, new Set());
      expect(built.find((g) => g.id === CP_C1)!.status).toBe("locked");
    });

    it("activates a checkpoint once its run is complete", () => {
      const built = buildCheckpoints(ORDERED, C1_RUN_DONE, new Set());
      expect(built.find((g) => g.id === CP_C1)!.status).toBe("active");
    });

    it("marks a checkpoint done once cleared", () => {
      const built = buildCheckpoints(ORDERED, new Set(), new Set([CP_C1]));
      expect(built.find((g) => g.id === CP_C1)!.status).toBe("done");
    });
  });

  it("keys checkpoint ids off the anchor lesson so they survive later edits", () => {
    const { courses, lessons } = fixture();
    const grown = orderedPathLessons(courses, [...lessons, lesson("c2-l6", "c2", 6)]);
    const after = buildCheckpoints(grown, new Set(), new Set());
    expect(after.some((g) => g.id === CP_C1)).toBe(true);
  });
});

describe("buildPathStops", () => {
  const gates = buildCheckpoints(ORDERED, new Set(), new Set());
  const stops = buildPathStops(ORDERED, gates);

  it("opens the path with the first course's intro", () => {
    expect(stops[0]).toMatchObject({ kind: "gate" });
    expect(stops[0].kind === "gate" && stops[0].checkpoint.id).toBe(INTRO_C1);
  });

  it("places each intro immediately before its course's first lesson", () => {
    const i = stops.findIndex((s) => s.kind === "gate" && s.checkpoint.id === INTRO_C2);
    const next = stops[i + 1];
    expect(next.kind === "lesson" && next.lesson.id).toBe("c2-l1");
  });

  it("places each checkpoint immediately after its anchor lesson", () => {
    const i = stops.findIndex((s) => s.kind === "gate" && s.checkpoint.id === CP_C1);
    const prev = stops[i - 1];
    expect(prev.kind === "lesson" && prev.lesson.id).toBe("c1-l5");
  });

  it("includes every lesson exactly once", () => {
    const lessonIds = stops.filter((s) => s.kind === "lesson").map((s) => (s as { lesson: Lesson }).lesson.id);
    expect(lessonIds).toEqual(ORDERED.map((l) => l.id));
  });
});

describe("gatedLessonIds", () => {
  it("locks a course behind its own intro before anything is played", () => {
    const gates = buildCheckpoints(ORDERED, new Set(), new Set());
    const gated = gatedLessonIds(ORDERED, gates);
    // The very first intro is active, so everything after it is behind a gate.
    expect(gated.has("c1-l1")).toBe(true);
  });

  it("opens the first course once its intro is played", () => {
    const gates = buildCheckpoints(ORDERED, new Set(), new Set([INTRO_C1]));
    const gated = gatedLessonIds(ORDERED, gates);
    expect(gated.has("c1-l1")).toBe(false);
    expect(gated.has("c1-l5")).toBe(false);
  });

  // The regression that shipped: a `locked` checkpoint (run unfinished) was
  // treated as gating, so a learner who had completed nothing found the rest of
  // the course locked behind a gate they could not open.
  it("does not gate on a checkpoint whose own run is unfinished", () => {
    const gates = buildCheckpoints(ORDERED, new Set(), INTROS_DONE);
    const gated = gatedLessonIds(ORDERED, gates);
    for (const l of ORDERED) expect(gated.has(l.id)).toBe(false);
  });

  it("gates the rest of the path once a checkpoint goes active", () => {
    const gates = buildCheckpoints(ORDERED, C1_RUN_DONE, INTROS_DONE);
    const gated = gatedLessonIds(ORDERED, gates);
    expect(gated.has("c1-l5")).toBe(false);
    expect(gated.has("c1-l6")).toBe(true);
    expect(gated.has("c2-l1")).toBe(true);
  });

  it("reopens the path once that checkpoint is cleared", () => {
    const gates = buildCheckpoints(ORDERED, C1_RUN_DONE, new Set([...INTROS_DONE, CP_C1]));
    expect(gatedLessonIds(ORDERED, gates).size).toBe(0);
  });

  it("gates nothing when every gate is cleared", () => {
    const all = new Set([...INTROS_DONE, CP_C1, CP_C2]);
    const gates = buildCheckpoints(ORDERED, C1_RUN_DONE, all);
    expect(gatedLessonIds(ORDERED, gates).size).toBe(0);
  });
});

describe("blockingCheckpoint", () => {
  it("names the intro blocking a course's first lesson", () => {
    const gates = buildCheckpoints(ORDERED, new Set(), new Set());
    expect(blockingCheckpoint("c1-l1", ORDERED, gates)?.id).toBe(INTRO_C1);
  });

  it("returns nothing for a reachable lesson", () => {
    const gates = buildCheckpoints(ORDERED, new Set(), INTROS_DONE);
    expect(blockingCheckpoint("c1-l3", ORDERED, gates)).toBeUndefined();
  });

  it("names the active checkpoint blocking a later lesson", () => {
    const gates = buildCheckpoints(ORDERED, C1_RUN_DONE, INTROS_DONE);
    expect(blockingCheckpoint("c1-l6", ORDERED, gates)?.id).toBe(CP_C1);
  });

  it("stops blocking once that gate is cleared", () => {
    const gates = buildCheckpoints(ORDERED, C1_RUN_DONE, new Set([...INTROS_DONE, CP_C1]));
    expect(blockingCheckpoint("c1-l6", ORDERED, gates)).toBeUndefined();
  });

  // Whatever gatedLessonIds locks, blockingCheckpoint must be able to name —
  // otherwise a lesson is unreachable with nothing to open it.
  it("always names a gate for every lesson it locks", () => {
    for (const passed of [new Set<string>(), INTROS_DONE, new Set([...INTROS_DONE, CP_C1])]) {
      const gates = buildCheckpoints(ORDERED, C1_RUN_DONE, passed);
      const gated = gatedLessonIds(ORDERED, gates);
      for (const lessonId of gated) {
        expect(blockingCheckpoint(lessonId, ORDERED, gates)).toBeDefined();
      }
    }
  });
});

describe("checkpointAfterLesson", () => {
  it("returns the gate when the lesson closes a run", () => {
    const gates = buildCheckpoints(ORDERED, C1_RUN_DONE, INTROS_DONE);
    expect(checkpointAfterLesson("c1-l5", gates)?.id).toBe(CP_C1);
  });

  it("returns nothing mid-run", () => {
    const gates = buildCheckpoints(ORDERED, C1_RUN_DONE, INTROS_DONE);
    expect(checkpointAfterLesson("c1-l3", gates)).toBeUndefined();
  });

  it("returns nothing once the gate is already cleared", () => {
    const gates = buildCheckpoints(ORDERED, C1_RUN_DONE, new Set([...INTROS_DONE, CP_C1]));
    expect(checkpointAfterLesson("c1-l5", gates)).toBeUndefined();
  });
});

describe("lessonAfterCheckpoint", () => {
  const gates = buildCheckpoints(ORDERED, new Set(), new Set());

  it("sends an intro into its course's first lesson", () => {
    const intro = gates.find((g) => g.id === INTRO_C2)!;
    expect(lessonAfterCheckpoint(intro, ORDERED)?.id).toBe("c2-l1");
  });

  it("sends a checkpoint into the lesson that opens the next run", () => {
    const cp = gates.find((g) => g.id === CP_C1)!;
    expect(lessonAfterCheckpoint(cp, ORDERED)?.id).toBe("c1-l6");
  });

  it("returns nothing when the gate closes out the path", () => {
    const cp = gates.find((g) => g.id === CP_C2)!;
    expect(lessonAfterCheckpoint(cp, ORDERED)).toBeUndefined();
  });
});

describe("gate kind", () => {
  it("recognises an intro id", () => {
    expect(isIntroId(INTRO_C1)).toBe(true);
    expect(isIntroId(CP_C1)).toBe(false);
  });

  it("recovers the anchor lesson id from a checkpoint id", () => {
    expect(anchorLessonIdFrom(CP_C1)).toBe("c1-l5");
  });

  it("scores checkpoints but not intros", () => {
    expect(isScored({ kind: "checkpoint" })).toBe(true);
    expect(isScored({ kind: "intro" })).toBe(false);
  });
});

describe("isPassingScore", () => {
  it("passes a checkpoint at or above 70%", () => {
    expect(isPassingScore(7, 10)).toBe(true);
    expect(isPassingScore(8, 10)).toBe(true);
  });

  it("fails a checkpoint below 70%", () => {
    expect(isPassingScore(6, 10)).toBe(false);
  });

  it("treats an empty checkpoint round as a failure rather than a free pass", () => {
    expect(isPassingScore(0, 0)).toBe(false);
  });

  // An intro previews content the learner hasn't been taught yet — scoring it
  // would gate them on material the course hasn't covered.
  it("always clears an intro, whatever the score", () => {
    expect(isPassingScore(0, 8, "intro")).toBe(true);
    expect(isPassingScore(3, 8, "intro")).toBe(true);
  });
});
