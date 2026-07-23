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
});
