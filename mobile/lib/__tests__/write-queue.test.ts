/**
 * Verifies the offline-write guarantee end to end: a write queued while
 * offline must (1) persist to disk so it survives the app process being
 * killed, and (2) drain against the real endpoint once connectivity (and a
 * token) are available again. We simulate "kill the app" by wiping the
 * in-memory zustand state and re-hydrating from the same backing storage —
 * the same recovery path a real relaunch takes.
 */

jest.mock("@react-native-async-storage/async-storage", () => {
  let backing: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(backing[key] ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        backing[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        delete backing[key];
        return Promise.resolve();
      }),
      __reset: () => {
        backing = {};
      },
    },
  };
});

const apiFetchMock = jest.fn();
const invalidateQueriesMock = jest.fn();

jest.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
  queryClient: { invalidateQueries: (...args: unknown[]) => invalidateQueriesMock(...args) },
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWriteQueueStore } from "@/store/write-queue-store";
import { replayQueue } from "@/lib/write-queue";

const resetAsyncStorage = AsyncStorage as unknown as { __reset: () => void };

describe("offline write queue", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    invalidateQueriesMock.mockReset();
    resetAsyncStorage.__reset();
    useWriteQueueStore.setState({ queue: [], _hydrated: false });
  });

  it("survives a simulated app kill and drains once the network call succeeds", async () => {
    // 1. Lesson completed while offline.
    useWriteQueueStore.getState().enqueue({
      kind: "completeLesson",
      lessonId: "lesson-1",
      ts: "2026-06-30T12:00:00.000Z",
    });
    expect(useWriteQueueStore.getState().queue).toHaveLength(1);

    // 2. Kill the app: in-memory zustand state is gone, AsyncStorage is not.
    useWriteQueueStore.setState({ queue: [], _hydrated: false });
    expect(useWriteQueueStore.getState().queue).toHaveLength(0);

    // 3. Relaunch: hydrate from the still-populated backing store.
    await useWriteQueueStore.getState().hydrate();
    expect(useWriteQueueStore.getState().queue).toEqual([
      { kind: "completeLesson", lessonId: "lesson-1", ts: "2026-06-30T12:00:00.000Z" },
    ]);

    // 4. Reconnect: the queue drains against the real endpoint.
    apiFetchMock.mockResolvedValueOnce({ completed: true });
    await replayQueue(async () => "fake-token");

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/progress/lesson-1/complete",
      expect.objectContaining({ method: "POST", token: "fake-token" })
    );
    expect(useWriteQueueStore.getState().queue).toHaveLength(0);
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["progress"] });

    // 5. The drained (empty) queue is itself persisted, so a second relaunch stays empty.
    useWriteQueueStore.setState({ queue: [], _hydrated: false });
    await useWriteQueueStore.getState().hydrate();
    expect(useWriteQueueStore.getState().queue).toHaveLength(0);
  });

  it("leaves the queue intact when the replay attempt fails (still offline / server error)", async () => {
    useWriteQueueStore.getState().enqueue({
      kind: "saveWord",
      dictionaryEntryId: "word-1",
      ts: "2026-06-30T12:00:00.000Z",
    });

    apiFetchMock.mockRejectedValueOnce(new Error("Network request failed"));
    await replayQueue(async () => "fake-token");

    expect(useWriteQueueStore.getState().queue).toHaveLength(1);
    expect(invalidateQueriesMock).not.toHaveBeenCalled();

    // Confirm it's still there after another simulated kill+relaunch too.
    useWriteQueueStore.setState({ queue: [], _hydrated: false });
    await useWriteQueueStore.getState().hydrate();
    expect(useWriteQueueStore.getState().queue).toHaveLength(1);
  });
});
