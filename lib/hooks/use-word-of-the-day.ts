import { useMemo } from "react";
import { getDictionaryForLanguage } from "@/lib/data";
import { getDailyItem } from "@/lib/daily-picker";
import type { DictionaryEntry } from "@/lib/dictionary";

export function useWordOfTheDay(
  languageId: string
): DictionaryEntry | null {
  return useMemo(() => {
    const entries = getDictionaryForLanguage(languageId);
    if (entries.length === 0) return null;
    return getDailyItem(entries);
  }, [languageId]);
}
