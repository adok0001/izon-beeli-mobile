import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ContentStatus } from "./use-content-workflow";

export interface QuizQuestion {
  id: string;
  languageId: string;
  type: string;
  prompt: string;
  answer: string;
  options: string[];
  audioUrl?: string | null;
  explanation?: string | null;
  status?: ContentStatus;
  createdBy?: string | null;
}

export interface UpsertQuizInput {
  id?: string;
  languageId: string;
  type: string;
  prompt: string;
  answer: string;
  options?: string[];
  audioUrl?: string | null;
  explanation?: string | null;
}

/** Editor read: all quiz questions (any status) for a language, from the admin route. */
export function useEducatorQuizBank(languageId?: string, enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<QuizQuestion[]>({
    queryKey: ["educator", "quiz-bank", languageId ?? null],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<QuizQuestion[]>(`/quiz-bank/admin?languageId=${encodeURIComponent(languageId!)}`, {
        token: token ?? undefined,
      });
    },
    enabled: !!isSignedIn && !!languageId && enabled,
  });
}

function invalidateQuizBank(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["educator", "quiz-bank"] });
}

export function useUpsertQuizQuestion() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: UpsertQuizInput) => {
      const token = await getToken();
      const path = id ? `/quiz-bank/admin/${id}` : "/quiz-bank/admin";
      return apiFetch<QuizQuestion>(path, {
        method: id ? "PATCH" : "POST",
        token: token ?? undefined,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => invalidateQuizBank(queryClient),
  });
}

/** Moves a draft quiz question to in_review (submit for the four-eyes queue). */
export function useSubmitQuizForReview() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<QuizQuestion>(`/quiz-bank/admin/${id}`, {
        method: "PATCH",
        token: token ?? undefined,
        body: JSON.stringify({ status: "in_review" }),
      });
    },
    onSuccess: () => invalidateQuizBank(queryClient),
  });
}

export function useDeleteQuizQuestion() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ deleted: true }>(`/quiz-bank/admin/${id}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => invalidateQuizBank(queryClient),
  });
}
