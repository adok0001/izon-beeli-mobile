import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatarUrl?: string | null;
  profileAvatarId?: string | null;
  points: number;
  streak: number;
  selectedLanguageId?: string | null;
  isCurrentUser: boolean;
}

export function useLeaderboard() {
  const { getToken } = useAuth();

  return useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<LeaderboardEntry[]>("/users/leaderboard", { token: token ?? undefined });
    },
    staleTime: 5 * 60 * 1000,
  });
}
