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
    id: `d-nd-${id}`,
    word,
    english,
    category,
    languageId: "ndebele",
    ...opts,
  };
}

/**
 * Ndebele dictionary — target: 2,000+ entries.
 *
 * isiNdebele (Northern/Zimbabwe Ndebele) is a Nguni Bantu language spoken
 * primarily in Zimbabwe's Matabeleland region. Closely related to Zulu.
 */
export const NDEBELE_DICTIONARY: DictionaryEntry[] = [
  // --- Greetings & Courtesies ---
  e(1, "Sawubona", "Hello (to one person)", "greetings", {
    pronunciation: "sa-wu-bo-na",
    example: "Sawubona, unjani?",
    exampleTranslation: "Hello, how are you?",
    semanticDomain: "social > greetings",
    dialectalVariants: [
      { dialect: "Zimbabwe Ndebele", form: "Salibonani", region: "Matabeleland" },
    ],
  }),
  e(2, "Salibonani", "Hello (to more than one)", "greetings", {
    pronunciation: "sa-li-bo-na-ni",
    example: "Salibonani, linjani?",
    exampleTranslation: "Hello everyone, how are you all?",
    semanticDomain: "social > greetings",
  }),
  e(3, "Ngiyabonga", "Thank you", "greetings", {
    pronunciation: "ngi-ya-bo-nga",
    example: "Ngiyabonga kakhulu!",
    exampleTranslation: "Thank you very much!",
    semanticDomain: "social > courtesies > gratitude",
    synonyms: ["Siyabonga"],
  }),
  e(4, "Unjani?", "How are you?", "greetings", {
    pronunciation: "u-nja-ni",
    example: "Sawubona, unjani?",
    exampleTranslation: "Hello, how are you?",
    semanticDomain: "social > greetings > wellbeing",
  }),
  e(5, "Ngikhona", "I am fine / I am here", "greetings", {
    pronunciation: "ngi-kho-na",
    example: "Unjani? Ngikhona, ngiyabonga.",
    exampleTranslation: "How are you? I am fine, thank you.",
    semanticDomain: "social > greetings > wellbeing",
    antonyms: ["Angikhona"],
  }),
];
