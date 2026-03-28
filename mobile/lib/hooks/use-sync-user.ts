import { ApiError, apiFetch } from "@/lib/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useEffect, useRef, useState } from "react";

export interface DeletionPending {
  restoreBy: string;
}

/**
 * Syncs the Clerk user to the backend on app open.
 * Returns { restoreBy } when the account is scheduled for deletion so the
 * caller can redirect to the restore-account screen.
 * Call this once at the app root (e.g. in _layout or index).
 */
export function useSyncUser(): DeletionPending | null {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const synced = useRef(false);
  const [deletionPending, setDeletionPending] = useState<DeletionPending | null>(null);

  // Reset sync flag on sign-out so it re-runs for the next session
  useEffect(() => {
    if (!isSignedIn) {
      synced.current = false;
      setDeletionPending(null);
    }
  }, [isSignedIn]);

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
        if (err instanceof ApiError && err.status === 403) {
          const body = err.body as { error?: string; restoreBy?: string };
          if (body?.error === "account_scheduled_for_deletion" && body.restoreBy) {
            setDeletionPending({ restoreBy: body.restoreBy });
            return;
          }
        }
        console.warn("User sync failed:", err);
        // Don't set synced = true so it retries on next render
      }
    })();
  }, [isSignedIn, user, getToken]);

  return deletionPending;
}
