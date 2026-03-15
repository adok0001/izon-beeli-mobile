import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Bounty {
  id: string;
  title: string;
  description: string;
  languageId: string;
  category: string | null;
  contributionType: string | null;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  status: string;
  expiresAt: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  progressPercent: number;
}

export interface CreateBountyInput {
  title: string;
  description: string;
  languageId: string;
  category?: string;
  contributionType?: "word" | "phrase" | "audio";
  targetCount: number;
  xpReward: number;
  expiresAt?: string;
}

export interface UpdateBountyInput {
  id: string;
  status?: "active" | "completed" | "cancelled";
  title?: string;
  description?: string;
  targetCount?: number;
  xpReward?: number;
  expiresAt?: string | null;
}

// Public: active bounties for learners
export function useBounties(languageId?: string, category?: string) {
  const params = new URLSearchParams();
  if (languageId) params.set("languageId", languageId);
  if (category) params.set("category", category);
  const qs = params.toString();

  return useQuery<Bounty[]>({
    queryKey: ["bounties", languageId, category],
    queryFn: () => apiFetch<Bounty[]>(`/bounties${qs ? `?${qs}` : ""}`),
  });
}

// Admin: all bounties across all statuses
export function useAdminBounties() {
  const { getToken } = useAuth();

  return useQuery<Bounty[]>({
    queryKey: ["bounties-admin"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Bounty[]>("/bounties/admin", { token: token! });
    },
  });
}

export function useCreateBounty() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBountyInput) => {
      const token = await getToken();
      return apiFetch<Bounty>("/bounties/admin/create", {
        method: "POST",
        token: token!,
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      queryClient.invalidateQueries({ queryKey: ["bounties-admin"] });
    },
  });
}

export function useUpdateBounty() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateBountyInput) => {
      const token = await getToken();
      return apiFetch<Bounty>(`/bounties/admin/${id}`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      queryClient.invalidateQueries({ queryKey: ["bounties-admin"] });
    },
  });
}

export function useCancelBounty() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ cancelled: boolean; id: string }>(
        `/bounties/admin/${id}`,
        { method: "DELETE", token: token! }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      queryClient.invalidateQueries({ queryKey: ["bounties-admin"] });
    },
  });
}
