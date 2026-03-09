import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "@/lib/api";
import type { DailyChallenge } from "@/types";

export function useTodayChallenge() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<DailyChallenge>({
    queryKey: ["daily-challenges", "today"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch("/daily-challenges/today", { token: token! });
    },
    enabled: !!isSignedIn,
    staleTime: 60 * 1000, // 1 min
  });
}

export function useChallengeHistory() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<DailyChallenge[]>({
    queryKey: ["daily-challenges", "history"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch("/daily-challenges/history", { token: token! });
    },
    enabled: !!isSignedIn,
  });
}
