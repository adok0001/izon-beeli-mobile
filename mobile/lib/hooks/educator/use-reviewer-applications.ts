import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface ReviewerApplication {
  id: string;
  role: "teacher" | "professor" | "elder";
  background: string;
  reason: string;
  languages: string[];
  status: ApplicationStatus;
  reviewerNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  userName: string | null;
  userEmail: string | null;
  userId: string;
}

const KEY = ["reviewer-applications", "admin"] as const;

export function useReviewerApplications(enabled = true) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<ReviewerApplication[]>({
    queryKey: KEY,
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ReviewerApplication[]>("/reviewer-applications/admin", {
        token: token ?? undefined,
      });
    },
    enabled: !!isSignedIn && enabled,
    staleTime: 30_000,
  });
}

export interface ReviewApplicationInput {
  id: string;
  status: Exclude<ApplicationStatus, "pending">;
  reviewerNote?: string;
  /** Languages to grant on approval; defaults server-side to the applied ones. */
  grantLanguages?: string[];
}

export function useReviewApplication() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: ReviewApplicationInput) => {
      const token = await getToken();
      return apiFetch(`/reviewer-applications/admin/${id}`, {
        method: "PATCH",
        token: token ?? undefined,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      // The applicant's user row may have flipped to reviewer — let any cached
      // "who am I" reads for the current session refresh too.
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
  });
}
