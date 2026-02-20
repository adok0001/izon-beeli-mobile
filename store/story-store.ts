import { create } from "zustand";
import AsyncStorage from "@/lib/storage";
import type { StoryChapter } from "@/types";

const STORAGE_KEY = "izon-beeli-story-progress";

interface StoryState {
  completedChapters: Record<string, string[]>; // storyId -> chapterId[]
  currentChapter: Record<string, string>; // storyId -> current chapterId
  completeChapter: (storyId: string, chapterId: string) => void;
  isChapterUnlocked: (
    storyId: string,
    chapterId: string,
    chapters: StoryChapter[]
  ) => boolean;
  hydrate: () => Promise<void>;
  _hydrated: boolean;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  completedChapters: {},
  currentChapter: {},
  _hydrated: false,

  completeChapter: (storyId, chapterId) => {
    const state = get();
    const existing = state.completedChapters[storyId] ?? [];
    if (existing.includes(chapterId)) return;

    const updated = {
      ...state.completedChapters,
      [storyId]: [...existing, chapterId],
    };

    set({ completedChapters: updated });

    // Persist
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        completedChapters: updated,
        currentChapter: state.currentChapter,
      })
    ).catch(() => {});
  },

  isChapterUnlocked: (storyId, chapterId, chapters) => {
    const sorted = [...chapters].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((ch) => ch.id === chapterId);

    // First chapter is always unlocked
    if (index <= 0) return true;

    // Unlock if previous chapter is completed
    const prevChapter = sorted[index - 1];
    const completed = get().completedChapters[storyId] ?? [];
    return completed.includes(prevChapter.id);
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          completedChapters: parsed.completedChapters ?? {},
          currentChapter: parsed.currentChapter ?? {},
          _hydrated: true,
        });
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));
