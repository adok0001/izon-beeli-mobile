import { useCourses } from "@/lib/hooks/use-courses";
import { useTodayChallenges } from "@/lib/hooks/use-daily-challenge";
import { useCompletedLessons, useProgressSummary } from "@/lib/hooks/use-progress";
import { useStoryArcs } from "@/lib/hooks/use-story-arc";
import { useWordsDueForReview } from "@/lib/hooks/use-wordbank";
import { useCallback, useMemo } from "react";

/**
 * All learn-screen data: course list, progress, daily challenges, and story
 * arcs, plus the derived sets the screen renders from. Keeps the screen
 * component focused on layout.
 */
export function useLearnData(selectedLanguageId: string) {
  const {
    data: courses = [],
    isLoading: coursesLoading,
    refetch: refetchCourses,
  } = useCourses(selectedLanguageId);
  const {
    data: completedLessonIds,
    isLoading: progressLoading,
    refetch: refetchCompleted,
  } = useCompletedLessons();
  const { data: summary, refetch: refetchSummary } = useProgressSummary();
  const { refetch: refetchDue } = useWordsDueForReview(selectedLanguageId);
  const { data: todayChallenges = [] } = useTodayChallenges();
  const { data: storyArcSummaries = [] } = useStoryArcs();

  const storyArcCourseIds = useMemo(
    () => new Set(storyArcSummaries.map((a) => a.courseId)),
    [storyArcSummaries]
  );
  const completedIds = useMemo(
    () => new Set(completedLessonIds ?? []),
    [completedLessonIds]
  );
  const completedToday = useMemo(
    () => todayChallenges.filter((c) => c.completed).length,
    [todayChallenges]
  );

  const refetchAll = useCallback(
    () =>
      Promise.all([
        refetchCompleted(),
        refetchSummary(),
        refetchCourses(),
        refetchDue(),
      ]),
    [refetchCompleted, refetchSummary, refetchCourses, refetchDue]
  );

  return {
    courses,
    coursesLoading,
    progressLoading,
    summary,
    todayChallenges,
    storyArcCourseIds,
    completedIds,
    completedToday,
    refetchSummary,
    refetchAll,
  };
}
