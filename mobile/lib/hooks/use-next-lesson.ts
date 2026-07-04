import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

export interface NextLessonResponse {
  lesson?: {
    id: string;
    title: string;
    titleFr?: string | null;
    description: string;
    descriptionFr?: string | null;
    duration: number | null;
    courseId: string;
  };
  course?: {
    id: string;
    title: string;
    titleFr?: string | null;
  };
  overallProgress: {
    completed: number;
    total: number;
  };
}

/**
 * @param afterLessonId When set, returns the lesson immediately following this
 * one in path order (unit-aware) instead of the first uncompleted lesson
 * overall — use this for a "Next Lesson" button right after finishing a lesson.
 */
export function useNextLesson(languageId?: string, afterLessonId?: string) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<NextLessonResponse | null>({
    queryKey: ["progress", "next-lesson", languageId, afterLessonId],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams();
      if (languageId) params.set("languageId", languageId);
      if (afterLessonId) params.set("afterLessonId", afterLessonId);
      const qs = params.toString();
      return apiFetch(`/progress/next-lesson${qs ? `?${qs}` : ""}`, { token: token! });
    },
    enabled: !!isSignedIn,
  });
}
