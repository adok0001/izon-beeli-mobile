import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type DailyGoal = "casual" | "steady" | "intensive";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  streak: number;
  points: number;
  selectedLanguageId: string | null;
  dailyGoal: DailyGoal;
  isAdmin: boolean;
  isReviewer: boolean;
  reviewerLanguages: string[];
  reviewerRole: "teacher" | "professor" | "elder" | null;
  dailyGoal: "casual" | "steady" | "intensive" | null;
  planTier: "free" | "plus";
  accentColor: string | null;
  profileTheme: string | null;
  createdAt: string;
}

export function canAccessEducatorPanel(user: CurrentUser) {
  return user.isAdmin || user.isReviewer;
}

export function canModerateContent(user: CurrentUser) {
  return canAccessEducatorPanel(user);
}

export function canManageBounties(user: CurrentUser) {
  return user.isAdmin || user.reviewerRole === "professor" || user.reviewerRole === "elder";
}

export function canReviewApplications(user: CurrentUser) {
  return user.isAdmin || user.reviewerRole === "elder";
}

export function useCurrentUser() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<CurrentUser>({
    queryKey: ["current-user"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<CurrentUser>("/users/me", { token: token! });
    },
    enabled: !!isSignedIn,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateDailyGoal() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dailyGoal: DailyGoal) => {
      const token = await getToken();
      return apiFetch("/users/me", {
        method: "PATCH",
        token: token!,
        body: JSON.stringify({ dailyGoal }),
      });
    },
    onSuccess: (_data, dailyGoal) => {
      queryClient.setQueryData<CurrentUser>(["current-user"], (prev) =>
        prev ? { ...prev, dailyGoal } : prev
      );
    },
  });
}
