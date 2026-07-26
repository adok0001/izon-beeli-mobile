/** BCP-47 UI language code → localized string. Mirrors LocalizedText in @/types. */
type LocalizedText = Partial<Record<"en" | "fr" | "pcm" | "ar" | "pt", string>>;

/** A dialect-specific form of a word, optionally tied to a region. */
export type DialectalVariant = { dialect: string; form: string; region?: string };

/** Split a comma-separated input into a trimmed, non-empty string list. */
export const splitList = (raw: string): string[] => raw.split(",").map((s) => s.trim()).filter(Boolean);

export interface DictionaryEntry {
  id: string;
  word: string;
  english: string | LocalizedText;
  /** Full gloss map from the server; falls back to `english` when absent. */
  translations?: LocalizedText;
  category: DictionaryCategory;
  languageId: string;
  pronunciation?: string;
  example?: string;
  exampleTranslation?: string | LocalizedText;
  /** Full example-translation map from the server; falls back to `exampleTranslation`. */
  exampleTranslations?: LocalizedText;
  exampleAudioUrl?: string;
  audioUrl?: import("@/types").AudioSource;
  imageUrl?: string;
  contributorName?: string;
  contributorId?: string;
  englishWordId?: string;
  nsibidi?: string;
  /** In-language synonyms (word forms or IDs). */
  synonyms?: string[];
  /** In-language antonyms (word forms or IDs). */
  antonyms?: string[];
  /** Hierarchical semantic domain, e.g. "body > senses > sight". */
  semanticDomain?: string;
  /** Dialect-specific variant forms. */
  dialectalVariants?: DialectalVariant[];
  /**
   * Set when the entry came from a third-party API rather than Beeli's own data,
   * so the UI can attribute it and withhold actions that only work for reviewed
   * entries. Its `id` is synthetic and exists in no Beeli table — it cannot be
   * saved to a wordbank (SRS joins against `dictionary_entries` would never match)
   * and cannot be opened at `/word/[id]`.
   */
  externalSource?: "igbo-api";
}

export const DICTIONARY_CATEGORY_VALUES = [
  "greetings",
  "numbers",
  "family",
  "pronouns",
  "time",
  "verbs",
  "body",
  "market",
  "occupations",
  "nouns",
  "phrases",
  "food",
  "possessives",
  "ordinals",
  "commands",
  "animals",
  "phonetics",
  "money",
  "proverbs",
  "adjectives",
] as const;

export type DictionaryCategory = (typeof DICTIONARY_CATEGORY_VALUES)[number];

export const CATEGORY_LABELS: Record<DictionaryCategory, string> = {
  greetings: "Greetings & Courtesies",
  numbers: "Numbers & Counting",
  family: "Family & Relationships",
  pronouns: "Pronouns & People",
  time: "Time & Days",
  verbs: "Verbs & Actions",
  body: "Body Parts",
  market: "Money & Market",
  occupations: "Occupations",
  nouns: "Nouns & Objects",
  phrases: "Common Phrases",
  food: "Food & Drink",
  possessives: "Possessives",
  ordinals: "Ordinal Numbers",
  commands: "Commands",
  animals: "Animals",
  phonetics: "Phonetics & Spelling",
  money: "Money & Currency",
  proverbs: "Proverbs & Sayings",
  adjectives: "Adjectives & Descriptors",
};

/**
 * `as const satisfies` rather than annotating with `IconSymbolName`: the web app
 * compiles this file too, and its `@/*` alias points at its own root, so importing
 * a mobile-only type here would break that build (and pull in expo-symbols). The
 * `satisfies` still enforces that every category has an icon; the literal values
 * flow to the mobile call sites, where the `IconSymbol` prop validates them.
 */
export const CATEGORY_ICONS = {
  greetings: "hand.thumbsup",
  numbers: "number.square.fill",
  family: "person.fill",
  pronouns: "person.fill",
  time: "clock",
  verbs: "play.fill",
  body: "heart.fill",
  market: "star.fill",
  occupations: "gearshape.fill",
  nouns: "book.fill",
  phrases: "message",
  food: "flame.fill",
  possessives: "person.2.fill",
  ordinals: "list.number",
  commands: "megaphone",
  animals: "pawprint.fill",
  phonetics: "textformat.abc",
  money: "banknote",
  proverbs: "text.quote",
  adjectives: "tag",
} as const satisfies Record<DictionaryCategory, string>;

export function searchDictionary(query: string, entries: DictionaryEntry[]): DictionaryEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return entries;
  return entries.filter((e) => {
    const eng = typeof e.english === "string" ? e.english : Object.values(e.english).join(" ");
    const exTr = typeof e.exampleTranslation === "string" ? e.exampleTranslation : Object.values(e.exampleTranslation ?? {}).join(" ");
    return (
      e.word.toLowerCase().includes(q) ||
      eng.toLowerCase().includes(q) ||
      Object.values(e.translations ?? {}).some((v) => v.toLowerCase().includes(q)) ||
      e.pronunciation?.toLowerCase().includes(q) ||
      e.example?.toLowerCase().includes(q) ||
      exTr.toLowerCase().includes(q)
    );
  });
}

export function getDictionaryByCategory(category: DictionaryCategory, entries: DictionaryEntry[]): DictionaryEntry[] {
  return entries.filter((e) => e.category === category);
}

/** A single dictionary sense: the gloss plus an optional disambiguation note. */
export interface Sense {
  /** The meaning itself, e.g. "to call". */
  text: string;
  /** Parenthetical disambiguation pulled out of the meaning, e.g. "consonant phoneme t". */
  note?: string;
}

/**
 * Parse a `;`-delimited English field into discrete senses.
 *
 * Splits only on semicolons at parenthesis depth 0, so a note that itself
 * contains a semicolon — e.g. `"And (conjunction; consonant phoneme m)"` —
 * stays intact as one sense. A trailing `(…)` on each sense is lifted into
 * `note` so the UI can present it as a separate disambiguation tag.
 */
export function parseSenses(raw: string): Sense[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of raw) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === ";" && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);

  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const match = p.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
      return match ? { text: match[1].trim(), note: match[2].trim() } : { text: p };
    });
}

export const ALL_CATEGORIES: DictionaryCategory[] = Object.keys(CATEGORY_LABELS) as DictionaryCategory[];
