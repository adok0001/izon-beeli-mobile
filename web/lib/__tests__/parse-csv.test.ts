import { parseCsv, slugify } from "../parse-csv";

describe("parseCsv", () => {
  it("parses a header row into keyed records", () => {
    const rows = parseCsv("word,english\nakwaaba,welcome\nmedaase,thank you");
    expect(rows).toEqual([
      { word: "akwaaba", english: "welcome" },
      { word: "medaase", english: "thank you" },
    ]);
  });

  it("returns no records when only a header is present", () => {
    expect(parseCsv("word,english")).toEqual([]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips punctuation and collapses separators", () => {
    expect(slugify("  Bou Mie: The Keeper's Words!  ")).toBe("bou-mie-the-keeper-s-words");
  });
});
