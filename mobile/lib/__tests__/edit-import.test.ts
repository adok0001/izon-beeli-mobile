// `toCsv` has to be the exact inverse of the parser, because the whole feature
// is "export, edit three cells, upload the same file back". Anything the writer
// mangles and the reader can't recover shows up as a spurious change on every
// row — or worse, as a silent corruption the educator never sees.

import { buildEditCsv, encodeEditCell, parseEditCsv, toCsv } from "../edit-import";

const COLUMNS = ["id", "word", "english", "example"];

describe("toCsv / parseEditCsv round trip", () => {
  const cases: { name: string; row: Record<string, string> }[] = [
    { name: "a plain row", row: { id: "d1", word: "kọn", english: "take", example: "Bo okpu kọn." } },
    { name: "commas", row: { id: "d2", word: "ago", english: "Metal, enamel cup", example: "" } },
    { name: "double quotes", row: { id: "d3", word: 'a"b', english: 'she said "no"', example: "" } },
    { name: "a newline inside a cell", row: { id: "d4", word: "x", english: "line one\nline two", example: "" } },
    { name: "a leading formula character", row: { id: "d5", word: "-a", english: "=SUM(A1)", example: "@here" } },
    { name: "an apostrophe before a formula character", row: { id: "d6", word: "'-x", english: "'=y", example: "" } },
    { name: "an escaped clear sentinel", row: { id: "d7", word: "x", english: "\\--", example: "" } },
    { name: "the bare clear sentinel", row: { id: "d8", word: "x", english: "--", example: "" } },
    { name: "empty cells", row: { id: "d9", word: "", english: "", example: "" } },
  ];

  it.each(cases)("survives $name", ({ row }) => {
    expect(parseEditCsv(toCsv([row], COLUMNS))).toEqual([row]);
  });

  it("survives every tricky row in one sheet", () => {
    const rows = cases.map((c) => c.row);
    expect(parseEditCsv(toCsv(rows, COLUMNS))).toEqual(rows);
  });

  it("reads a sheet Excel saved with a BOM", () => {
    const csv = toCsv([{ id: "d1", word: "kọn", english: "take", example: "" }], COLUMNS);
    // Excel's Save-As is exactly what an educator does to a downloaded export.
    const parsed = parseEditCsv(`﻿${csv}`);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("d1"); // not "﻿id", which would read as a missing id
  });

  it("drops rows with no id rather than treating them as new words", () => {
    const csv = ["id,word,english,example", ",orphan,stray,", "d1,kọn,take,"].join("\n");
    expect(parseEditCsv(csv).map((r) => r.id)).toEqual(["d1"]);
  });

  // Edge whitespace is intentionally not preserved — the parser trims, which is
  // also why " -- " reads as the clear sentinel.
  it("trims edge whitespace on the way in", () => {
    const csv = toCsv([{ id: "d1", word: "  kọn  ", english: "take", example: "" }], COLUMNS);
    expect(csv).toContain('"  kọn  "'); // quoted on the way out, so a spreadsheet keeps it
    expect(parseEditCsv(csv)[0].word).toBe("kọn");
  });
});

describe("encodeEditCell", () => {
  it("escapes only a cell that would read as the clear sentinel", () => {
    expect(encodeEditCell("--")).toBe("\\--");
    expect(encodeEditCell("\\--")).toBe("\\\\--");
    expect(encodeEditCell("-a signifies a question")).toBe("-a signifies a question");
    expect(encodeEditCell("take")).toBe("take");
  });
});

describe("buildEditCsv", () => {
  it("escapes a literal `--` so the server doesn't read it as a clear", () => {
    const csv = buildEditCsv([{ id: "d1", word: "x", english: "--", example: "" }], COLUMNS);
    // parseEditCsv leaves the sentinel encoded — only the server decodes it.
    expect(parseEditCsv(csv)[0].english).toBe("\\--");
  });

  it("fills missing columns with blanks rather than shifting cells", () => {
    const csv = buildEditCsv([{ id: "d1", word: "kọn" }], COLUMNS);
    expect(csv.trim().split("\n")[1]).toBe("d1,kọn,,");
  });
});
