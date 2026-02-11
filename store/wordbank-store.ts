import { create } from "zustand";

interface WordBankState {
  savedIds: Set<string>;
  save: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  isSaved: (id: string) => boolean;
  count: () => number;
}

export const useWordBankStore = create<WordBankState>((set, get) => ({
  savedIds: new Set<string>(),

  save: (id) =>
    set((state) => {
      const next = new Set(state.savedIds);
      next.add(id);
      return { savedIds: next };
    }),

  remove: (id) =>
    set((state) => {
      const next = new Set(state.savedIds);
      next.delete(id);
      return { savedIds: next };
    }),

  toggle: (id) => {
    if (get().savedIds.has(id)) {
      get().remove(id);
    } else {
      get().save(id);
    }
  },

  isSaved: (id) => get().savedIds.has(id),

  count: () => get().savedIds.size,
}));
