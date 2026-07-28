// Pure-mapping guard for the unified CSV importer. mapUnifiedRow is the whole
// contract between the one spreadsheet educators fill and the per-type importers,
// so lock down the field routing here. The db is mocked only so importing the
// module (which pulls in the connection) doesn't require a live database.

jest.mock("../../db/index.js", () => ({ db: {} }));

import { mapUnifiedRow } from "../bulk-import.js";

const LANG = "izon";

describe("mapUnifiedRow", () => {
  it("routes a dictionary row and synthesizes a stable id from the word", () => {
    const out = mapUnifiedRow(
      { type: "dictionary", text: "kọn", english: "take", category: "verbs", example: "Bo okpu kọn." },
      LANG,
    );
    expect(out).toEqual({
      importerType: "dictionary",
      entry: expect.objectContaining({
        id: expect.stringMatching(/^izon-kon-[0-9a-z]+$/), // readable stem, subdot ọ → o
        word: "kọn",
        english: "take",
        category: "verbs",
        example: "Bo okpu kọn.",
      }),
    });
  });

  it("gives words that differ only by diacritic or case distinct ids", () => {
    // The live Izon corpus has 1,042 such groups (Keni / kèní / Kẹnị, Angọ /
    // ango). A slug-only id merged them, so importing one overwrote the other.
    const idFor = (word: string) => {
      const out = mapUnifiedRow({ type: "dictionary", text: word, english: "…", category: "nouns" }, LANG);
      return "entry" in out ? (out.entry.id as string) : "";
    };
    const ids = ["Keni", "kèní", "Kẹnị", "keni"].map(idFor);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("synthesizes the same id for the same word, so a re-import updates in place", () => {
    const idFor = (english: string) => {
      const out = mapUnifiedRow({ type: "dictionary", text: "kọn", english, category: "verbs" }, LANG);
      return "entry" in out ? out.entry.id : "";
    };
    // Correcting the gloss must not fork the entry — only the headword feeds the id.
    expect(idFor("take")).toBe(idFor("take, carry"));
  });

  it("ignores Unicode normalization form when deriving the id", () => {
    // A sheet authored on macOS arrives NFD; the same word from Windows is NFC.
    const nfc = mapUnifiedRow({ type: "dictionary", text: "kọn".normalize("NFC"), english: "take", category: "verbs" }, LANG);
    const nfd = mapUnifiedRow({ type: "dictionary", text: "kọn".normalize("NFD"), english: "take", category: "verbs" }, LANG);
    expect("entry" in nfc && nfc.entry.id).toBe("entry" in nfd ? nfd.entry.id : "");
  });

  it("keeps an explicit id when the row provides one", () => {
    const out = mapUnifiedRow({ type: "dictionary", id: "izon-verb-kon", text: "kọn", english: "take", category: "verbs" }, LANG);
    expect("entry" in out && out.entry.id).toBe("izon-verb-kon");
  });

  it("derives sentence kind = blank when the answer appears in the sentence", () => {
    const out = mapUnifiedRow({ type: "sentence", text: "Mị kasị.", english: "This is a chair.", answer: "kasị" }, LANG);
    expect(out).toEqual({
      importerType: "sentences",
      entry: { sentence: "Mị kasị.", answer: "kasị", englishSentence: "This is a chair.", kind: "blank" },
    });
  });

  it("derives sentence kind = equivalent when the answer is not in the sentence", () => {
    const out = mapUnifiedRow({ type: "sentence", text: "Good morning.", english: "A greeting.", answer: "hello" }, LANG);
    expect("entry" in out && out.entry.kind).toBe("equivalent");
  });

  it("maps a proverb row's english to translation and keeps meaning", () => {
    const out = mapUnifiedRow({ type: "proverb", text: "…", english: "A single hand…", meaning: "Cooperation." }, LANG);
    expect(out).toEqual({
      importerType: "proverbs",
      entry: { text: "…", translation: "A single hand…", meaning: "Cooperation." },
    });
  });

  it("splits pipe-separated quiz options and reads the question type from category", () => {
    const out = mapUnifiedRow(
      { type: "quiz", text: "kọn", english: "take", category: "word-to-english", options: "take | come |go| see" },
      LANG,
    );
    expect(out).toEqual({
      importerType: "quiz",
      entry: { type: "word-to-english", prompt: "kọn", answer: "take", options: ["take", "come", "go", "see"] },
    });
  });

  it("rejects an unknown type with a helpful message", () => {
    const out = mapUnifiedRow({ type: "scenario", text: "x" }, LANG);
    expect("error" in out && out.error).toMatch(/unknown type "scenario"/);
  });
});
