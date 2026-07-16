import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface EducatorSentenceTemplate {
  id: string;
  languageId: string;
  sentence: string;
  answer: string;
  englishSentence: string;
  kind: "blank" | "equivalent";
  literalTranslation: string | null;
  isActive?: boolean;
}

export interface UpsertSentenceInput {
  id?: string;
  languageId: string;
  sentence: string;
  answer: string;
  englishSentence: string;
  kind: "blank" | "equivalent";
  literalTranslation?: string;
}

export function useEducatorSentences(languageId: string) {
  const { getToken } = useAuth();
  return useQuery<EducatorSentenceTemplate[]>({
    queryKey: ["educator", "sentences", languageId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch(`/educator/sentences?languageId=${encodeURIComponent(languageId)}`, { token: token! });
    },
    enabled: !!languageId,
  });
}

export function useUpsertSentence() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertSentenceInput) => {
      const token = await getToken();
      return apiFetch<EducatorSentenceTemplate>("/educator/sentences", {
        method: "POST",
        token: token!,
        body: JSON.stringify(input),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "sentences", vars.languageId] });
      queryClient.invalidateQueries({ queryKey: ["sentences", vars.languageId] });
    },
  });
}

export function useDeleteSentence() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, languageId }: { id: string; languageId: string }) => {
      const token = await getToken();
      return apiFetch(`/educator/sentences/${id}`, { method: "DELETE", token: token! });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["educator", "sentences", vars.languageId] });
      queryClient.invalidateQueries({ queryKey: ["sentences", vars.languageId] });
    },
  });
}
