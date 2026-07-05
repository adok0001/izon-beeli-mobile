import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ContentStatus } from "./use-content-workflow";

export interface Proverb {
  id: string;
  languageId: string;
  text: string;
  translation: string;
  translationFr?: string | null;
  meaning: string;
  meaningFr?: string | null;
  literal?: string | null;
  context?: string | null;
  tags?: string[] | null;
  status?: ContentStatus;
  createdBy?: string | null;
}

export interface UpsertProverbInput {
  id?: string;
  languageId: string;
  text: string;
  translation: string;
  translationFr?: string;
  meaning: string;
  meaningFr?: string;
  literal?: string;
  context?: string;
  tags?: string[];
}

export function useProverbs(languageId?: string, enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<Proverb[]>({
    queryKey: ["proverbs", languageId ?? null],
    queryFn: async () => {
      const token = await getToken();
      const q = languageId ? `?languageId=${encodeURIComponent(languageId)}` : "";
      return apiFetch<Proverb[]>(`/proverbs${q}`, { token: token ?? undefined });
    },
    enabled: !!isSignedIn && enabled,
    staleTime: 30_000,
  });
}

/** Editor read: all proverbs (any status) for a language, from the admin route. */
export function useEducatorProverbs(languageId?: string, enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<Proverb[]>({
    queryKey: ["educator", "proverbs", languageId ?? null],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Proverb[]>(`/proverbs/admin?languageId=${encodeURIComponent(languageId!)}`, {
        token: token ?? undefined,
      });
    },
    enabled: !!isSignedIn && !!languageId && enabled,
  });
}

function invalidateProverbs(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["proverbs"] });
  queryClient.invalidateQueries({ queryKey: ["educator", "proverbs"] });
}

export function useUpsertProverb() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: UpsertProverbInput) => {
      const token = await getToken();
      const path = id ? `/proverbs/admin/${id}` : "/proverbs/admin";
      return apiFetch<Proverb>(path, {
        method: id ? "PATCH" : "POST",
        token: token ?? undefined,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => invalidateProverbs(queryClient),
  });
}

/** Moves a draft proverb to in_review (submit for the four-eyes queue). */
export function useSubmitProverbForReview() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<Proverb>(`/proverbs/admin/${id}`, {
        method: "PATCH",
        token: token ?? undefined,
        body: JSON.stringify({ status: "in_review" }),
      });
    },
    onSuccess: () => invalidateProverbs(queryClient),
  });
}

export function useDeleteProverb() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ deleted: true }>(`/proverbs/admin/${id}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => invalidateProverbs(queryClient),
  });
}
