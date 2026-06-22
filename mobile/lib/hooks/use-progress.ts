import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { Alert } from "react-native";
import { apiFetch } from "@/lib/api";
import { hapticHeavy } from "@/lib/haptics";
import { useInvalidateDailyChallenges } from "./use-daily-challenge";
import { useToast } from "./use-toast";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

export interface ProgressSummary {
  points: number;
  streak: number;
  completedCount: number;
  quizCount: number;
  freezeCount: number;
  streakBroken: boolean;
  refreshedToday: boolean;
}

interface CompleteLessonResponse {
  completed?: boolean;
  alreadyCompleted?: boolean;
  pointsEarned?: number;
  totalPoints?: number;
  streak?: number;
  streakIncremented?: boolean;
  leveledUp?: boolean;
  newLevel?: number;
  newTitle?: string;
  streakMilestone?: number | null;
  freezeGranted?: number | null;
  freezeCount?: number;
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

export function useCompleteLesson(callbacks?: {
  onLevelUp?: (level: number, title: string) => void;
  onStreakUpdate?: (streak: number, isMilestone: boolean) => void;
}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const invalidateDailyChallenges = useInvalidateDailyChallenges();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      const token = await getToken();
      return apiFetch<CompleteLessonResponse>(
        `/progress/${lessonId}/complete`,
        { method: "POST", token: token! }
      );
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
    onSuccess: (data) => {
      queryClient.setQueryData<ProgressSummary>(["progress", "summary"], (old) =>
        old ? { ...old, refreshedToday: true, ...(data.streak ? { streak: data.streak } : {}) } : old
      );
      if (data.streakMilestone) {
        hapticHeavy();
      }
      if (data.streak && data.streakIncremented) {
        callbacks?.onStreakUpdate?.(data.streak, !!data.streakMilestone);
      }
      if (data.leveledUp && data.newLevel && data.newTitle) {
        callbacks?.onLevelUp?.(data.newLevel, data.newTitle);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      invalidateDailyChallenges();
    },
  });
}

/**
 * Drives the streak toast/celebration for every non-lesson activity. Mirrors the
 * lesson screen (`app/lesson/[id].tsx`), which is the path that already works:
 * the milestone modal is shown *directly* the moment the server response lands —
 * no deferred "pending" state gated behind a specific button — and the new
 * streak is written into the progress cache so the badge updates immediately
 * instead of lagging until the next refetch.
 */
export function useStreakCelebration() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast, success: toastSuccess, dismiss: dismissToast } = useToast();
  const [celebration, setCelebration] = useState<{ streak: number; isMilestone: boolean } | null>(null);

  const onStreakUpdate = useCallback(
    (streak: number, isMilestone: boolean) => {
      // Reflect the incremented streak right away (the lesson hook does the same
      // at use-progress.ts onSuccess) so the UI doesn't wait on a refetch.
      queryClient.setQueryData<ProgressSummary>(["progress", "summary"], (old) =>
        old ? { ...old, streak, refreshedToday: true } : old
      );
      queryClient.invalidateQueries({ queryKey: ["progress"] });

      if (isMilestone) {
        hapticHeavy();
        setCelebration({ streak, isMilestone });
      } else {
        toastSuccess(t("streak.toastTitle", { count: streak }));
      }
    },
    [t, toastSuccess, queryClient]
  );

  const dismissCelebration = useCallback(() => {
    setCelebration(null);
  }, []);

  return {
    onStreakUpdate,
    celebration,
    dismissCelebration,
    clearCelebration: dismissCelebration,
    toast,
    dismissToast,
  };
}

interface ListenResult {
  tracked: boolean;
  streak?: number;
  streakIncremented?: boolean;
  streakMilestone?: number | null;
  freezeCount?: number;
}

export function useTrackListen(callbacks?: { onStreakUpdate?: (streak: number, isMilestone: boolean) => void }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const invalidateDailyChallenges = useInvalidateDailyChallenges();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      const token = await getToken();
      return apiFetch<ListenResult>(`/progress/${lessonId}/listen`, {
        method: "POST",
        token: token!,
      });
    },
    onSuccess: (data) => {
      invalidateDailyChallenges();
      if (data.streakIncremented && data.streak) {
        queryClient.setQueryData<ProgressSummary>(["progress", "summary"], (old) =>
          old ? { ...old, refreshedToday: true, streak: data.streak! } : old
        );
        callbacks?.onStreakUpdate?.(data.streak, !!data.streakMilestone);
      }
    },
  });
}

export function useAwardChecklistBonus() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch<{
        pointsEarned: number;
        totalPoints: number;
        leveledUp: boolean;
        newLevel: number;
        newTitle: string;
      }>("/progress/checklist-bonus", { method: "POST", token: token! });
    },
    onSuccess: () => {
      hapticHeavy();
      queryClient.invalidateQueries({ queryKey: ["progress", "summary"] });
    },
  });
}

export function useUseFreeze() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch<{ restored: boolean; streak: number; freezesRemaining: number }>(
        "/progress/freeze",
        { method: "POST", token: token! }
      );
    },
    onSuccess: () => {
      hapticHeavy();
      queryClient.invalidateQueries({ queryKey: ["progress", "summary"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message ?? "Could not use freeze.");
    },
  });
}
