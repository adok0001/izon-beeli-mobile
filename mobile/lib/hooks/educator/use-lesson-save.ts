import { apiFetch } from "@/lib/api";
import type {
  EducatorLesson,
  EducatorLessonCulturalAttachment,
  EducatorLessonSegment,
} from "@/lib/hooks/educator/use-lessons";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Save a lesson's metadata, transcript, and cultural-note anchors in ONE
 * transactional request (`PUT /educator/lessons/:id/save`). Replaces the old
 * three-call sequence (update + segments + cultural-content), so a mid-way
 * failure can't leave a half-saved lesson. Pass `segments`/`attachments` to
 * replace them; omit either to leave it untouched.
 *
 * Lives in its own file (not use-lessons.ts) so the transactional save is easy
 * to locate and evolve alongside the server endpoint.
 */
export function useSaveEducatorLesson() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
      segments,
      attachments,
      checks,
    }: {
      id: string;
      payload: Partial<
        Pick<EducatorLesson, "title" | "description" | "type" | "artist" | "genre" | "style" | "order" | "isActive" | "status">
      > & {
        /** Story fold-in narrative framing (course-bound stories). Empty clears. */
        narrativeIntro?: string | null;
        narrativeOutro?: string | null;
        /** Honest competence statement shown on completion ("You can now …"). */
        canDo?: string | null;
        canDoFr?: string | null;
        /** Scene grouping within the course (journey rendering). */
        scene?: string | null;
        sceneTitle?: string | null;
        sceneOrder?: number | null;
      };
      segments?: EducatorLessonSegment[];
      attachments?: EducatorLessonCulturalAttachment[];
      /** In-lesson checks — replace-all, validated against the segments above. */
      checks?: {
        type: string;
        prompt: string;
        answer: string;
        options?: string[];
        explanation?: string | null;
        afterSegmentIndex?: number | null;
      }[];
    }) => {
      const token = await getToken();
      return apiFetch<{ success: true; segments?: number; attachments?: number; checks?: number }>(`/educator/lessons/${id}/save`, {
        method: "PUT",
        token,
        body: JSON.stringify({ payload, segments, attachments, checks }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "lesson", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["educator", "lessons"] });
    },
  });
}
