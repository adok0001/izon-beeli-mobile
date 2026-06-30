import { useQuery } from "@tanstack/react-query";
import { apiFetch, isNetworkError } from "@/lib/api";
import { getDictionaryForLanguage } from "@/lib/data";
import type { DictionaryEntry } from "@/lib/dictionary";
import { useIsOffline } from "@/lib/hooks/use-offline";
import { useGuestStore } from "@/store/guest-store";

function bundledDictionary(languageId: string, category?: string): DictionaryEntry[] {
  const entries = getDictionaryForLanguage(languageId);
  return category ? entries.filter((e) => e.category === category) : entries;
}

export function useDictionary(languageId: string, category?: string) {
  const isGuest = useGuestStore((s) => s.isGuest);
  const isOffline = useIsOffline();

  return useQuery<DictionaryEntry[]>({
    queryKey: ["dictionary", languageId, category ?? null],
    queryFn: async () => {
      if (isGuest || isOffline) return bundledDictionary(languageId, category);
      const params = new URLSearchParams({ languageId });
      if (category) params.set("category", category);
      try {
        return await apiFetch<DictionaryEntry[]>(`/dictionary?${params.toString()}`);
      } catch (err) {
        if (isNetworkError(err)) return bundledDictionary(languageId, category);
        throw err;
      }
    },
    enabled: !!languageId,
  });
}
