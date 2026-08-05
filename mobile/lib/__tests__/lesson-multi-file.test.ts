import {
  buildLessonFile,
  buildLessonsFile,
  LESSON_SEPARATOR,
  LESSON_TEMPLATE_CSV,
  parseLessonFile,
  parseLessonFiles,
  type ExportedLesson,
} from "../lesson-import";

/**
 * The lesson export only earns its name if the file it produces is a file the
 * importer reads back. These tests serialize lessons, parse the result, and
 * assert the values survived — the same round-trip guard the content export has.
 */

const lesson = (over: Partial<ExportedLesson> = {}): ExportedLesson => ({
  id: "izon-m1-greeting",
  meta: {
    title: "A Visit",
    description: "Greetings",
    type: "lesson",
    gameKey: "",
    style: "skit",
    artist: "",
    genre: "",
    duration: "90",
    order: "3",
    canDo: "Greet an elder",
    narrativeIntro: "",
    narrativeOutro: "",
  },
  segments: [
    { text: "Nene! Baidẹ!", translation: "Grandmother! Good morning!", speaker: "Child", roman: "" },
    { text: "Tau! Bo dẹkị.", translation: "Grandchild! Come in.", speaker: "Nene", roman: "" },
  ],
  checks: [],
  ...over,
});

describe("parseLessonFiles", () => {
  it("reads a file with no separator as exactly one lesson", () => {
    // Every sheet written before the separator existed has to keep working.
    const parsed = parseLessonFiles(LESSON_TEMPLATE_CSV);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual(parseLessonFile(LESSON_TEMPLATE_CSV));
  });

  it("splits a file into one lesson per separator", () => {
    const file = buildLessonsFile([
      lesson({ meta: { ...lesson().meta, title: "First" } }),
      lesson({ meta: { ...lesson().meta, title: "Second" } }),
      lesson({ meta: { ...lesson().meta, title: "Third" } }),
    ]);
    const parsed = parseLessonFiles(file);
    expect(parsed.map((p) => p.meta.title)).toEqual(["First", "Second", "Third"]);
  });

  it("ignores blank chunks from a trailing or doubled separator", () => {
    const file = `${buildLessonFile(lesson())}\n${LESSON_SEPARATOR}\n\n${LESSON_SEPARATOR}\n`;
    expect(parseLessonFiles(file)).toHaveLength(1);
  });

  it("keeps each lesson's sections to itself", () => {
    // The bug the separator exists to prevent: without it, everything after the
    // second `---` is read as the checks grid, so a following lesson's metadata
    // was silently swallowed as malformed check rows.
    const withChecks = lesson({
      checks: [{ type: "meaning", prompt: "What does Baidẹ mean?", answer: "Good morning", options: "Good morning|Goodbye", explanation: "", afterSegmentIndex: "0" }],
    });
    const parsed = parseLessonFiles(buildLessonsFile([withChecks, lesson({ meta: { ...lesson().meta, title: "Second" } })]));
    expect(parsed).toHaveLength(2);
    expect(parsed[0].checks).toHaveLength(1);
    expect(parsed[1].meta.title).toBe("Second");
    expect(parsed[1].segments).toHaveLength(2);
  });
});

describe("buildLessonFile", () => {
  it("round-trips metadata, transcript and checks", () => {
    const source = lesson({
      checks: [{ type: "cloze", prompt: "Finish it", answer: "Bo", options: "Bo|Tau", explanation: "note", afterSegmentIndex: "1" }],
    });
    const [parsed] = parseLessonFiles(buildLessonFile(source));

    expect(parsed.meta).toMatchObject({
      title: "A Visit", description: "Greetings", type: "lesson",
      style: "skit", duration: "90", order: "3", canDo: "Greet an elder",
    });
    expect(parsed.segments).toEqual(source.segments);
    expect(parsed.checks).toEqual(source.checks);
  });

  it("carries gameKey so an exported gate still runs its game", () => {
    const gate = lesson({ meta: { ...lesson().meta, title: "Movement 1 gate", type: "game", gameKey: "matching-game" } });
    const [parsed] = parseLessonFiles(buildLessonFile(gate));
    expect(parsed.meta.type).toBe("game");
    expect(parsed.meta.gameKey).toBe("matching-game");
  });

  it("omits the checks section for a lesson with none", () => {
    // Absent means "leave existing checks alone"; an empty section means "delete
    // them". A stale export must not wipe checks added after it was downloaded.
    const parsed = parseLessonFiles(buildLessonFile(lesson()))[0];
    expect("checks" in parsed).toBe(false);
  });

  it("drops metadata keys with no value rather than writing blank rows", () => {
    const file = buildLessonFile(lesson());
    expect(file).not.toContain("gameKey,");
    expect(file).not.toContain("artist,");
  });

  it("survives a title holding commas and quotes", () => {
    const odd = lesson({ meta: { ...lesson().meta, title: '"Bo, dẹkị" — come in', description: "Has, commas" } });
    const [parsed] = parseLessonFiles(buildLessonFile(odd));
    expect(parsed.meta.title).toBe('"Bo, dẹkị" — come in');
    expect(parsed.meta.description).toBe("Has, commas");
  });

  it("quotes transcript cells containing commas", () => {
    const commas = lesson({
      segments: [{ text: "Bo, dẹkị", translation: "Come, in", speaker: "Nene", roman: "" }],
    });
    const [parsed] = parseLessonFiles(buildLessonFile(commas));
    expect(parsed.segments[0]).toEqual({ text: "Bo, dẹkị", translation: "Come, in", speaker: "Nene", roman: "" });
  });
});
