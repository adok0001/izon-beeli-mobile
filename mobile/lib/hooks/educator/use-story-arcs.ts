import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface EducatorStoryArc {
  id: string;
  courseId: string | null;
  languageId: string | null;
  title: string;
  description: string;
  status?: string;
  createdBy?: string;
  updatedAt?: string;
}

export interface EducatorStoryChapter {
  id?: string;
  lessonId: string;
  title: string;
  narrativeIntro: string;
  narrativeOutro: string;
  order: number;
}

export interface EducatorStoryArcDetail extends EducatorStoryArc {
  chapters: EducatorStoryChapter[];
}

export function useEducatorStoryArcs(enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<EducatorStoryArc[]>({
    queryKey: ["educator", "story-arcs"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorStoryArc[]>("/educator/story-arcs", { token: token ?? undefined });
    },
    enabled: !!isSignedIn && enabled,
    staleTime: 30_000,
  });
}

export function useEducatorStoryArc(courseId?: string, enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<EducatorStoryArcDetail>({
    queryKey: ["educator", "story-arcs", courseId ?? null],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorStoryArcDetail>(`/educator/story-arcs/${courseId}`, { token: token ?? undefined });
    },
    enabled: !!isSignedIn && !!courseId && enabled,
    staleTime: 30_000,
  });
}

export function useCreateStoryArc() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { courseId?: string; languageId?: string; title: string; description: string }) => {
      const token = await getToken();
      return apiFetch<{ id: string }>("/educator/story-arcs", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "story-arcs"] });
    },
  });
}

export function useUpdateStoryArc() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title, description }: { id: string; title: string; description: string }) => {
      const token = await getToken();
      return apiFetch<{ success: true }>(`/educator/story-arcs/${id}`, {
        method: "PUT",
        token: token ?? undefined,
        body: JSON.stringify({ title, description }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "story-arcs"] });
    },
  });
}

export function useDeleteStoryArc() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ success: true }>(`/educator/story-arcs/${id}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educator", "story-arcs"] });
    },
  });
}

export function useReplaceStoryChapters() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, chapters }: { id: string; chapters: EducatorStoryChapter[] }) => {
      const token = await getToken();
      return apiFetch<{ success: true; count: number }>(`/educator/story-arcs/${id}/chapters`, {
        method: "PUT",
        token: token ?? undefined,
        body: JSON.stringify({ chapters }),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "story-arcs"] });
      queryClient.invalidateQueries({ queryKey: ["educator", "story-arcs", vars.id] });
    },
  });
}
