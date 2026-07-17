import { apiFetch, friendlyError } from "@/lib/api";
import { useProfileAvatarStore } from "@/store/profile-avatar-store";
import type { UserLevel } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

export type { UserLevel };
export type DailyGoal = "casual" | "steady" | "intensive";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  profileAvatarId: string | null;
  streak: number;
  points: number;
  selectedLanguageId: string | null;
  dailyGoal: DailyGoal;
  level: UserLevel | null;
  onboardingCompletedAt: string | null;
  isAdmin: boolean;
  isReviewer: boolean;
  reviewerLanguages: string[];
  reviewerRole: "teacher" | "professor" | "elder" | null;
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

export function useUpdateProfileAvatar() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const setSelectedId = useProfileAvatarStore((s) => s.setSelectedId);

  return useMutation({
    mutationFn: async (profileAvatarId: string) => {
      const previousId = useProfileAvatarStore.getState().selectedId;
      setSelectedId(profileAvatarId);
      try {
        const token = await getToken();
        return await apiFetch("/users/me", {
          method: "PATCH",
          token: token!,
          body: JSON.stringify({ profileAvatarId }),
        });
      } catch (error) {
        // Roll back the optimistic local store change before rethrowing.
        setSelectedId(previousId);
        throw error;
      }
    },
    onSuccess: (_data, profileAvatarId) => {
      queryClient.setQueryData<CurrentUser>(["current-user"], (prev) =>
        prev ? { ...prev, profileAvatarId } : prev
      );
    },
    onError: (error) => {
      Alert.alert("", friendlyError(error));
    },
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
    onError: (error) => {
      Alert.alert("", friendlyError(error));
      // Restore truth from the server since the local cache was not yet updated.
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
  });
}

export function useCompleteOnboarding() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { selectedLanguageId: string; level: UserLevel }) => {
      const token = await getToken();
      return apiFetch("/users/me", {
        method: "PATCH",
        token: token!,
        body: JSON.stringify({
          selectedLanguageId: input.selectedLanguageId,
          level: input.level,
          onboardingCompleted: true,
        }),
      });
    },
    onSuccess: (_data, input) => {
      queryClient.setQueryData<CurrentUser>(["current-user"], (prev) =>
        prev
          ? {
              ...prev,
              selectedLanguageId: input.selectedLanguageId,
              level: input.level,
              onboardingCompletedAt: new Date().toISOString(),
            }
          : prev
      );
    },
  });
}
