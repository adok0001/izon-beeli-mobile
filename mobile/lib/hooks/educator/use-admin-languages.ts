import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Language {
  id: string;
  name: string;
  nativeName: string;
  region: string;
}

export interface UpsertLanguageInput {
  id: string;
  name: string;
  nativeName: string;
  region: string;
  isNew: boolean;
}

export function useAdminLanguages(enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<Language[]>({
    queryKey: ["languages"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Language[]>("/languages", { token: token ?? undefined });
    },
    enabled: !!isSignedIn && enabled,
  });
}

export function useUpsertLanguage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, nativeName, region, isNew }: UpsertLanguageInput) => {
      const token = await getToken();
      const path = isNew ? "/languages/admin" : `/languages/admin/${id}`;
      const body = isNew ? { id, name, nativeName, region } : { name, nativeName, region };
      return apiFetch<Language>(path, {
        method: isNew ? "POST" : "PATCH",
        token: token ?? undefined,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["languages"] }),
  });
}

export function useDeleteLanguage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ deleted: true }>(`/languages/admin/${id}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["languages"] }),
  });
}
