import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { apiFetch } from "@/lib/api";

/**
 * Syncs the Clerk user to the backend on app open.
 * Call this once at the app root (e.g. in _layout or index).
 */
export function useSyncUser() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const synced = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !user || synced.current) return;

    (async () => {
      try {
        const token = await getToken();
        if (!token) return;

        await apiFetch("/users/sync", {
          method: "POST",
          token,
          body: JSON.stringify({
            name: user.username ?? "Learner",
            email: user.primaryEmailAddress?.emailAddress ?? "",
            avatarUrl: user.imageUrl,
          }),
        });
        synced.current = true;
      } catch (err) {
        console.warn("User sync failed:", err);
        // Don't set synced = true so it retries on next render
      }
    })();
  }, [isSignedIn, user, getToken]);
}
