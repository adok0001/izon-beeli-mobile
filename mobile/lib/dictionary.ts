/** BCP-47 UI language code → localized string. Mirrors LocalizedText in @/types. */
type LocalizedText = Partial<Record<"en" | "fr" | "pcm" | "ar" | "pt", string>>;

export interface DictionaryEntry {
  id: string;
  word: string;
  english: string | LocalizedText;
  /** @deprecated Use `english` as LocalizedText with key `"fr"` */
  french?: string;
  category: DictionaryCategory;
  languageId: string;
  pronunciation?: string;
  example?: string;
  exampleTranslation?: string | LocalizedText;
  /** @deprecated Use `exampleTranslation` as LocalizedText with key `"fr"` */
  exampleTranslationFr?: string;
  exampleAudioUrl?: string;
  audioUrl?: import("@/types").AudioSource;
  imageUrl?: string;
  contributorName?: string;
  contributorId?: string;
  englishWordId?: string;
  nsibidi?: string;
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
  adjectives: "tag",
};

export function searchDictionary(query: string, entries: DictionaryEntry[]): DictionaryEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return entries;
  return entries.filter((e) => {
    const eng = typeof e.english === "string" ? e.english : Object.values(e.english).join(" ");
    const exTr = typeof e.exampleTranslation === "string" ? e.exampleTranslation : Object.values(e.exampleTranslation ?? {}).join(" ");
    return (
      e.word.toLowerCase().includes(q) ||
      eng.toLowerCase().includes(q) ||
      e.french?.toLowerCase().includes(q) ||
      e.pronunciation?.toLowerCase().includes(q) ||
      e.example?.toLowerCase().includes(q) ||
      exTr.toLowerCase().includes(q)
    );
  });
}

export function getDictionaryByCategory(category: DictionaryCategory, entries: DictionaryEntry[]): DictionaryEntry[] {
  return entries.filter((e) => e.category === category);
}

export const ALL_CATEGORIES: DictionaryCategory[] = Object.keys(CATEGORY_LABELS) as DictionaryCategory[];
