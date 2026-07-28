// The merge is where bulk edit can quietly lose data: a naive version drops
// glosses it never saw a column for, lets `project()` put French in the NOT NULL
// `english` column, and reports every row as changed because a spreadsheet
// round-trip flipped the Unicode normalization. Each of those has a test here.
//
// No `jest.mock("../../db/index.js")` — edit-merge imports nothing that touches
// a connection, which is the point of keeping it separate from the route.

import {
  decodeCell,
  diffFields,
  lengthError,
  mergeGlossMap,
  mergeRequired,
  mergeScalar,
  projectMap,
  sameMap,
  sameText,
} from "../edit-merge.js";

const LOCALES = ["en", "fr", "pcm", "ar", "pt"];

/** Written NFC here; a spreadsheet round trip is what decomposes it. */
const WORD = "k\u1ECDn";

describe("decodeCell", () => {
  it("treats blank and absent alike as leave-unchanged", () => {
    expect(decodeCell("")).toEqual({ kind: "skip" });
    expect(decodeCell("   ")).toEqual({ kind: "skip" });
    expect(decodeCell(undefined)).toEqual({ kind: "skip" });
  });

  it("clears on the bare sentinel, including one padded by the parser's trim", () => {
    expect(decodeCell("--")).toEqual({ kind: "clear" });
    expect(decodeCell(" -- ")).toEqual({ kind: "clear" });
  });

  it("unescapes `\\--` to a literal two dashes", () => {
    expect(decodeCell("\\--")).toEqual({ kind: "set", value: "--" });
    expect(decodeCell("\\\\--")).toEqual({ kind: "set", value: "\\--" });
  });

  it("leaves an ordinary value alone even when it starts with a dash", () => {
    expect(decodeCell("-a signifies a question")).toEqual({ kind: "set", value: "-a signifies a question" });
  });
});

describe("mergeScalar", () => {
  it("keeps the current value for a blank cell", () => {
    expect(mergeScalar("bitter", "")).toBe("bitter");
    expect(mergeScalar(null, undefined)).toBeNull();
  });

  it("clears on `--` and sets otherwise", () => {
    expect(mergeScalar("bitter", "--")).toBeNull();
    expect(mergeScalar("bitter", "sour")).toBe("sour");
  });

  it("writes NFC even when the sheet came back decomposed", () => {
    const nfc = WORD.normalize("NFC");
    const nfd = WORD.normalize("NFD");
    expect(nfd).not.toBe(nfc); // guard: the fixture really differs
    expect(mergeScalar(null, nfd)).toBe(nfc);
  });
});

describe("mergeRequired", () => {
  it("rejects `--` on a NOT NULL column rather than silently ignoring it", () => {
    expect(mergeRequired("kọn", "--", "word")).toEqual({
      error: '"word" is required and cannot be cleared with "--"',
    });
  });

  it("passes through blanks and edits", () => {
    expect(mergeRequired("kọn", "", "word")).toEqual({ value: "kọn" });
    expect(mergeRequired("kọn", "kón", "word")).toEqual({ value: "kón" });
  });
});

describe("mergeGlossMap", () => {
  it("preserves a gloss whose column the sheet never carried", () => {
    const current = { en: "take", fr: "prendre", pcm: "collect" };
    // A partial export: only `english` and `english:fr` columns exist.
    const merged = mergeGlossMap(current, { english: "carry", "english:fr": "" }, "english", LOCALES);
    expect(merged).toEqual({ en: "carry", fr: "prendre", pcm: "collect" });
  });

  it("clears one locale without disturbing the others", () => {
    const merged = mergeGlossMap(
      { en: "take", fr: "prendre" },
      { english: "", "english:fr": "--" },
      "english",
      LOCALES,
    );
    expect(merged).toEqual({ en: "take" });
  });

  it("never lets a non-en gloss reach the flat column when `en` is hydrated", () => {
    // The legacy shape: translations === null, hydrated to { en: <flat> }.
    const hydrated = { en: "take" };
    const merged = mergeGlossMap(hydrated, { "english:fr": "prendre" }, "english", LOCALES);
    expect(projectMap(merged)).toEqual({ flat: "take", map: { en: "take", fr: "prendre" } });
  });

  it("recomputes the flat column from the merged map, not from the CSV cell", () => {
    const merged = mergeGlossMap({ en: "take" }, { english: "carry" }, "english", LOCALES);
    expect(projectMap(merged).flat).toBe("carry");
  });

  it("collapses an emptied map to a null column pair", () => {
    const merged = mergeGlossMap({ en: "…" }, { exampleTranslation: "--" }, "exampleTranslation", LOCALES);
    expect(projectMap(merged)).toEqual({ flat: null, map: null });
  });
});

describe("NFC equivalence", () => {
  it("treats the two normalizations of the same word as equal", () => {
    const nfc = WORD.normalize("NFC");
    const nfd = WORD.normalize("NFD");
    expect(nfc).not.toBe(nfd); // guard: a spreadsheet really can flip these
    expect(sameText(nfc, nfd)).toBe(true);
    expect(sameMap({ en: nfc }, { en: nfd })).toBe(true);
  });

  it("still sees a real difference", () => {
    expect(sameText("torú", "toru")).toBe(false);
  });
});

describe("diffFields", () => {
  // The acceptance property of the whole feature: export -> re-upload unmodified
  // -> nothing reports as changed, even after a spreadsheet decomposed a vowel.
  it("reports nothing when a round-tripped row comes back identical", () => {
    const row = {
      word: WORD.normalize("NFC"),
      english: "take",
      translations: { en: "take" },
      pronunciation: null,
    };
    expect(diffFields(row, { ...row, word: WORD.normalize("NFD") })).toEqual([]);
  });

  it("names each changed field with its before and after", () => {
    expect(
      diffFields(
        { english: "take", category: "verbs" },
        { english: "carry", category: "verbs" },
      ),
    ).toEqual([{ field: "english", before: "take", after: "carry" }]);
  });

  it("renders a map change as JSON rather than [object Object]", () => {
    const [change] = diffFields({ translations: { en: "take" } }, { translations: { en: "take", fr: "prendre" } });
    expect(change).toEqual({
      field: "translations",
      before: '{"en":"take"}',
      after: '{"en":"take","fr":"prendre"}',
    });
  });

  it("distinguishes a cleared field from an unchanged null", () => {
    expect(diffFields({ example: "Bo okpu kọn." }, { example: null })).toEqual([
      { field: "example", before: "Bo okpu kọn.", after: null },
    ]);
    expect(diffFields({ example: null }, { example: null })).toEqual([]);
  });
});

describe("lengthError", () => {
  it("catches a varchar overflow before Postgres does", () => {
    expect(lengthError("word", "x".repeat(501))).toBe('"word" is 501 characters — the column holds 500');
    expect(lengthError("semanticDomain", "x".repeat(201))).toContain("holds 200");
  });

  it("ignores unbounded and null values", () => {
    expect(lengthError("example", "x".repeat(5000))).toBeNull();
    expect(lengthError("word", null)).toBeNull();
  });
});
