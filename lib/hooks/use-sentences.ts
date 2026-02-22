import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { SentenceTemplate } from "@/types";

export function useSentences(languageId: string) {
  return useQuery<SentenceTemplate[]>({
    queryKey: ["sentences", languageId],
    queryFn: () =>
      apiFetch<SentenceTemplate[]>(`/sentences?languageId=${encodeURIComponent(languageId)}`),
    enabled: !!languageId,
  });
}
