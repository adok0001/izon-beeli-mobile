"use client";

import { apiFetch } from "@/lib/api";
import type { UserMe } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

/**
 * The single source for the signed-in user's profile (`GET /users/me`), shared
 * across the Studio shell, sidebar, tour, and learner surfaces. All callers key
 * on `["me"]` so they read one cache entry; the fetch waits until Clerk has
 * loaded and confirmed a signed-in session.
 */
export function useMe() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery<UserMe>({
    queryKey: ["me"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<UserMe>("/users/me", { token: token ?? undefined });
    },
    enabled: isLoaded && isSignedIn === true,
  });
}
