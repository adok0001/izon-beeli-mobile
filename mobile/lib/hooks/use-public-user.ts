import { apiFetch } from "@/lib/api";
import { useGuestStore } from "@/store/guest-store";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

/**
 * Another user's public profile card. Strictly the fields already exposed by
 * /users/leaderboard and /contributors — no email, roles or settings.
 */
export interface PublicUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  profileAvatarId: string | null;
  points: number;
  streak: number;
  selectedLanguageId: string | null;
  approvedCount: number;
  rank: number;
  joinedAt: string;
}

export function usePublicUser(userId: string | null | undefined) {
  const { getToken, isSignedIn } = useAuth();
  const isGuest = useGuestStore((s) => s.isGuest);

  return useQuery<PublicUser>({
    queryKey: ["public-user", userId],
    queryFn: async () => {
      // The endpoint is public; the token is passed only so a signed-in caller
      // isn't treated differently from the rest of the app's requests.
      const token = isSignedIn ? await getToken() : undefined;
      return apiFetch<PublicUser>(`/users/${userId}/public`, { token: token ?? undefined });
    },
    enabled: (!!isSignedIn || isGuest) && !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
