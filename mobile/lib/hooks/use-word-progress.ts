import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";

export interface WordProgressRow {
  wordId: string;
  box: number;
  correctStreak: number;
  attempts: number;
  lastSeenAt: string;
}

interface WordProgressResponse {
  rows: WordProgressRow[];
  masteredCount: number;
}

export function useWordProgress(languageId: string) {
  const { getToken } = useAuth();
  return useQuery<WordProgressResponse>({
    queryKey: ["word-progress", languageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<WordProgressResponse>(
        `/word-progress?languageId=${encodeURIComponent(languageId)}`,
        { token: token ?? undefined }
      );
    },
    enabled: !!languageId,
    staleTime: 60_000,
  });
}

/** Returns a Map<wordId, box> for fast lookup in the quiz engine. */
export function useWordProgressMap(languageId: string): Map<string, number> {
  const { data } = useWordProgress(languageId);
  const map = new Map<string, number>();
  for (const row of data?.rows ?? []) {
    map.set(row.wordId, row.box);
  }
  return map;
}
