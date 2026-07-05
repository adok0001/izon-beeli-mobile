import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ContentStatus } from "./use-content-workflow";

export interface Partner {
  id: string;
  name: string;
  type: string;
  region?: string | null;
  url?: string | null;
  logoUrl?: string | null;
  languageIds: string[];
  isActive: boolean;
  status?: ContentStatus;
  createdBy?: string | null;
}

export interface UpsertPartnerInput {
  id?: string;
  isNew: boolean;
  name?: string;
  type?: string;
  region?: string | null;
  url?: string | null;
  logoUrl?: string | null;
  languageIds?: string[];
  isActive?: boolean;
}

const PARTNERS_KEY = ["content-partners", "admin"] as const;

/** Editor read: every partner (any status), from the admin route. */
export function useContentPartners(enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<Partner[]>({
    queryKey: PARTNERS_KEY,
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Partner[]>("/partners/admin", { token: token ?? undefined });
    },
    enabled: !!isSignedIn && enabled,
  });
}

function invalidatePartners(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: PARTNERS_KEY });
}

export function useUpsertPartner() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isNew, ...body }: UpsertPartnerInput) => {
      const token = await getToken();
      const path = isNew ? "/partners/admin" : `/partners/admin/${id}`;
      return apiFetch<Partner>(path, {
        method: isNew ? "POST" : "PATCH",
        token: token ?? undefined,
        body: JSON.stringify(isNew ? { id, ...body } : body),
      });
    },
    onSuccess: () => invalidatePartners(queryClient),
  });
}

export function useDeletePartner() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ deleted: true }>(`/partners/admin/${id}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => invalidatePartners(queryClient),
  });
}

export function useTogglePartner() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const token = await getToken();
      return apiFetch<Partner>(`/partners/admin/${id}`, {
        method: "PATCH",
        token: token ?? undefined,
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => invalidatePartners(queryClient),
  });
}
