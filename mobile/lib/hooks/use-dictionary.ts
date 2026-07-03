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

/** Normalise a tapped transcript token to a searchable headword. */
export function normalizeWord(raw: string): string {
  // Strip surrounding punctuation/quotes but keep in-word marks (apostrophes,
  // tone diacritics live in the letters themselves).
  return raw.replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu, "").trim();
}

/**
 * Look up a single word for mid-playback dictionary popovers. Returns the best
 * dictionary match (exact match ranked first by the API), or null when absent.
 */
export function useWordLookup(languageId: string, word: string) {
  const isGuest = useGuestStore((s) => s.isGuest);
  const isOffline = useIsOffline();
  const term = normalizeWord(word);

  return useQuery<DictionaryEntry | null>({
    queryKey: ["word-lookup", languageId, term.toLowerCase()],
    queryFn: async () => {
      const matchLocal = () => {
        const lower = term.toLowerCase();
        const all = bundledDictionary(languageId);
        return (
          all.find((e) => e.word.toLowerCase() === lower) ??
          all.find((e) => e.word.toLowerCase().startsWith(lower)) ??
          null
        );
      };
      if (isGuest || isOffline) return matchLocal();
      const params = new URLSearchParams({ languageId, search: term, limit: "1" });
      try {
        const rows = await apiFetch<DictionaryEntry[]>(`/dictionary?${params.toString()}`);
        return rows[0] ?? matchLocal();
      } catch (err) {
        if (isNetworkError(err)) return matchLocal();
        throw err;
      }
    },
    enabled: !!languageId && term.length > 0,
    staleTime: 1000 * 60 * 30,
  });
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
