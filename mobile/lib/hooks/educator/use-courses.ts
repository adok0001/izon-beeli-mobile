import { apiFetch } from "@/lib/api";
import type { LocalizedText } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface EducatorCourse {
  id: string;
  title: string | LocalizedText;
  titleFr?: string | null;
  description: string | LocalizedText;
  descriptionFr?: string | null;
  languageId: string;
  level: string;
  order: number;
  courseType?: string | null;
  /** Season this course companions (`courses.season_arc_id`) — drives the Series screen's level bands. */
  seasonArcId?: string | null;
  isActive?: boolean;
}

export interface UpdateEducatorCourseInput {
  id: string;
  title?: string;
  titleFr?: string | null;
  description?: string;
  descriptionFr?: string | null;
  level?: string;
  order?: number;
  courseType?: string | null;
  /** `null` unlinks the course from its season; the server 400s on an unknown id. */
  seasonArcId?: string | null;
}

export function useEducatorCourses(enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<EducatorCourse[]>({
    queryKey: ["educator", "courses"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorCourse[]>("/educator/courses", { token });
    },
    enabled: !!isSignedIn && enabled,
  });
}

export function useToggleCourseActive() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const token = await getToken();
      return apiFetch<{ ok: true }>(`/educator/courses/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "courses"] });
    },
  });
}

export function useUpdateEducatorCourse() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fields }: UpdateEducatorCourseInput) => {
      const token = await getToken();
      return apiFetch<{ ok: true }>(`/educator/courses/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(fields),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "courses"] });
    },
  });
}
