import { parseUnifiedCsv, UNIFIED_COLUMNS, UNIFIED_TEMPLATE_CSV } from "../unified-import";

describe("unified-import", () => {
  it("template header matches the declared column order", () => {
    const header = UNIFIED_TEMPLATE_CSV.split("\n")[0];
    expect(header).toBe(UNIFIED_COLUMNS.join(","));
  });

  it("template round-trips into one row per content type", () => {
    const rows = parseUnifiedCsv(UNIFIED_TEMPLATE_CSV);
    // Two dictionary rows: a plain entry, and one demonstrating the
    // semicolon-separated-senses convention.
    expect(rows.map((r) => r.type)).toEqual(["dictionary", "dictionary", "sentence", "proverb", "quiz"]);
  });

  it("drops rows with no type (stray blank lines)", () => {
    const rows = parseUnifiedCsv("type,text,english\ndictionary,kọn,take\n,,\n");
    expect(rows).toHaveLength(1);
    expect(rows[0].text).toBe("kọn");
  });
});
