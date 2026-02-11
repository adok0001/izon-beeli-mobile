import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { Alert } from "react-native";
import { apiFetch } from "@/lib/api";

interface ProgressSummary {
  points: number;
  streak: number;
  completedCount: number;
}

export function useProgressSummary() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<ProgressSummary>({
    queryKey: ["progress", "summary"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch("/progress/summary", { token: token! });
    },
    enabled: !!isSignedIn,
  });
}

export function useCompletedLessons() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<string[]>({
    queryKey: ["progress", "completed"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch("/progress", { token: token! });
    },
    enabled: !!isSignedIn,
  });
}

export function useCompleteLesson() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      const token = await getToken();
      return apiFetch<{
        completed: boolean;
        pointsEarned: number;
        totalPoints: number;
        streak: number;
      }>(`/progress/${lessonId}/complete`, {
        method: "POST",
        token: token!,
      });
    },
    onMutate: async (lessonId) => {
      await queryClient.cancelQueries({ queryKey: ["progress", "completed"] });
      const previous = queryClient.getQueryData<string[]>(["progress", "completed"]);
      queryClient.setQueryData<string[]>(["progress", "completed"], (old) =>
        old ? [...old, lessonId] : [lessonId]
      );
      return { previous };
    },
    onError: (_err, _lessonId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["progress", "completed"], context.previous);
      }
      Alert.alert("Error", "Failed to mark lesson as complete. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}
