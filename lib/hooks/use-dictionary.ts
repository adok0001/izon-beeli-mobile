import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { DictionaryEntry } from "@/lib/dictionary";

export function useDictionary(languageId: string, category?: string) {
  return useQuery<DictionaryEntry[]>({
    queryKey: ["dictionary", languageId, category ?? null],
    queryFn: () => {
      const params = new URLSearchParams({ languageId });
      if (category) params.set("category", category);
      return apiFetch<DictionaryEntry[]>(`/dictionary?${params.toString()}`);
    },
    enabled: !!languageId,
  });
}
