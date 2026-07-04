import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { useIsFocused } from "@react-navigation/native";
import { Alert } from "react-native";
import { apiFetch, isNetworkError } from "@/lib/api";
import { hapticHeavy } from "@/lib/haptics";
import type { LocalizedText } from "@/types";
import { useIsOffline } from "@/lib/hooks/use-offline";
import { useGuestProgressStore } from "@/store/guest-progress-store";
import { useGuestStore } from "@/store/guest-store";
import { useForegroundClaim, useOverlayStore } from "@/store/overlay-store";
import { useWriteQueueStore } from "@/store/write-queue-store";
import { useInvalidateDailyChallenges } from "./use-daily-challenge";
import { useToast } from "./use-toast";
import { useCallback, useEffect, useState } from "react";
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
  const isGuest = useGuestStore((s) => s.isGuest);
  const isOffline = useIsOffline();
  const queryClient = useQueryClient();

  return useQuery<ProgressSummary>({
    queryKey: ["progress", "summary"],
    queryFn: async () => {
      if (isGuest) return useGuestProgressStore.getState().getSummary();
      const cached = () => queryClient.getQueryData<ProgressSummary>(["progress", "summary"]);
      if (isOffline) return cached() ?? { points: 0, streak: 0, completedCount: 0, quizCount: 0, freezeCount: 0, streakBroken: false, refreshedToday: false };
      const token = await getToken();
      try {
        return await apiFetch<ProgressSummary>("/progress/summary", { token: token! });
      } catch (err) {
        if (isNetworkError(err) && cached()) return cached()!;
        throw err;
      }
    },
    enabled: !!isSignedIn || isGuest,
  });
}

export function useCompletedLessons() {
  const { getToken, isSignedIn } = useAuth();
  const isGuest = useGuestStore((s) => s.isGuest);
  const isOffline = useIsOffline();
  const queryClient = useQueryClient();

  return useQuery<string[]>({
    queryKey: ["progress", "completed"],
    queryFn: async () => {
      if (isGuest) {
        return useGuestProgressStore.getState().completedLessons.map((c) => c.lessonId);
      }
      const cached = () => queryClient.getQueryData<string[]>(["progress", "completed"]);
      if (isOffline) return cached() ?? [];
      const token = await getToken();
      try {
        return await apiFetch<string[]>("/progress", { token: token! });
      } catch (err) {
        if (isNetworkError(err)) return cached() ?? [];
        throw err;
      }
    },
    enabled: !!isSignedIn || isGuest,
  });
}

export interface CanDoStatement {
  lessonId: string;
  title: string | LocalizedText;
  canDo: string | null;
  canDoFr: string | null;
  completedAt: string | null;
}

/**
 * "What you can do" — honest, real-world competence statements for the user's
 * completed lessons (only lessons that declare a `canDo`). Powers the Profile
 * competence résumé, the counterweight to XP/streak vanity metrics.
 */
export function useCanDoStatements() {
  const { getToken, isSignedIn } = useAuth();
  const isOffline = useIsOffline();
  const queryClient = useQueryClient();

  return useQuery<CanDoStatement[]>({
    queryKey: ["progress", "can-do"],
    queryFn: async () => {
      const cached = () => queryClient.getQueryData<CanDoStatement[]>(["progress", "can-do"]);
      if (isOffline) return cached() ?? [];
      const token = await getToken();
      try {
        return await apiFetch<CanDoStatement[]>("/progress/can-do", { token: token! });
      } catch (err) {
        if (isNetworkError(err)) return cached() ?? [];
        throw err;
      }
    },
    enabled: !!isSignedIn,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCompleteLesson(callbacks?: {
  onLevelUp?: (level: number, title: string) => void;
  onStreakUpdate?: (streak: number, isMilestone: boolean) => void;
}) {
  const { getToken } = useAuth();
  const isGuest = useGuestStore((s) => s.isGuest);
  const isOffline = useIsOffline();
  const queryClient = useQueryClient();
  const invalidateDailyChallenges = useInvalidateDailyChallenges();

  return useMutation({
    mutationFn: async (lessonId: string): Promise<CompleteLessonResponse> => {
      if (isGuest) return useGuestProgressStore.getState().completeLesson(lessonId);
      if (isOffline) {
        useWriteQueueStore.getState().enqueue({
          kind: "completeLesson",
          lessonId,
          ts: new Date().toISOString(),
        });
        return {};
      }
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
 * Drives the streak toast/celebration for every non-lesson activity. The
 * incremented streak is written into the progress cache immediately, but the
 * milestone celebration is *queued* into the {@link useOverlayStore}: this screen
 * holds the foreground while it stays focused, so the app-level
 * {@link StreakCelebrationModal} only appears once the learner has cleared the
 * current screen (results, level-up, etc.) rather than overtaking it.
 */
export function useStreakCelebration() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast, success: toastSuccess, dismiss: dismissToast } = useToast();
  const isFocused = useIsFocused();
  const pendingStreak = useOverlayStore((s) => s.pendingStreak);
  const [holding, setHolding] = useState(false);

  // Defer the queued milestone while this screen is the one in front of the user.
  useForegroundClaim(holding && isFocused);

  // Once the milestone has been celebrated (or cleared) elsewhere, stop holding.
  useEffect(() => {
    if (!pendingStreak) setHolding(false);
  }, [pendingStreak]);

  const onStreakUpdate = useCallback(
    (streak: number, isMilestone: boolean) => {
      // Reflect the incremented streak right away (the lesson hook does the same
      // at use-progress.ts onSuccess) so the UI doesn't wait on a refetch.
      queryClient.setQueryData<ProgressSummary>(["progress", "summary"], (old) =>
        old ? { ...old, streak, refreshedToday: true } : old
      );
      queryClient.invalidateQueries({ queryKey: ["progress"] });

      if (isMilestone) {
        useOverlayStore.getState().showStreak(streak, true);
        setHolding(true);
      } else {
        toastSuccess(t("streak.toastTitle", { count: streak }));
      }
    },
    [t, toastSuccess, queryClient]
  );

  const dismissCelebration = useCallback(() => {
    useOverlayStore.getState().dismissStreak();
    setHolding(false);
  }, []);

  return {
    onStreakUpdate,
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
  const isGuest = useGuestStore((s) => s.isGuest);
  const isOffline = useIsOffline();
  const queryClient = useQueryClient();
  const invalidateDailyChallenges = useInvalidateDailyChallenges();

  return useMutation({
    mutationFn: async (lessonId: string): Promise<ListenResult> => {
      if (isGuest) return { tracked: true, ...useGuestProgressStore.getState().trackListen() };
      if (isOffline) {
        useWriteQueueStore.getState().enqueue({
          kind: "trackListen",
          lessonId,
          ts: new Date().toISOString(),
        });
        return { tracked: true };
      }
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
  const isGuest = useGuestStore((s) => s.isGuest);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (isGuest) return useGuestProgressStore.getState().useFreeze();
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
