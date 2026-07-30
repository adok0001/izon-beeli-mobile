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

/**
 * The canonical dictionary categories, stored on `dictionary_entries.category`.
 *
 * This is the single source of truth for every client — mobile imports it via
 * `@/lib/dictionary`, the Next.js Studio via `@mobile/lib/dictionary`. Never
 * redeclare this list in a screen; import it (or `ALL_CATEGORIES`) instead.
 *
 * The server keeps its own copy in `server/src/lib/dictionary-categories.ts`
 * because it deploys from `server/` alone and cannot reach `mobile/` at build
 * time. That copy is not free-floating: `dictionary-categories.test.ts` reads
 * this file from disk and fails if the two lists diverge, so adding a category
 * here without adding it there breaks the server test suite.
 */
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
  "ideophones",
  "adverbs",
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
  ideophones: "Ideophones & Sound Words",
  adverbs: "Adverbs & Modifiers",
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
  ideophones: "waveform",
  adverbs: "bolt.fill",
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

/** Combining diacritics — see the `;` rule in {@link parseSenses}. */
const COMBINING_MARK = /[̀-ͯ]/;

/**
 * A trailing `(…)` is a disambiguation only when whitespace separates it from
 * the gloss. Abutting the previous word it is inflectional morphology that
 * belongs *in* the gloss — `"corrugated iron sheet(s)"`, `"guerrilla war(fare)"`,
 * `"handcuff(s)"` — and lifting it out produced the gloss "corrugated iron
 * sheet" with the note "s". Requiring the space costs ~20 senses whose note
 * stays inline (lossless, just flatter), and saves 15 from being mangled.
 */
const TRAILING_NOTE = /^(.*\S)\s+\(([^()]*)\)$/;

/**
 * Parse a `;`-delimited English field into discrete senses.
 *
 * Splits only on semicolons at parenthesis depth 0, so a note that itself
 * contains a semicolon — e.g. `"And (conjunction; consonant phoneme m)"` —
 * stays intact as one sense.
 */
export function parseSenses(raw: string): Sense[] {
  const parts: string[] = [];
  const chars = [...raw];
  let depth = 0;
  let current = "";
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    if (ch === "(") depth += 1;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === ";" && depth === 0) {
      // 15 corpus entries carry a combining mark typed *after* its semicolon
      // (`bịdẹ́ àbaaraí;̣ B. hang…` for `…àbaaraị́;`). Splitting on the `;` would
      // orphan the mark at the head of the next sense, where it renders on
      // whatever letter follows. Pull it back onto the sense it belongs to.
      while (i + 1 < chars.length && COMBINING_MARK.test(chars[i + 1])) {
        current += chars[(i += 1)];
      }
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
      const match = p.match(TRAILING_NOTE);
      return match ? { text: match[1], note: match[2].trim() } : { text: p };
    });
}

/**
 * The flat `english` column a sense list projects back to — the inverse of
 * {@link parseSenses}, and what keeps ~120 read sites working unchanged once
 * senses live in their own rows.
 *
 * Round-trips byte-identically over 99.34% of the live corpus; the remainder
 * differs only by whitespace the parser normalizes (a space before a `;`, an
 * empty trailing sense).
 */
export function projectSenses(senses: Sense[]): string {
  return senses
    .map((s) => {
      const text = s.text.trim();
      const note = s.note?.trim();
      if (!note) return text;
      return text ? `${text} (${note})` : `(${note})`;
    })
    .filter(Boolean)
    .join("; ");
}

/** The example material belonging to one sense of an entry. */
export interface SenseScope {
  example?: string;
  exampleTranslation?: string | LocalizedText;
  exampleTranslations?: LocalizedText;
  exampleAudioUrl?: string;
}

/**
 * The example material for one sense.
 *
 * `dictionary_entries` carries a single example column for the whole headword,
 * so today only the first sense can own it — which is exactly the assumption the
 * corpus backfill makes when it attaches every existing example to sense 1 and
 * flags 137 of them as a guess. Later senses come back empty rather than
 * borrowing sense 1's sentence: showing "Ọka fẹịn!" under the *maize* reading
 * when it was written for *corn* would be a quiet mistranslation, and an empty
 * slot is what makes the gap visible to the educator who can fill it.
 *
 * This is the seam `dictionary_examples` plugs into — one example per sense,
 * pointing into the shared corpus. When those rows are served, this function
 * reads them and nothing above it changes.
 */
