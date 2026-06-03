import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { DictionaryEntry } from "@/lib/dictionary";

interface WotdResponse {
  entry: DictionaryEntry | null;
  isOverride: boolean;
}

export function useWordOfTheDay(languageId: string): DictionaryEntry | null {
  const { data } = useQuery<WotdResponse>({
    queryKey: ["wotd", languageId],
    queryFn: () => apiFetch<WotdResponse>(`/daily-content/wotd?languageId=${encodeURIComponent(languageId)}`),
    enabled: !!languageId,
  });
  return data?.entry ?? null;
}
