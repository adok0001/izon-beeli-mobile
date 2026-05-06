import { apiFetch } from "@/lib/api";
import type { GameSession, GameSessionType } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCreateSession() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (params: { type: GameSessionType; languageId: string; courseId?: string; questionCount?: number }) => {
      const token = await getToken();
      return apiFetch<GameSession>("/multiplayer/sessions", { method: "POST", token: token!, body: JSON.stringify(params) });
    },
  });
}

export function useJoinSession() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const token = await getToken();
      return apiFetch<GameSession>("/multiplayer/sessions/join", { method: "POST", token: token!, body: JSON.stringify({ inviteCode }) });
    },
  });
}

export function useRecentSessions() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["multiplayer", "sessions"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<GameSession[]>("/multiplayer/sessions", { token: token! });
    },
    enabled: !!isSignedIn,
  });
}

export function useJoinMatchmaking() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { type: GameSessionType; languageId: string }) => {
      const token = await getToken();
      return apiFetch<{ queued: boolean; matched: boolean; session?: GameSession }>(
        "/multiplayer/matchmaking/queue",
        { method: "POST", token: token!, body: JSON.stringify(params) }
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["multiplayer", "matchmaking"] }),
  });
}

export function useLeaveMatchmaking() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch("/multiplayer/matchmaking/queue", { method: "DELETE", token: token! });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["multiplayer", "matchmaking"] }),
  });
}

export function useMatchmakingStatus(enabled: boolean) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["multiplayer", "matchmaking", "status"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<{ status: string; session?: GameSession }>("/multiplayer/matchmaking/status", { token: token! });
    },
    enabled: !!isSignedIn && enabled,
    refetchInterval: 3000,
  });
}
