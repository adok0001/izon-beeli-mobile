import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "write-queue";

export type QueuedWrite =
  | { kind: "completeLesson"; lessonId: string; ts: string }
  | { kind: "trackListen"; lessonId: string; ts: string }
  | { kind: "saveWord"; dictionaryEntryId: string; ts: string }
  | { kind: "removeWord"; dictionaryEntryId: string; ts: string };

function dedupeKey(write: QueuedWrite): string {
  switch (write.kind) {
    case "completeLesson":
      return `completeLesson:${write.lessonId}`;
    case "trackListen":
      return `trackListen:${write.lessonId}`;
    case "saveWord":
    case "removeWord":
      // saveWord/removeWord for the same word are mutually exclusive — only the
      // most recent action against a given word needs to survive the queue.
      return `word:${write.dictionaryEntryId}`;
  }
}

function persist(queue: QueuedWrite[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue)).catch(() => {});
}

interface WriteQueueState {
  queue: QueuedWrite[];
  _hydrated: boolean;
  enqueue: (write: QueuedWrite) => void;
  removeFirst: () => void;
  clear: () => void;
  hydrate: () => Promise<void>;
}

export const useWriteQueueStore = create<WriteQueueState>((set, get) => ({
  queue: [],
  _hydrated: false,

  enqueue: (write) => {
    const { queue } = get();
    const key = dedupeKey(write);
    const next = [...queue.filter((w) => dedupeKey(w) !== key), write];
    set({ queue: next });
    persist(next);
  },

  removeFirst: () => {
    const next = get().queue.slice(1);
    set({ queue: next });
    persist(next);
  },

  clear: () => {
    set({ queue: [] });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      set({ queue: stored ? (JSON.parse(stored) as QueuedWrite[]) : [], _hydrated: true });
    } catch {
      set({ _hydrated: true });
    }
  },
}));