export function scopeToSense(entry: DictionaryEntry, senseIndex?: number): SenseScope {
  if (senseIndex !== undefined && senseIndex > 0) return {};
  return {
    example: entry.example,
    exampleTranslation: entry.exampleTranslation,
    exampleTranslations: entry.exampleTranslations,
    exampleAudioUrl: entry.exampleAudioUrl,
  };
}

/** An entry reduced to the single sense a quiz question is about. */
export interface QuizSense {
  /** The one gloss that is the correct answer, note included. */
  answer: string;
  /**
   * Every gloss of this entry, `answer` among them. None of the others may be
   * offered as a distractor: a sibling sense is *also* a correct translation of
   * the headword, so showing one makes the question unanswerable.
   */
  siblings: string[];
  /** How many senses the entry has, so the UI can say which one it is asking about. */
  senseCount: number;
  /** Which sense this is, 0-based — what a review schedule keys on. */
  senseIndex: number;
}

/**
 * Reduce an entry's gloss column to one askable sense.
 *
 * Quizzes used to set the whole `;`-delimited column as the correct answer, so
 * "what does *sụ́ọ* mean?" expected *"enter; come in; open; begin; …"* — 18 senses
 * as a single option. That is not a question anyone can answer, and it made the
 * distractor pool a set of paragraphs.
 *
 * Sense 1 is the one asked about. Nothing yet records which sense of a headword
 * is the most common, and until something does, the first is the best available
 * proxy for the primary meaning — picking a later sense because it happens to
 * carry a disambiguating note would quiz the obscure reading of a word instead
 * of the everyday one. When sense ranking exists, this function is the only
 * place that changes.
 */
export function quizSense(english: string, progress?: SenseProgress): QuizSense | null {
  const senses = parseSenses(english);
  if (senses.length === 0) return null;
  return senseAt(english, pickSenseIndex(senses.length, progress));
}

/**
 * The sense at a given position, for when the learner has picked one.
 *
 * Tapping a sense on the word-detail screen is the one case where "which sense
 * does this learner need?" has a direct answer, so it bypasses the progressive
 * gating entirely — including the requirement that a later sense have an example.
 * The learner just read the sense they tapped; that *is* the disambiguation.
 *
 * `siblings` still carries every sense, so the other meanings stay barred from
 * the distractors. Quizzing "meat" while offering "animal" as a wrong answer
 * would be broken however the sense got chosen.
 */
export function senseAt(english: string, index: number): QuizSense | null {
  const senses = parseSenses(english);
  if (index < 0 || index >= senses.length) return null;
  return {
    answer: projectSenses([senses[index]]),
    siblings: senses.map((s) => projectSenses([s])),
    senseCount: senses.length,
    senseIndex: index,
  };
}

/** What the learner has already got through, for {@link quizSense}. */
export interface SenseProgress {
  /** Sense positions the learner has mastered, 0-based. */
  mastered: ReadonlySet<number>;
  /**
   * Sense positions that have a usage example to disambiguate them.
   *
   * A sense past the first can't be asked about without context: "what does
   * *nama* mean?" expecting "meat" is unfair when "animal" is equally correct
   * and the learner has no way to know which was wanted. The sense's own example
   * sentence is what makes the question answerable, which is what
   * `dictionary_examples` holds — one example per sense.
   *
   * Until those rows exist and are served, this is empty for every entry, so a
   * multi-sense word stays on sense 1. That is deliberate: showing sense 3
   * without context would be a worse question than the one this replaced.
   */
  hasExample: ReadonlySet<number>;
}

/**
 * Which sense to ask about: the lowest one the learner hasn't mastered.
 *
 * Senses unlock in order, the same way the journey gates lessons. Sense 1 is
 * always askable — it needs no disambiguation, being the primary meaning. A
 * later sense is only offered once the ones before it are mastered AND it has an
 * example to disambiguate it; otherwise the word stays on the last sense that
 * qualifies, which keeps the question fair at the cost of not advancing.
 *
 * Once every qualifying sense is mastered, it cycles back to the highest one so
 * the word stays reviewable rather than dropping out of rotation.
 */
function pickSenseIndex(count: number, progress?: SenseProgress): number {
  if (count === 1 || !progress) return 0;
  let best = 0;
  for (let i = 0; i < count; i += 1) {
    const askable = i === 0 || progress.hasExample.has(i);
    if (!askable) break; // senses unlock in order — a gap stops the walk
    if (!progress.mastered.has(i)) return i;
    best = i;
  }
  return best;
}

/** Mutable copy of {@link DICTIONARY_CATEGORY_VALUES} for `.map`/`.filter` call sites. */
export const ALL_CATEGORIES: DictionaryCategory[] = [...DICTIONARY_CATEGORY_VALUES];
