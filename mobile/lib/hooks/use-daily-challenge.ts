import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "@/lib/api";
import type { DailyChallenge } from "@/types";
import { useCallback } from "react";

export function useTodayChallenges() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<DailyChallenge[]>({
    queryKey: ["daily-challenges", "today"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch("/daily-challenges/today", { token: token! });
    },
    enabled: !!isSignedIn,
    staleTime: 60 * 1000, // 1 min
  });
}

export function useInvalidateDailyChallenges() {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["daily-challenges", "today"] }),
    [queryClient]
  );
}

export function useRefetchDailyChallenges() {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.refetchQueries({ queryKey: ["daily-challenges", "today"] }),
    [queryClient]
  );
}

export function useRegenerateDailyChallenges() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useCallback(async () => {
    const token = await getToken();
    await apiFetch<DailyChallenge[]>("/daily-challenges/today/refresh", {
      method: "POST",
      token: token!,
    });
    await queryClient.refetchQueries({ queryKey: ["daily-challenges", "today"] });
  }, [getToken, queryClient]);
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
