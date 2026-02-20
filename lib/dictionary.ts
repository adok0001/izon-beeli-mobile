export interface DictionaryEntry {
  id: string;
  word: string;
  english: string;
  category: DictionaryCategory;
  languageId: string;
  pronunciation?: string;
  example?: string;
  exampleTranslation?: string;
  audioUrl?: import("@/types").AudioSource;
  contributorName?: string;
  contributorId?: string;
}

export type DictionaryCategory =
  | "greetings"
  | "numbers"
  | "family"
  | "pronouns"
  | "time"
  | "verbs"
  | "body"
  | "market"
  | "occupations"
  | "nouns"
  | "phrases"
  | "food"
  | "possessives"
  | "ordinals"
  | "commands"
  | "animals"
  | "phonetics"
  | "money"
  | "proverbs";

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
};

export const CATEGORY_ICONS: Record<DictionaryCategory, string> = {
  greetings: "hand.thumbsup",
  numbers: "numbers",
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
};

// Re-export for backward compatibility
export { IZON_DICTIONARY } from "@/lib/data/izon";
import { IZON_DICTIONARY } from "@/lib/data/izon";

export function searchDictionary(query: string, entries: DictionaryEntry[] = IZON_DICTIONARY): DictionaryEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return entries;
  return entries.filter(
    (e) =>
      e.word.toLowerCase().includes(q) ||
      e.english.toLowerCase().includes(q)
  );
}

export function getDictionaryByCategory(category: DictionaryCategory, entries: DictionaryEntry[] = IZON_DICTIONARY): DictionaryEntry[] {
  return entries.filter((e) => e.category === category);
}

export const ALL_CATEGORIES: DictionaryCategory[] = Object.keys(CATEGORY_LABELS) as DictionaryCategory[];
