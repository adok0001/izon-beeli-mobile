import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ConfigEntry {
  key: string;
  value: string;
}

const CONFIG_KEY = ["app-config"] as const;

/** Reads the full app config / feature-flag table from the admin route. */
export function useAppConfig(enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<ConfigEntry[]>({
    queryKey: CONFIG_KEY,
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ConfigEntry[]>("/admin/config", { token: token ?? undefined });
    },
    enabled: !!isSignedIn && enabled,
  });
}

function invalidateConfig(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: CONFIG_KEY });
}

/** Creates or updates a single flag (upsert by key). */
export function useUpsertConfig() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: ConfigEntry) => {
      const token = await getToken();
      return apiFetch<ConfigEntry>("/admin/config", {
        method: "PATCH",
        token: token ?? undefined,
        body: JSON.stringify({ key, value }),
      });
    },
    onSuccess: () => invalidateConfig(queryClient),
  });
}

export function useDeleteConfig() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const token = await getToken();
      return apiFetch<{ deleted: true }>(`/admin/config/${encodeURIComponent(key)}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => invalidateConfig(queryClient),
  });
}
