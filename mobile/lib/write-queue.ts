import { onlineManager } from "@tanstack/react-query";
import { apiFetch, queryClient } from "@/lib/api";
import { useWriteQueueStore, type QueuedWrite } from "@/store/write-queue-store";

type GetToken = () => Promise<string | null>;

async function replayOne(write: QueuedWrite, token: string): Promise<void> {
  switch (write.kind) {
    case "completeLesson":
      await apiFetch(`/progress/${write.lessonId}/complete`, { method: "POST", token });
      return;
    case "trackListen":
      await apiFetch(`/progress/${write.lessonId}/listen`, { method: "POST", token });
      return;
    case "saveWord":
      await apiFetch("/wordbank", {
        method: "POST",
        token,
        body: JSON.stringify({ dictionaryEntryId: write.dictionaryEntryId }),
      });
      return;
    case "removeWord":
      await apiFetch(`/wordbank/${write.dictionaryEntryId}`, { method: "DELETE", token });
      return;
  }
}

let replaying = false;

/**
 * Drains the offline write queue oldest-first against the real endpoints.
 * Every endpoint here (complete/listen/saveWord/removeWord) is idempotent
 * server-side, so a write that already landed just no-ops on replay. Stops
 * on the first failure (network drop, server error) and leaves the rest of
 * the queue for the next online event — never reorders or drops writes.
 */
export async function replayQueue(getToken: GetToken): Promise<void> {
  if (replaying) return;
  replaying = true;
  let drainedAny = false;
  try {
    const token = await getToken();
    if (!token) return;
    for (;;) {
      const next = useWriteQueueStore.getState().queue[0];
      if (!next) break;
      try {
        await replayOne(next, token);
      } catch {
        break;
      }
      useWriteQueueStore.getState().removeFirst();
      drainedAny = true;
    }
  } finally {
    replaying = false;
    if (drainedAny) {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["wordbank"] });
    }
  }
}

/** Replays immediately if already online, then keeps draining on every reconnect. */
export function startWriteQueueReplay(getToken: GetToken): () => void {
  if (onlineManager.isOnline()) {
    replayQueue(getToken).catch(() => {});
  }
  return onlineManager.subscribe((online) => {
    if (online) replayQueue(getToken).catch(() => {});
  });
}
