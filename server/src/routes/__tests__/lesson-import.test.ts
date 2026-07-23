// Build guard for the bulk lesson importer. One file is one lesson — a metadata
// block plus transcript lines — so buildLessonGroup validates and assembles a
// single lesson from `{ meta, segments }`. db is mocked only so importing the
// module (which pulls in the connection) needs no live database.

jest.mock("../../db/index.js", () => ({ db: {} }));

import { buildLessonGroup, lessonImportId } from "../lesson-import.js";

const COURSE = "edu-course-1";

describe("buildLessonGroup", () => {
  it("assembles a lesson from metadata + transcript lines, preserving order", () => {
    const { group, errors } = buildLessonGroup(
      {
        meta: { title: "A Visit to Grandmother", description: "Greetings", style: "skit", artist: "Ada", duration: "120" },
        segments: [
          { text: "Nene! Baidẹ!", translation: "Grandmother! Good morning!", speaker: "Child" },
          { text: "Tau! Bo dẹkị.", translation: "Grandchild! Come in.", speaker: "Nene", roman: "tau" },
        ],
      },
      COURSE,
      0,
    );
    expect(errors).toEqual([]);
    expect(group).toMatchObject({
      id: lessonImportId(COURSE, "A Visit to Grandmother"),
      title: "A Visit to Grandmother",
      description: "Greetings",
      type: "lesson",
      style: "skit",
      artist: "Ada",
      duration: 120,
    });
    expect(group!.segments.map((s) => s.text)).toEqual(["Nene! Baidẹ!", "Tau! Bo dẹkị."]);
    expect(group!.segments.map((s) => s.order)).toEqual([0, 1]);
    expect(group!.segments[1].roman).toBe("tau");
  });

  it("rejects a missing title, description, or transcript, and an invalid style", () => {
    const noTitle = buildLessonGroup({ meta: { description: "d" }, segments: [{ text: "a" }] }, COURSE, 0);
    expect(noTitle.group).toBeNull();
    expect(noTitle.errors[0].reason).toMatch(/File 1: missing title/);

    const noLines = buildLessonGroup({ meta: { title: "T", description: "d" }, segments: [] }, COURSE, 2);
    expect(noLines.group).toBeNull();
    expect(noLines.errors[0].reason).toMatch(/no transcript lines/);

    const badStyle = buildLessonGroup(
      { meta: { title: "T", description: "d", style: "musical" }, segments: [{ text: "a" }] },
      COURSE,
      0,
    );
    expect(badStyle.group).toBeNull();
    expect(badStyle.errors[0].reason).toMatch(/style must be one of/);
  });

  it("skips blank transcript rows and defaults optional metadata", () => {
    const { group } = buildLessonGroup(
      { meta: { title: "Numbers", description: "Count" }, segments: [{ text: "keni" }, { text: "" }, { translation: "two" }] },
      COURSE,
      0,
    );
    expect(group!.segments).toHaveLength(1);
    expect(group!.type).toBe("lesson");
    expect(group!.order).toBe(999);
    expect(group!.style).toBeNull();
  });

  it("keeps the lesson id within the 64-char column limit", () => {
    expect(lessonImportId("a".repeat(60), "A Very Long Lesson Title That Keeps Going").length).toBeLessThanOrEqual(64);
  });
});
