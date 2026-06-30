import { queryClient } from "@/lib/api";
import { replayQueue } from "@/lib/write-queue";
import { useGuestProgressStore } from "@/store/guest-progress-store";
import { useGuestStore } from "@/store/guest-store";
import { useWriteQueueStore } from "@/store/write-queue-store";

type GetToken = () => Promise<string | null>;

/**
 * Replays a guest's local lesson completions and saved words against the
 * now-signed-in account via the same write queue offline mutations use, then
 * clears local guest state. The server recomputes streak/XP from the
 * replayed completion events — we never POST raw point totals — so it stays
 * the single source of truth. Returns true once guest state has been fully
 * migrated and cleared; false if the drain didn't complete (e.g. connectivity
 * dropped mid-migration), in which case guest state is left intact so this
 * resumes via the normal write-queue replay on the next reconnect.
 */
export async function migrateGuestToAccount(getToken: GetToken): Promise<boolean> {
  const { completedLessons, wordbankIds } = useGuestProgressStore.getState();

  if (completedLessons.length > 0 || wordbankIds.length > 0) {
    const enqueue = useWriteQueueStore.getState().enqueue;
    for (const { lessonId, completedAt } of completedLessons) {
      enqueue({ kind: "completeLesson", lessonId, ts: completedAt });
    }
    for (const dictionaryEntryId of wordbankIds) {
      enqueue({ kind: "saveWord", dictionaryEntryId, ts: new Date().toISOString() });
    }

    // The sign-in transition also (re-)arms the connectivity-driven replay
    // (lib/write-queue.ts), which can already be draining the queue under the
    // same lock by the time we get here — wait it out rather than racing it.
    for (let attempt = 0; attempt < 20 && useWriteQueueStore.getState().queue.length > 0; attempt++) {
      await replayQueue(getToken);
      if (useWriteQueueStore.getState().queue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    if (useWriteQueueStore.getState().queue.length > 0) {
      return false;
    }
  }

  useGuestProgressStore.getState().reset();
  useGuestStore.getState().exitGuest();
  queryClient.invalidateQueries({ queryKey: ["progress"] });
  queryClient.invalidateQueries({ queryKey: ["wordbank"] });
  queryClient.invalidateQueries({ queryKey: ["current-user"] });
  return true;
}
