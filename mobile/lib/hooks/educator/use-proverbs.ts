import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proverbs"] });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proverbs"] });
    },
  });
}
