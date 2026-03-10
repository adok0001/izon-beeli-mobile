import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "@/lib/api";

export interface NotificationPrefs {
  pushWotdEnabled: boolean;
  pushStreakReminderEnabled: boolean;
}

export function useNotificationPrefs() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<NotificationPrefs>({
    queryKey: ["notification-prefs"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch("/notifications/preferences", { token: token! });
    },
    enabled: !!isSignedIn,
    staleTime: 5 * 60 * 1000,
  });
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
      queryClient.setQueryData<NotificationPrefs>(["notification-prefs"], (old) =>
        old ? { ...old, ...prefs } : (prefs as NotificationPrefs)
      );
      return { previous };
    },
    onError: (_err, _prefs, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notification-prefs"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-prefs"] });
    },
  });
}
