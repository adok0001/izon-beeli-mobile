import { apiFetch } from "@/lib/api";
import type { LocalizedText } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ChallengeType =
  | "complete_quiz"
  | "review_words"
  | "listen_lesson"
  | "complete_lesson"
  | "save_words";

export interface ChallengeTemplate {
  id: string;
  challengeType: ChallengeType;
  title: string;
  titleFr: string | null;
  titleTranslations: LocalizedText | null;
  description: string;
  descriptionFr: string | null;
  descriptionTranslations: LocalizedText | null;
  xpReward: number;
  targetCasual: number;
  targetSteady: number;
  targetIntensive: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChallengeTemplateInput {
  challengeType: ChallengeType;
  titleTranslations: LocalizedText;
  descriptionTranslations: LocalizedText;
  xpReward: number;
  targetCasual: number;
  targetSteady: number;
  targetIntensive: number;
  active?: boolean;
}

export interface UpdateChallengeTemplateInput {
  id: string;
  challengeType?: ChallengeType;
  titleTranslations?: LocalizedText;
  descriptionTranslations?: LocalizedText;
  xpReward?: number;
  targetCasual?: number;
  targetSteady?: number;
  targetIntensive?: number;
  active?: boolean;
}

const TEMPLATES_KEY = ["daily-challenge-templates-admin"] as const;

export function useAdminChallengeTemplates() {
  const { getToken } = useAuth();

  return useQuery<ChallengeTemplate[]>({
    queryKey: TEMPLATES_KEY,
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ChallengeTemplate[]>("/daily-challenges/admin", { token: token! });
    },
  });
}

export function useCreateChallengeTemplate() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateChallengeTemplateInput) => {
      const token = await getToken();
      return apiFetch<ChallengeTemplate>("/daily-challenges/admin/create", {
        method: "POST",
        token: token!,
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  });
}

export function useUpdateChallengeTemplate() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateChallengeTemplateInput) => {
      const token = await getToken();
      return apiFetch<ChallengeTemplate>(`/daily-challenges/admin/${id}`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  });
}

export function useDeactivateChallengeTemplate() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ deactivated: boolean; id: string }>(`/daily-challenges/admin/${id}`, {
        method: "DELETE",
        token: token!,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  });
}
