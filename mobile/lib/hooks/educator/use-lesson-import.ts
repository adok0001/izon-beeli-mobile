import { apiFetch } from "@/lib/api";
import type { UnifiedImportResult } from "@/lib/hooks/educator/use-unified-import";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface LessonImportInput {
  languageId: string;
  courseId: string;
  /** One entry per uploaded file — each a `{ meta, segments }` lesson. */
  entries: unknown[];
  dryRun: boolean;
}

/**
 * Bulk-import lessons from a parsed CSV into one course. Each row is a transcript
 * line; rows are grouped into lessons by title server-side. A `dryRun` validates
 * and previews; the real run upserts and refreshes the course's lessons.
 */
export function useLessonImport() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ languageId, courseId, entries, dryRun }: LessonImportInput) => {
      const token = await getToken();
      return apiFetch<UnifiedImportResult>("/import/lessons", {
        method: "POST",
        body: JSON.stringify({ languageId, courseId, entries, dryRun }),
        token: token ?? undefined,
      });
    },
    onSuccess: (_res, input) => {
      if (input.dryRun) return;
      queryClient.invalidateQueries({ queryKey: ["educator", "lessons"] });
      queryClient.invalidateQueries({ queryKey: ["educator", "courses"] });
    },
  });
}
