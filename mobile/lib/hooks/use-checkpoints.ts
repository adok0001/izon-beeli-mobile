import { apiFetch, isNetworkError } from "@/lib/api";
import {
  buildCheckpoints,
  gatedLessonIds,
  orderedPathGames,
  orderedPathLessons,
} from "@/lib/checkpoints";
import type { JourneyGate } from "@/lib/journey";
import { useCourses, useLanguageLessons } from "@/lib/hooks/use-courses";
import { useIsOffline } from "@/lib/hooks/use-offline";
import { useCompletedLessons } from "@/lib/hooks/use-progress";
import { useGuestProgressStore } from "@/store/guest-progress-store";
import { useGuestStore } from "@/store/guest-store";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Course, Lesson } from "@/types";

// Stable empties — `= []` in a destructure mints a new array every render while
// the query is undefined, invalidating every memo downstream of it.
const EMPTY_COURSES: Course[] = [];
const EMPTY_LESSONS: Lesson[] = [];

interface PassCheckpointInput {
  checkpointId: string;
  languageId: string;
  correct: number;
  total: number;
  attempts: number;
  /**
   * Cleared without a round because the covered lessons couldn't produce fair
   * questions. Opens the path but earns no XP.
   */
  waived?: boolean;
}

export interface PassCheckpointResponse {
  passed: boolean;
  alreadyPassed: boolean;
  xpEarned: number;
  totalPoints?: number;
  leveledUp?: boolean;
  newLevel?: number;
  newTitle?: string;
  streak?: number;
  streakIncremented?: boolean;
  streakMilestone?: number | null;
  freezeCount?: number;
}

/** Checkpoint ids the learner has cleared in this language. */
export function usePassedCheckpoints(languageId: string) {
  const { getToken, isSignedIn } = useAuth();
  const isGuest = useGuestStore((s) => s.isGuest);
  const isOffline = useIsOffline();
  const queryClient = useQueryClient();

  return useQuery<string[]>({
    queryKey: ["checkpoints", languageId],
    queryFn: async () => {
      if (isGuest) {
        return useGuestProgressStore
          .getState()
          .passedCheckpoints.filter((c) => c.languageId === languageId)
          .map((c) => c.checkpointId);
      }

      // Offline, fall back to the last known set rather than an empty one: an
      // empty list would re-lock the path the learner has already unlocked.
      const cached = () => queryClient.getQueryData<string[]>(["checkpoints", languageId]);
      if (isOffline) return cached() ?? [];

      const token = await getToken();
      try {
        const res = await apiFetch<{ passed: string[] }>(
          `/checkpoints?languageId=${encodeURIComponent(languageId)}`,
          { token: token! }
        );
        return res.passed;
      } catch (err) {
        if (isNetworkError(err) && cached()) return cached()!;
        throw err;
      }
    },
    enabled: !!languageId && (!!isSignedIn || isGuest),
  });
}

/**
 * Every checkpoint on the current language's path, with live status.
 *
 * Builds on the `courses` / `lessons` / `completed` queries the Learn tab
 * already holds, so it is usually served from cache — but `useLanguageLessons`
 * pulls the whole language catalog, so screens that only need this
 * conditionally should not mount it unconditionally.
 */
export function useCheckpoints(languageId: string) {
  const { data: courses = EMPTY_COURSES, isLoading: coursesLoading } = useCourses(languageId);
  const { data: lessons = EMPTY_LESSONS, isLoading: lessonsLoading } = useLanguageLessons(languageId);
  const { data: completedLessonIds, isLoading: completedLoading } = useCompletedLessons();
  const { data: passedIds, isLoading: passedLoading } = usePassedCheckpoints(languageId);

  // Every input matters: with courses or lessons still in flight the path is
  // empty, so `checkpoints` is `[]` and callers would conclude there is no gate
  // — or, on the checkpoint screen, that the checkpoint doesn't exist.
  const isLoading = coursesLoading || lessonsLoading || completedLoading || passedLoading;

  const orderedLessons = useMemo(
    () => orderedPathLessons(courses, lessons),
    [courses, lessons]
  );

  // The `type: "game"` rows say where each block ends. They come from the same
  // catalog response as the lessons, so this costs no extra request.
  const orderedGames = useMemo(() => orderedPathGames(courses, lessons), [courses, lessons]);

  const checkpoints = useMemo(
    () =>
      buildCheckpoints(
        orderedLessons,
        new Set(completedLessonIds ?? []),
        new Set(passedIds ?? []),
        orderedGames
      ),
    [orderedLessons, completedLessonIds, passedIds, orderedGames]
  );

  // Gating is defined by position on the whole path, but the journey map is
  // rendered per course — so it takes an id-keyed gate rather than indices.
  const gate: JourneyGate = useMemo(
    () => ({ checkpoints, gatedLessonIds: gatedLessonIds(orderedLessons, checkpoints) }),
    [checkpoints, orderedLessons]
  );

  return { checkpoints, orderedLessons, gate, isLoading };
}

/**
 * Full detail for the lessons a checkpoint covers.
 *
 * The list endpoint (`useLanguageLessons`) omits `transcript`, which the round
 * builder needs — so each covered lesson is fetched by id. Uses the same
 * `["lesson", id]` key as `useLesson`, so the lesson the learner just finished
 * is already warm.
 */
export function useCheckpointLessons(lessonIds: string[]) {
  const results = useQueries({
    queries: lessonIds.map((id) => ({
      queryKey: ["lesson", id],
      queryFn: () => apiFetch<Lesson>(`/lessons/${encodeURIComponent(id)}`),
      enabled: !!id,
    })),
  });

  const lessons = useMemo(
    () => results.map((r) => r.data).filter((l): l is Lesson => !!l),
    // `results` is a fresh array each render; the data identities are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [results.map((r) => r.data?.id ?? "").join("|")]
  );

  return {
    lessons,
    isLoading: results.some((r) => r.isLoading),
    /**
     * Every covered lesson fetched successfully. The waiver path depends on
     * this: a partial fetch yields a thin round that looks identical to a real
     * content gap, and waiving on that would permanently unlock the gate over a
     * flaky network.
     */
    allLoaded: lessonIds.length > 0 && lessons.length === lessonIds.length,
  };
}

/**
 * Record a cleared checkpoint. Only call this with a passing score — the server
 * rejects anything below the pass ratio with a 422.
 */
export function usePassCheckpoint() {
  const { getToken } = useAuth();
  const isGuest = useGuestStore((s) => s.isGuest);
  const queryClient = useQueryClient();

  return useMutation<PassCheckpointResponse, Error, PassCheckpointInput>({
    mutationFn: async (input) => {
      if (isGuest) {
        const already = useGuestProgressStore
          .getState()
          .passedCheckpoints.some((c) => c.checkpointId === input.checkpointId);
        useGuestProgressStore.getState().passCheckpoint(input.checkpointId, input.languageId);
        return { passed: true, alreadyPassed: already, xpEarned: 0 };
      }
      const token = await getToken();
      return apiFetch<PassCheckpointResponse>("/checkpoints", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify(input),
      });
    },
    onSuccess: (_res, input) => {
      // The gate has moved — the map, the summary CTA, and XP all read from these.
      queryClient.invalidateQueries({ queryKey: ["checkpoints", input.languageId] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

