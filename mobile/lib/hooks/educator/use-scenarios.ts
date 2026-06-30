import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ScenarioTurn {
  text: string;
  translation: string;
  audioUrl?: string;
}

export interface EducatorScenario {
  id: string;
  languageId: string;
  situation: string;
  turns: ScenarioTurn[];
  createdAt: string;
  updatedAt: string;
}

export interface UpsertScenarioInput {
  id?: string;
  languageId: string;
  situation: string;
  turns: ScenarioTurn[];
}

export function useEducatorScenarios(languageId: string) {
  const { getToken } = useAuth();
  return useQuery<EducatorScenario[]>({
    queryKey: ["educator", "scenarios", languageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch(`/educator/scenarios?languageId=${encodeURIComponent(languageId)}`, { token: token! });
    },
    enabled: !!languageId,
  });
}

export function useCreateScenario() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertScenarioInput) => {
      const token = await getToken();
      return apiFetch<EducatorScenario>("/educator/scenarios", {
        method: "POST",
        token: token!,
        body: JSON.stringify(input),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "scenarios", vars.languageId] });
    },
  });
}

export function useUpdateScenario() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, languageId, ...patch }: { id: string; languageId: string; situation?: string; turns?: ScenarioTurn[] }) => {
      const token = await getToken();
      return apiFetch<EducatorScenario>(`/educator/scenarios/${id}`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify(patch),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "scenarios", vars.languageId] });
    },
  });
}

export function useDeleteScenario() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, languageId }: { id: string; languageId: string }) => {
      const token = await getToken();
      return apiFetch(`/educator/scenarios/${id}`, { method: "DELETE", token: token! });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "scenarios", vars.languageId] });
    },
  });
}
