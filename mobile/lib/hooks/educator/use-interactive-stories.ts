import { apiFetch } from "@/lib/api";
import type { InteractiveStory } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ContentStatus } from "./use-content-workflow";

export type { StoryChoice, StoryScene, StorySceneType } from "@/types";

export interface EducatorInteractiveStory extends InteractiveStory {
  status?: ContentStatus;
  createdBy?: string | null;
  isActive?: boolean;
}

export type UpsertInteractiveStoryInput = Omit<InteractiveStory, "id" | "language"> & { languageId: string };

export function useEducatorInteractiveStories(languageId: string) {
  const { getToken } = useAuth();
  return useQuery<EducatorInteractiveStory[]>({
    queryKey: ["educator", "interactive-stories", languageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch(`/educator/interactive-stories?languageId=${encodeURIComponent(languageId)}`, { token: token! });
    },
    enabled: !!languageId,
  });
}

export function useCreateInteractiveStory() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertInteractiveStoryInput) => {
      const token = await getToken();
      return apiFetch<EducatorInteractiveStory>("/educator/interactive-stories", {
        method: "POST",
        token: token!,
        body: JSON.stringify(input),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "interactive-stories", vars.languageId] });
    },
  });
}

export function useUpdateInteractiveStory() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      languageId,
      ...patch
    }: { id: string; languageId: string } & Partial<Omit<UpsertInteractiveStoryInput, "id" | "languageId">> & { status?: ContentStatus }) => {
      const token = await getToken();
      return apiFetch<EducatorInteractiveStory>(`/educator/interactive-stories/${id}`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify(patch),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "interactive-stories", vars.languageId] });
    },
  });
}

export function useDeleteInteractiveStory() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; languageId: string }) => {
      const token = await getToken();
      return apiFetch(`/educator/interactive-stories/${id}`, { method: "DELETE", token: token! });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "interactive-stories", vars.languageId] });
    },
  });
}
