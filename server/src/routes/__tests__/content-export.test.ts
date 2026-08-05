// The content export only earns its name if what comes down can go back up.
// These tests take a stored row, flatten it the way the export does, and hand
// the result to `mapUnifiedRow` — the exact path a re-uploaded sheet takes —
// then assert the values survived. Anything the export forgets to write shows
// up here as a field that came back empty or changed.
//
// The db is mocked only so importing the modules (which pull in the connection)
// doesn't require a live database; nothing here touches it.

jest.mock("../../db/index.js", () => ({ db: {} }));

import { CONTENT_EXPORT_SPECS } from "../content-export.js";
import { mapUnifiedRow } from "../bulk-import.js";

const LANG = "izon";

/** Flatten with the export, then read back with the importer. */
function roundTrip(type: keyof typeof CONTENT_EXPORT_SPECS, stored: never) {
  const spec = CONTENT_EXPORT_SPECS[type];
  const sheetRow = (spec.toRow as (r: unknown) => Record<string, string>)(stored);
  const mapped = mapUnifiedRow(sheetRow, LANG);
  if ("error" in mapped) throw new Error(`re-import rejected the export: ${mapped.error}`);
  return { sheetRow, entry: mapped.entry, columns: spec.columns };
}

describe("every exported cell has a column", () => {
  // A cell with no header is a cell `toCsv` drops on the floor — the row would
  // serialize short and the value would never reach the file.
  it.each(Object.keys(CONTENT_EXPORT_SPECS) as (keyof typeof CONTENT_EXPORT_SPECS)[])(
    "%s",
    (type) => {
      const spec = CONTENT_EXPORT_SPECS[type];
      const sample: Record<string, unknown> = {
        id: "x", word: "w", english: "e", translations: { en: "e", fr: "f" },
        category: "nouns", pronunciation: "p", tone: "high", example: "ex",
        exampleTranslation: "et", exampleTranslations: { en: "et", fr: "ef" },
        sentence: "s", englishSentence: "es", answer: "a", kind: "blank",
        text: "t", translation: "tr", meaning: "m", meaningTranslations: { en: "m" },
        type: "word-to-english", prompt: "pr", options: ["a", "b"],
      };
      const row = (spec.toRow as (r: unknown) => Record<string, string>)(sample);
      expect(Object.keys(row).sort()).toEqual(
        Object.keys(row).filter((k) => spec.columns.includes(k)).sort(),
      );
    },
  );
});

describe("dictionary round trip", () => {
  const stored = {
    id: "izon-kon-a1b2",
    word: "kọn",
    english: "take",
    translations: { en: "take", fr: "prendre", pcm: "collect" },
    category: "verbs",
    pronunciation: "kɔ̃",
    tone: "high",
    example: "Bo okpu kọn.",
    exampleTranslation: "Come and take the sugarcane.",
    exampleTranslations: { en: "Come and take the sugarcane.", fr: "Viens prendre la canne." },
  };

  it("keeps the id, so a re-upload updates the same entry rather than forking it", () => {
    const { entry } = roundTrip("dictionary", stored as never);
    expect(entry.id).toBe(stored.id);
  });

  it("carries every gloss, not just English", () => {
    // The importer rebuilds the whole map from these columns and overwrites what
    // is stored, so a dropped locale is a deleted translation — the single most
    // destructive thing an incomplete export could do.
    const { sheetRow, entry } = roundTrip("dictionary", stored as never);
    expect(sheetRow["english:fr"]).toBe("prendre");
    expect(sheetRow["english:pcm"]).toBe("collect");
    expect(entry["english:fr"]).toBe("prendre");
    expect(entry["exampleTranslation:fr"]).toBe("Viens prendre la canne.");
  });

  it("preserves the fields the blank template has no column for", () => {
    const { entry } = roundTrip("dictionary", stored as never);
    expect(entry).toMatchObject({
      word: "kọn",
      english: "take",
      category: "verbs",
      pronunciation: "kɔ̃",
      tone: "high",
      example: "Bo okpu kọn.",
      exampleTranslation: "Come and take the sugarcane.",
    });
  });

  it("exports English from the flat column for rows written before the gloss map", () => {
    const legacy = { ...stored, translations: null, exampleTranslations: null };
    const { sheetRow } = roundTrip("dictionary", legacy as never);
    expect(sheetRow.english).toBe("take");
    expect(sheetRow.example_english).toBe("Come and take the sugarcane.");
  });

  it("writes a blank cell, never undefined, for an unrecorded field", () => {
    const sparse = { ...stored, pronunciation: null, tone: null, example: null, exampleTranslation: null, exampleTranslations: null };
    const { sheetRow } = roundTrip("dictionary", sparse as never);
    expect(sheetRow.tone).toBe("");
    expect(sheetRow.pronunciation).toBe("");
    expect(sheetRow.example_english).toBe("");
  });
});

describe("sentence round trip", () => {
  it("keeps an equivalent drill equivalent", () => {
    // Without the `kind` column the importer would derive "blank" here, because
    // the answer does appear inside the sentence — silently changing the drill.
    const stored = {
      id: "s-izon-1",
      sentence: "Mị kasị.",
      englishSentence: "This is a chair.",
      answer: "kasị",
      kind: "equivalent",
    };
    const { entry } = roundTrip("sentence", stored as never);
    expect(entry).toMatchObject({ id: "s-izon-1", sentence: "Mị kasị.", answer: "kasị", kind: "equivalent" });
  });

  it("still derives the kind when a hand-written sheet omits the column", () => {
    const out = mapUnifiedRow({ type: "sentence", text: "Mị kasị.", english: "This is a chair.", answer: "kasị" }, LANG);
    expect("entry" in out && out.entry.kind).toBe("blank");
  });
});

describe("proverb round trip", () => {
  it("carries both gloss maps", () => {
    const stored = {
      id: "p-izon-1",
      text: "Beni na …",
      translation: "Water is …",
      translations: { en: "Water is …", fr: "L’eau est …" },
      meaning: "The lesson it teaches.",
      meaningTranslations: { en: "The lesson it teaches.", pcm: "Wetin e dey teach." },
    };
    const { entry } = roundTrip("proverb", stored as never);
    expect(entry).toMatchObject({
      id: "p-izon-1",
      text: "Beni na …",
      translation: "Water is …",
      meaning: "The lesson it teaches.",
      "translation:fr": "L’eau est …",
      "meaning:pcm": "Wetin e dey teach.",
    });
  });
});

describe("quiz round trip", () => {
  const stored = {
    id: "quiz-1",
    type: "word-to-english",
    prompt: "kọn",
    answer: "take",
    options: ["take", "come", "go", "see"],
  };

  it("rebuilds the options list through the pipe encoding", () => {
    const { entry } = roundTrip("quiz", stored as never);
    expect(entry).toMatchObject({ id: "quiz-1", type: "word-to-english", prompt: "kọn", answer: "take" });
    expect(entry.options).toEqual(["take", "come", "go", "see"]);
  });

  it("survives a free-text question with no options", () => {
    const { entry } = roundTrip("quiz", { ...stored, options: [] } as never);
    expect(entry.options).toEqual([]);
  });
});
