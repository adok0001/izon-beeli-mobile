import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Bulk scene mutations — unlike the per-lesson save in use-lesson-save.ts,
 * these update every lesson sharing a scene slug within a course at once, so
 * a rename/reorder/illustration change can't drift between lessons in the
 * same scene.
 */

export function useUpdateScene() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      scene,
      sceneTitle,
      sceneOrder,
      sceneIllustration,
      sceneIllustrationUrl,
    }: {
      courseId: string;
      scene: string;
      sceneTitle?: string | null;
      sceneOrder?: number | null;
      sceneIllustration?: string | null;
      sceneIllustrationUrl?: string | null;
    }) => {
      const token = await getToken();
      return apiFetch<{ success: true; updated: number }>(
        `/educator/courses/${courseId}/scenes/${encodeURIComponent(scene)}`,
        { method: "PATCH", token, body: JSON.stringify({ sceneTitle, sceneOrder, sceneIllustration, sceneIllustrationUrl }) },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "lessons"] });
    },
  });
}

export function useDeleteScene() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, scene }: { courseId: string; scene: string }) => {
      const token = await getToken();
      return apiFetch<{ success: true; ungrouped: number }>(
        `/educator/courses/${courseId}/scenes/${encodeURIComponent(scene)}`,
        { method: "DELETE", token },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "lessons"] });
    },
  });
}
