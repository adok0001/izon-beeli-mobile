import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface UpsertEtymologyInput {
  id?: string;
  languageId: string;
  word: string;
  english: string;
  trail: Array<{ era: string; form: string; language: string; note: string }>;
}

export function useEtymologyEntries(languageId?: string, enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<import("@/types").EtymologyEntry[]>({
    queryKey: ["etymology", languageId ?? null],
    queryFn: async () => {
      const token = await getToken();
      const q = languageId ? `?languageId=${encodeURIComponent(languageId)}` : "";
      return apiFetch<import("@/types").EtymologyEntry[]>(`/etymology${q}`, { token: token ?? undefined });
    },
    enabled: !!isSignedIn && enabled,
    staleTime: 30_000,
  });
}

export function useUpsertEtymology() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: UpsertEtymologyInput) => {
      const token = await getToken();
      const path = id ? `/etymology/admin/${id}` : "/etymology/admin";
      return apiFetch<import("@/types").EtymologyEntry>(path, {
        method: id ? "PATCH" : "POST",
        token: token ?? undefined,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etymology"] });
    },
  });
}

export function useDeleteEtymology() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ success: true }>(`/etymology/admin/${id}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etymology"] });
    },
  });
}
