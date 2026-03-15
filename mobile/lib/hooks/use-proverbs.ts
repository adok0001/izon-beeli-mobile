import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Proverb } from "@/types";

export function useProverbs(languageId: string) {
  return useQuery<Proverb[]>({
    queryKey: ["proverbs", languageId],
    queryFn: () => apiFetch<Proverb[]>(`/proverbs?languageId=${encodeURIComponent(languageId)}`),
    enabled: !!languageId,
  });
}
