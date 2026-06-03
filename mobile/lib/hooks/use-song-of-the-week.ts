import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Lesson } from "@/types";

interface SotwResponse {
  lesson: Lesson | null;
  isOverride: boolean;
}

export function useSongOfTheWeek(languageId: string): Lesson | null {
  const { data } = useQuery<SotwResponse>({
    queryKey: ["sotw", languageId],
    queryFn: () => apiFetch<SotwResponse>(`/daily-content/sotw?languageId=${encodeURIComponent(languageId)}`),
    enabled: !!languageId,
  });
  return data?.lesson ?? null;
}
