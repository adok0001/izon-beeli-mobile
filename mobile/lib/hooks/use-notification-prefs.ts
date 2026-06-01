import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "@/lib/api";

export interface NotificationPrefs {
  pushWotdEnabled: boolean;
  pushStreakReminderEnabled: boolean;
  emailWotdEnabled: boolean;
  emailStreakReminderEnabled: boolean;
  emailAssignmentDueEnabled: boolean;
  emailContributionStatusEnabled: boolean;
  emailReviewerStatusEnabled: boolean;
}

export function useNotificationPrefs() {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<NotificationPrefs>({
    queryKey: ["notification-prefs"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch("/notifications/preferences", { token: token! });
    },
    enabled: !!isSignedIn,
    staleTime: 5 * 60 * 1000,
  });

  return query;
}

export function useUpdateNotificationPrefs() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: Partial<NotificationPrefs>) => {
      const token = await getToken();
      return apiFetch<{ updated: boolean }>("/notifications/preferences", {
        method: "PATCH",
        token: token!,
        body: JSON.stringify(prefs),
      });
    },
    onMutate: async (prefs) => {
      await queryClient.cancelQueries({ queryKey: ["notification-prefs"] });
      const previous = queryClient.getQueryData<NotificationPrefs>(["notification-prefs"]);
      // Only apply optimistic update when cache already has data
      if (previous) {
        queryClient.setQueryData<NotificationPrefs>(["notification-prefs"], { ...previous, ...prefs });
      }
      return { previous };
    },
    onError: (_err, _prefs, context) => {
      // Restore previous value (may be undefined if no prior cache — that's fine)
      queryClient.setQueryData(["notification-prefs"], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-prefs"] });
    },
  });
}
