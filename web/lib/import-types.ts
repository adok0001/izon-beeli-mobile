import { slugify } from "./parse-csv";

/**
 * Per-content-type configuration for the shared Studio <ImportPanel />.
 * Each Studio editor page spreads one of these into the panel. Flat types carry
 * `csvColumns` (spreadsheet-friendly); nested types (scenarios turns, cultural
 * key terms / hero bands) are `jsonOnly` because they don't flatten to a grid.
 */
export interface ImportTypeConfig {
  /** Endpoint segment: POST /import/:type */
  type: string;
  /** Human label used in copy, e.g. "sentence templates". */
  label: string;
  /** CSV disabled (JSON array only) for nested shapes. */
  jsonOnly?: boolean;
  /** Ordered CSV header → entry-field names for flat types. */
  csvColumns?: string[];
  /** Synthesize a stable id for a CSV row that omits one (keeps re-import idempotent). */
  synthesizeId?: (row: Record<string, string>, languageId: string) => string;
  /** Downloadable JSON example. */
  sampleJson: string;
  /** Downloadable CSV example (flat types only). */
  sampleCsv?: string;
}

const DICT_COLUMNS = ["id", "word", "english", "category", "pronunciation", "example", "exampleTranslation"];
const SENTENCE_COLUMNS = ["id", "sentence", "answer", "englishSentence", "kind", "literalTranslation"];
const PROVERB_COLUMNS = ["id", "text", "translation", "translationFr", "meaning", "meaningFr", "literal", "context"];

export const IMPORT_TYPES: Record<string, ImportTypeConfig> = {
  dictionary: {
    type: "dictionary",
    label: "dictionary entries",
    csvColumns: DICT_COLUMNS,
    // Dictionary upserts by id; derive a deterministic one from the word when the
    // sheet has no id column so re-imports update rather than duplicate.
    synthesizeId: (row, languageId) => row.id?.trim() || `${languageId}-${slugify(row.word)}`,
    sampleJson: JSON.stringify(
      [{ id: "izon-verb-kon", word: "kọn", english: "take", category: "verbs", example: "Bo okpu kọn.", exampleTranslation: "Come and take the sugarcane." }],
      null, 2,
    ),
    sampleCsv: "word,english,category,pronunciation,example,exampleTranslation\nkọn,take,verbs,,Bo okpu kọn.,Come and take the sugarcane.\n",
  },
  sentences: {
    type: "sentences",
    label: "sentence templates",
    csvColumns: SENTENCE_COLUMNS,
    sampleJson: JSON.stringify(
      [{ sentence: "Mị kasị.", answer: "kasị", englishSentence: "This is a chair.", kind: "blank" }],
      null, 2,
    ),
    sampleCsv: "sentence,answer,englishSentence,kind,literalTranslation\nMị kasị.,kasị,This is a chair.,blank,\n",
  },
  proverbs: {
    type: "proverbs",
    label: "proverbs",
    csvColumns: PROVERB_COLUMNS,
    sampleJson: JSON.stringify(
      [{ text: "…", translation: "…", meaning: "The lesson the proverb teaches." }],
      null, 2,
    ),
    sampleCsv: "text,translation,translationFr,meaning,meaningFr,literal,context\n…,…,,The lesson it teaches.,,,\n",
  },
  scenarios: {
    type: "scenarios",
    label: "scenarios",
    jsonOnly: true,
    sampleJson: JSON.stringify(
      [{ situation: "At the market", turns: [{ text: "…", translation: "…" }, { text: "…", translation: "…" }] }],
      null, 2,
    ),
  },
  cultural: {
    type: "cultural",
    label: "cultural content",
    jsonOnly: true,
    sampleJson: JSON.stringify(
      [{ category: "festival", title: "…", description: "…", imageEmoji: "🎉", keyTerms: [{ word: "…", english: "…" }] }],
      null, 2,
    ),
  },
};
