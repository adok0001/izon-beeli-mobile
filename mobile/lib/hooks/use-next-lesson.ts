import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "@/lib/api";

export interface NextLessonResponse {
  lesson?: {
    id: string;
    title: string;
    description: string;
    duration: number | null;
    courseId: string;
  };
  course?: {
    id: string;
    title: string;
  };
  overallProgress: {
    completed: number;
    total: number;
  };
}

export function useNextLesson(languageId?: string) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<NextLessonResponse | null>({
    queryKey: ["progress", "next-lesson", languageId],
    queryFn: async () => {
      const token = await getToken();
      const url = languageId
        ? `/progress/next-lesson?languageId=${languageId}`
        : "/progress/next-lesson";
      return apiFetch(url, { token: token! });
    },
    enabled: !!isSignedIn,
  });
}
