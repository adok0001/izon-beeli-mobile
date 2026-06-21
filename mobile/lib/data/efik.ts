import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";

interface EntryOpts {
  pronunciation?: string;
  example?: string;
  exampleTranslation?: string;
  synonyms?: string[];
  antonyms?: string[];
  semanticDomain?: string;
  dialectalVariants?: Array<{ dialect: string; form: string; region?: string }>;
}

function e(
  id: number,
  word: string,
  english: string,
  category: DictionaryCategory,
  opts: EntryOpts = {}
): DictionaryEntry {
  return {
    id: `d-ef-${id}`,
    word,
    english,
    category,
    languageId: "efik",
    ...opts,
  };
}

/**
 * Efik dictionary — target: 14,000+ entries.
 *
 * Efik is spoken primarily in Cross River State, Nigeria (Calabar and
 * surrounding communities). The Calabar dialect is the prestige written form.
 * Closest relatives: Ibibio, Annang.
 */
export const EFIK_DICTIONARY: DictionaryEntry[] = [
  // --- Greetings & Courtesies ---
  e(1, "Mfo mfo", "Good morning", "greetings", {
    pronunciation: "m-fo m-fo",
    example: "Mfo mfo, ami edi mbok?",
    exampleTranslation: "Good morning, how are you?",
    semanticDomain: "social > greetings > time-of-day",
    dialectalVariants: [
      { dialect: "Efut", form: "Mfo", region: "Calabar" },
    ],
  }),
  e(2, "Oro ke", "Thank you", "greetings", {
    pronunciation: "o-ro ke",
    example: "Oro ke, ami edi mbok!",
    exampleTranslation: "Thank you very much!",
    semanticDomain: "social > courtesies > gratitude",
    synonyms: ["Isua ndito"],
  }),
  e(3, "Ke si?", "How are you?", "greetings", {
    pronunciation: "ke si",
    example: "Ke si, nnyin?",
    exampleTranslation: "How are you, friend?",
    semanticDomain: "social > greetings > wellbeing",
  }),
  e(4, "Ami edi mbok", "I am fine / I am well", "greetings", {
    pronunciation: "a-mi e-di m-bok",
    example: "Ke si? Ami edi mbok, oro ke.",
    exampleTranslation: "How are you? I am fine, thank you.",
    semanticDomain: "social > greetings > wellbeing",
    antonyms: ["Ami edi esit"],
  }),
  e(5, "Ndito", "Friend / Fellow", "greetings", {
    pronunciation: "n-di-to",
    example: "Mfo mfo, ndito mmi!",
    exampleTranslation: "Good morning, my friend!",
    semanticDomain: "social > relationships > peers",
  }),
];
