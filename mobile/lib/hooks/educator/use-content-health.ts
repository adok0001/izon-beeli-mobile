import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

export interface ContentHealth {
  languageId: string;
  dictionaryCoverage: { distinctWords: number; coveredWords: number; pct: number };
  translationCoverage: { locale: string; total: number; covered: number; pct: number }[];
  mediaCoverage: {
    total: number;
    audio: { count: number; pct: number };
    image: { count: number; pct: number };
    exampleAudio: { count: number; pct: number };
  };
  statusBreakdown: { entityType: string; draft: number; in_review: number; published: number; archived: number }[];
}

export function useContentHealth(languageId: string | undefined) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<ContentHealth>({
    queryKey: ["educator", "content-health", languageId ?? null],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ContentHealth>(`/educator/content-health?languageId=${languageId}`, { token: token ?? undefined });
    },
    enabled: !!isSignedIn && !!languageId,
    staleTime: 30_000,
  });
}
