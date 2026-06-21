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

export interface BountySubmission {
  id: string;
  word: string;
  english: string;
  category: string;
  languageId: string;
  type: string;
  status: string;
  audioUrl: string | null;
  imageUrl: string | null;
  userId: string;
  submitterName: string | null;
  bountyId: string | null;
  bountyXpAwarded: number | null;
  createdAt: string;
}

export interface BountySubmissions {
  bountyId: string;
  pending: BountySubmission[];
  credited: BountySubmission[];
}

// Admin: submissions matching a bounty (pending) + already credited to it
export function useBountySubmissions(id: string) {
  const { getToken } = useAuth();

  return useQuery<BountySubmissions>({
    queryKey: ["bounty-submissions", id],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<BountySubmissions>(`/bounties/admin/${id}/submissions`, {
        token: token!,
      });
    },
    enabled: !!id,
  });
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

// Fetch a single bounty by id (admin-authenticated)
export function useBounty(id: string) {
  const { getToken } = useAuth();

  return useQuery<Bounty>({
    queryKey: ["bounty", id],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Bounty>(`/bounties/${id}`, { token: token! });
    },
    enabled: !!id,
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
