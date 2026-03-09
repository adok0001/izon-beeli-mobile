import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "@/lib/api";
import type { DashboardStats, StreakCalendar } from "@/types";

export function useWeeklyStats() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "weekly-stats"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch("/dashboard/weekly-stats", { token: token! });
    },
    enabled: !!isSignedIn,
  });
}

export function useStreakCalendar() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<StreakCalendar>({
    queryKey: ["dashboard", "streak-calendar"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch("/dashboard/streak-calendar", { token: token! });
    },
    enabled: !!isSignedIn,
  });
}
