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
