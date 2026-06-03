import { useQuery } from "@tanstack/react-query";
import { adaptIgboWord, searchIgboWords } from "@/lib/igbo-api";
import type { DictionaryEntry } from "@/lib/dictionary";

// Maps Igbo API word class strings to the closest DictionaryCategory.
// Unmapped classes fall back to "nouns".
const WORD_CLASS_TO_CATEGORY: Record<string, DictionaryEntry["category"]> = {
  NNC: "nouns",
  NNO: "nouns",
  NNO2: "nouns",
  PRN: "pronouns",
  VB: "verbs",
  VBD: "verbs",
  VBG: "verbs",
  AV: "adjectives",
  AVM: "adjectives",
  MV: "verbs",
  "NNC Mgbe": "time",
  PREP: "phrases",
  CONJ: "phrases",
  INTJ: "greetings",
  NUM: "numbers",
};

function toCategory(wordClass?: string): DictionaryEntry["category"] {
  if (!wordClass) return "nouns";
  return WORD_CLASS_TO_CATEGORY[wordClass] ?? "nouns";
}

function toAudioSource(url?: string): DictionaryEntry["audioUrl"] {
  if (!url) return undefined;
  return { uri: url } as DictionaryEntry["audioUrl"];
}

function adaptToEntry(igboWord: Awaited<ReturnType<typeof searchIgboWords>>[number]): DictionaryEntry {
  const adapted = adaptIgboWord(igboWord);
  return {
    id: adapted.id,
    word: adapted.word,
    english: adapted.english,
    category: toCategory(adapted.wordClass),
    languageId: "igbo",
    pronunciation: adapted.pronunciation,
    example: adapted.example,
    exampleTranslation: adapted.exampleTranslation,
    audioUrl: toAudioSource(adapted.audioUrl),
    nsibidi: adapted.nsibidi || undefined,
  };
}

export function useIgboSearch(query: string) {
  const trimmed = query.trim();
  return useQuery<DictionaryEntry[]>({
    queryKey: ["igbo-api", "search", trimmed],
    queryFn: async () => {
      const results = await searchIgboWords(trimmed);
      return results.map(adaptToEntry);
    },
    enabled: trimmed.length >= 2,
    staleTime: 1000 * 60 * 10, // dictionary data is stable — cache for 10 min
    placeholderData: (prev) => prev,
  });
}
