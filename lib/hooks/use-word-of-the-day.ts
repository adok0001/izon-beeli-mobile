import { useDictionary } from "@/lib/hooks/use-dictionary";
import { getDailyItem } from "@/lib/daily-picker";
import type { DictionaryEntry } from "@/lib/dictionary";

export function useWordOfTheDay(
  languageId: string
): DictionaryEntry | null {
  const { data: entries = [] } = useDictionary(languageId);
  return getDailyItem(entries) ?? null;
}
