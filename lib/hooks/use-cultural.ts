import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { CulturalContent } from "@/types";

export function useCultural(languageId: string) {
  return useQuery<CulturalContent[]>({
    queryKey: ["cultural", languageId],
    queryFn: () =>
      apiFetch<CulturalContent[]>(`/cultural?languageId=${encodeURIComponent(languageId)}`),
    enabled: !!languageId,
  });
}
