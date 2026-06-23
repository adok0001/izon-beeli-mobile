/**
 * Dictionary taxonomy — derives the browsable "categories landing" facets from
 * the real dictionary entries. The live `DictionaryEntry` model carries a single
 * `category` plus an optional `semanticDomain`, so part-of-speech, CEFR level,
 * topics and knowledge domains are derived deterministically here rather than
 * stored. Pure and side-effect free so it can be memoized and unit-tested.
 */
import { localize } from "@/lib/localize";
import type { DictionaryCategory, DictionaryEntry } from "@/lib/dictionary";

// ── Part of speech ───────────────────────────────────────────────────────────
export type PartOfSpeech = "noun" | "verb" | "adjective" | "pronoun" | "numeral" | "phrase";

const POS_BY_CATEGORY: Partial<Record<DictionaryCategory, PartOfSpeech>> = {
  verbs: "verb",
  commands: "verb",
  adjectives: "adjective",
  pronouns: "pronoun",
  possessives: "pronoun",
  numbers: "numeral",
  ordinals: "numeral",
  greetings: "phrase",
  phrases: "phrase",
  proverbs: "phrase",
};

export const POS_ORDER: PartOfSpeech[] = ["noun", "verb", "adjective", "pronoun", "numeral", "phrase"];

export const POS_LABELS: Record<PartOfSpeech, string> = {
  noun: "Noun",
  verb: "Verb",
  adjective: "Adjective",
  pronoun: "Pronoun",
  numeral: "Numeral",
  phrase: "Phrase",
};

/** Short tag shown on each word row, e.g. "v." */
export const POS_ABBR: Record<PartOfSpeech, string> = {
  noun: "n.",
  verb: "v.",
  adjective: "adj.",
  pronoun: "pron.",
  numeral: "num.",
  phrase: "phr.",
};

export function derivePos(entry: DictionaryEntry): PartOfSpeech {
  return POS_BY_CATEGORY[entry.category] ?? "noun";
}

// ── CEFR level ───────────────────────────────────────────────────────────────
export type CefrLevel = "A1" | "A2" | "B1" | "B2";

export const LEVEL_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2"];

/**
 * Category → base difficulty band. Everyday survival vocabulary lands at A1,
 * abstract/figurative material (proverbs, phonetics) at B2. Long words nudge a
 * single band higher so the spread feels organic rather than per-category flat.
 */
const LEVEL_BY_CATEGORY: Record<DictionaryCategory, CefrLevel> = {
  greetings: "A1",
  numbers: "A1",
  family: "A1",
  pronouns: "A1",
  food: "A1",
  body: "A1",
  time: "A2",
  verbs: "A2",
  market: "A2",
  occupations: "A2",
  possessives: "A2",
  ordinals: "A2",
  commands: "A2",
  animals: "A2",
  nouns: "B1",
  phrases: "B1",
  money: "B1",
  adjectives: "B1",
  proverbs: "B2",
  phonetics: "B2",
};

export function deriveLevel(entry: DictionaryEntry): CefrLevel {
  const base = LEVEL_BY_CATEGORY[entry.category] ?? "B1";
  const idx = LEVEL_ORDER.indexOf(base);
  // A multi-word phrase or a long headword reads as a touch harder.
  const longish = entry.word.trim().length > 9 || entry.word.includes(" ");
  const bumped = longish ? Math.min(idx + 1, LEVEL_ORDER.length - 1) : idx;
  return LEVEL_ORDER[bumped];
}

// ── Topics ───────────────────────────────────────────────────────────────────
export type Topic = "people" | "food" | "body";

export const TOPIC_ORDER: Topic[] = ["people", "food", "body"];

export const TOPIC_LABELS: Record<Topic, string> = {
  people: "People",
  food: "Food & Drink",
  body: "Body Parts",
};

export const TOPIC_ICONS: Record<Topic, string> = {
  people: "person.2.fill",
  food: "flame.fill",
  body: "heart.fill",
};

const TOPIC_CATEGORIES: Record<Topic, DictionaryCategory[]> = {
  people: ["family", "pronouns", "occupations"],
  food: ["food", "market"],
  body: ["body"],
};

export function entryInTopic(entry: DictionaryEntry, topic: Topic): boolean {
  return TOPIC_CATEGORIES[topic].includes(entry.category);
}

// ── Knowledge domains ────────────────────────────────────────────────────────
export type Domain = "science" | "medicine" | "weather" | "literature";

export const DOMAIN_ORDER: Domain[] = ["science", "medicine", "weather", "literature"];

export const DOMAIN_LABELS: Record<Domain, string> = {
  science: "Science",
  medicine: "Medicine",
  weather: "Weather",
  literature: "Literature",
};

export const DOMAIN_ICONS: Record<Domain, string> = {
  science: "leaf.fill",
  medicine: "cross.case.fill",
  weather: "cloud.sun.fill",
  literature: "text.quote",
};

/**
 * Domain membership is inferred from the gloss / example text. A word belongs to
 * a domain when any of its keywords appears — so "rain" surfaces under Weather,
 * "medicine" under Medicine — without needing curated per-entry tags.
 */
const DOMAIN_KEYWORDS: Record<Domain, string[]> = {
  science: ["water", "fire", "earth", "sun", "moon", "star", "sky", "river", "tree", "stone", "wind", "light", "animal", "fish", "bird", "plant", "leaf", "sand", "seed"],
  medicine: ["sick", "pain", "heal", "medicine", "doctor", "blood", "fever", "wound", "health", "die", "death", "breath", "cough", "cure", "ill"],
  weather: ["rain", "sun", "wind", "cloud", "storm", "cold", "hot", "dry", "wet", "season", "flood", "thunder", "lightning", "harmattan"],
  literature: ["story", "song", "proverb", "word", "name", "speak", "say", "tale", "poem", "praise", "saying", "sing", "write", "read", "riddle", "elder"],
};

function entryText(entry: DictionaryEntry): string {
  const gloss = localize(entry.english as any, "en");
  return `${gloss} ${entry.example ?? ""} ${entry.semanticDomain ?? ""}`.toLowerCase();
}

export function entryInDomain(entry: DictionaryEntry, domain: Domain): boolean {
  const text = entryText(entry);
  return DOMAIN_KEYWORDS[domain].some((kw) => text.includes(kw));
}
