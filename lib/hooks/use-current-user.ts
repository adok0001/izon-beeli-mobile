import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  streak: number;
  points: number;
  selectedLanguageId: string | null;
  isAdmin: boolean;
  createdAt: string;
}

export function useCurrentUser() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<CurrentUser>({
    queryKey: ["current-user"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<CurrentUser>("/users/me", { token: token! });
    },
    enabled: !!isSignedIn,
    staleTime: 5 * 60 * 1000,
  });
}
