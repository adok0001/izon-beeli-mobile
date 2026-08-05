import { apiFetch } from "@/lib/api";
import { buildLessonsFile, type LessonExport } from "@/lib/lesson-import";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation } from "@tanstack/react-query";

export interface LessonExportInput {
  languageId: string;
  courseId: string;
  /** Export exactly these lessons. Empty/omitted exports the whole course. */
  ids?: string[];
}

/**
 * Fetch lessons as one uploadable file.
 *
 * Several lessons come back as a single sheet with `===` between them, which is
 * the whole point: the file an educator downloads is the file they upload back,
 * whether it holds one lesson or a whole Movement.
 *
 * A mutation rather than a query, like the other exports — the educator asks for
 * a sheet at a moment of their choosing, and caching a snapshot they are about
 * to edit elsewhere would be actively misleading.
 */
export function useLessonExport() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ languageId, courseId, ids }: LessonExportInput) => {
      const token = await getToken();
      const query = new URLSearchParams({ languageId, courseId });
      if (ids?.length) query.set("ids", ids.join(","));
      const data = await apiFetch<LessonExport>(`/import/lesson-export?${query}`, { token: token ?? undefined });
      return { ...data, csv: buildLessonsFile(data.lessons) };
    },
  });
}
