import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Proverb } from "@/types";

interface PotmResponse {
  proverb: Proverb | null;
  isOverride: boolean;
}

export function useProverbOfTheMonth(languageId: string): Proverb | null {
  const { data } = useQuery<PotmResponse>({
    queryKey: ["potm", languageId],
    queryFn: () => apiFetch<PotmResponse>(`/daily-content/potm?languageId=${encodeURIComponent(languageId)}`),
    enabled: !!languageId,
  });
  return data?.proverb ?? null;
}
