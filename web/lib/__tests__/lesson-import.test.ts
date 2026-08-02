import { LESSON_TEMPLATE_CSV, parseLessonFile } from "../lesson-import";

describe("parseLessonFile", () => {
  it("splits the template into a metadata block and a transcript grid", () => {
    const { meta, segments } = parseLessonFile(LESSON_TEMPLATE_CSV);
    expect(meta.title).toBe("A Visit to Grandmother's House");
    expect(meta.style).toBe("skit");
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ text: "Nene! Baidẹ!", speaker: "Child" });
  });

  it("keeps commas in a metadata value (split on the first comma only)", () => {
    const { meta } = parseLessonFile("title,Greetings\ndescription,Hello, welcome, and sit\n---\ntext\na");
    expect(meta.description).toBe("Hello, welcome, and sit");
  });

  it("drops blank transcript rows and rows without text", () => {
    const { segments } = parseLessonFile("title,T\ndescription,d\n---\ntext,translation\nkeni,one\n,two\n");
    expect(segments).toHaveLength(1);
    expect(segments[0].text).toBe("keni");
  });

  it("yields empty segments when the --- separator is missing", () => {
    const { meta, segments } = parseLessonFile("title,T\ndescription,d\ntext,a");
    expect(meta.title).toBe("T");
    expect(segments).toEqual([]);
  });

  it("extracts a checks section after a second --- instead of swallowing it into the transcript", () => {
    const parsed = parseLessonFile(
      [
        "title,T", "description,d",
        "---",
        "text,translation,speaker,roman",
        "Nene! Baidẹ!,Grandmother!,Child,",
        "Tau!,Grandchild!,Nene,",
        "---",
        "type,prompt,answer,options,explanation,afterSegmentIndex",
        "meaning,What does Baidẹ mean?,Good morning,Good morning|Goodbye,,0",
      ].join("\n"),
    );
    expect(parsed.segments.map((s) => s.text)).toEqual(["Nene! Baidẹ!", "Tau!"]);
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

  it("omits `checks` when there is no third section, so the server leaves existing checks alone", () => {
    const parsed = parseLessonFile("title,T\ndescription,d\n---\ntext\na");
    expect("checks" in parsed).toBe(false);
  });

  it("ships a template whose checks row round-trips", () => {
    const parsed = parseLessonFile(LESSON_TEMPLATE_CSV);
    expect(parsed.checks).toHaveLength(1);
    expect(parsed.checks?.[0].type).toBe("meaning");
  });
});
