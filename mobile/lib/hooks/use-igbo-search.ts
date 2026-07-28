import { useQuery } from "@tanstack/react-query";
import { adaptIgboWord, searchIgboWords } from "@/lib/igbo-api";
import type { DictionaryEntry } from "@/lib/dictionary";

const WORD_CLASS_TO_CATEGORY: Record<string, DictionaryEntry["category"]> = {
  // Verified against live API payloads. Unmapped classes fall back to "nouns".
  NNC: "nouns",          // noun, common
  NNO: "nouns",
  NNO2: "nouns",
  NM: "nouns",           // proper name, e.g. Nwabụ̄ēzè
  ND: "adjectives",      // noun descriptor, e.g. nnukwu "large"
  ADJ: "adjectives",
  // "adverbs" now exists as a category, but remapping ADV would recategorise
  // previously imported rows inconsistently — left as a deliberate decision.
  ADV: "adjectives",
  AV: "verbs",           // active verb, e.g. riju "to eat to fill"
  AVM: "verbs",
  MV: "verbs",           // main verb, e.g. bù ibù "be big"
  PV: "verbs",           // phrasal verb, e.g. jì ụkwụ "trek"
  ESUF: "verbs",         // extensional suffix — attaches to verbs
  VB: "verbs",
  VBD: "verbs",
  VBG: "verbs",
  PRN: "pronouns",
  CD: "numbers",         // cardinal, e.g. ìriàtọ nà otù "thirty one"
  NUM: "numbers",
  "NNC Mgbe": "time",
  PREP: "phrases",
  CONJ: "phrases",
  INTJ: "greetings",
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
    // Marks the entry as unreviewed third-party data. The UI attributes it and
    // suppresses save/navigate, both of which are dead ends for a synthetic id.
    externalSource: "igbo-api",
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
