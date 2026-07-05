import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface WordbankEntry {
  id: string;
  word: string;
  definition?: string | null;
  category: string;
  posType?: string | null;
}

export interface UpsertWordbankInput {
  id: string;
  word: string;
  definition?: string;
  category: string;
  posType?: string;
  isNew: boolean;
}

export function useEnglishWordbank(search?: string, enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<WordbankEntry[]>({
    queryKey: ["english-wordbank", search ?? ""],
    queryFn: async () => {
      const token = await getToken();
      const q = search ? `search=${encodeURIComponent(search)}&` : "";
      return apiFetch<WordbankEntry[]>(`/english-wordbank?${q}limit=100`, {
        token: token ?? undefined,
      });
    },
    enabled: !!isSignedIn && enabled,
  });
}

export function useUpsertWordbankEntry() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, word, definition, category, posType, isNew }: UpsertWordbankInput) => {
      const token = await getToken();
      const path = isNew ? "/english-wordbank/admin" : `/english-wordbank/admin/${id}`;
      const body = isNew
        ? { id, word, definition, category, posType }
        : { word, definition, category, posType };
      return apiFetch<WordbankEntry>(path, {
        method: isNew ? "POST" : "PATCH",
        token: token ?? undefined,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["english-wordbank"] }),
  });
}

export function useDeleteWordbankEntry() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ deleted: true }>(`/english-wordbank/admin/${id}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["english-wordbank"] }),
  });
}
