import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

export interface EducatorStats {
  dictionaryEntries: number;
  pendingContributions: number;
  approvedContributions: number;
  pendingLessons: number;
}

export interface AdminStats {
  users: number;
  lessons: number;
  courses: number;
  contributions: number;
  pendingContributions: number;
  lessonsCompleted: number;
  quizzesTaken: number;
  dictionaryEntries: number;
  feedbackReceived: number;
}

export function useEducatorStats(enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<EducatorStats>({
    queryKey: ["educator", "stats"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<EducatorStats>("/educator/stats", { token });
    },
    enabled: !!isSignedIn && enabled,
    staleTime: 60 * 1000,
  });
}

export function useAdminStats(enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<AdminStats>("/admin/stats", { token });
    },
    enabled: !!isSignedIn && enabled,
    staleTime: 60 * 1000,
  });
}
