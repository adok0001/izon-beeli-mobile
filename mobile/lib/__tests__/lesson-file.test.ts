import { parseLessonFile, LESSON_TEMPLATE_CSV } from "../lesson-import";

const META = ["title,A Visit", "description,Greetings"];
const GRID = ["text,translation,speaker,roman", "Nene! Baidẹ!,Grandmother!,Child,", "Tau!,Grandchild!,Nene,"];

describe("parseLessonFile checks section", () => {
  it("omits `checks` entirely when the file has no third section", () => {
    // Absent must stay distinguishable from empty: the server reads absent as
    // "leave this lesson's checks alone" and empty as "remove them".
    const parsed = parseLessonFile([...META, "---", ...GRID].join("\n"));
    expect("checks" in parsed).toBe(false);
    expect(parsed.segments).toHaveLength(2);
  });

  it("reads a checks grid after a second separator", () => {
    const parsed = parseLessonFile(
      [
        ...META, "---", ...GRID, "---",
        "type,prompt,answer,options,explanation,afterSegmentIndex",
        "meaning,What does Baidẹ mean?,Good morning,Good morning|Goodbye,,0",
      ].join("\n"),
    );
    expect(parsed.segments).toHaveLength(2);
    expect(parsed.checks).toEqual([
      {
        type: "meaning",
        prompt: "What does Baidẹ mean?",
        answer: "Good morning",
        options: "Good morning|Goodbye",
        explanation: "",
        afterSegmentIndex: "0",
      },
    ]);
  });

  it("keeps an empty checks section as an empty list, not an absent one", () => {
    const parsed = parseLessonFile(
      [...META, "---", ...GRID, "---", "type,prompt,answer,options,explanation,afterSegmentIndex"].join("\n"),
    );
    expect(parsed.checks).toEqual([]);
  });

  it("does not let the checks grid leak into the transcript", () => {
    const parsed = parseLessonFile(
      [...META, "---", ...GRID, "---", "type,prompt,answer", "meaning,q,a"].join("\n"),
    );
    expect(parsed.segments.map((s) => s.text)).toEqual(["Nene! Baidẹ!", "Tau!"]);
  });

  it("drops check rows with no prompt", () => {
    const parsed = parseLessonFile(
      [...META, "---", ...GRID, "---", "type,prompt,answer", "meaning,,a", "meaning,q,a"].join("\n"),
    );
    expect(parsed.checks).toHaveLength(1);
  });

  it("round-trips the shipped template", () => {
    const parsed = parseLessonFile(LESSON_TEMPLATE_CSV);
    expect(parsed.meta.title).toBeTruthy();
    expect(parsed.segments).toHaveLength(2);
    expect(parsed.checks).toHaveLength(1);
    expect(parsed.checks?.[0].type).toBe("meaning");
  });
});
