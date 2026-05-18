import { create } from "zustand";

interface FeedLikesStore {
  overrides: Record<string, boolean>;
  setLike: (itemId: string, liked: boolean) => void;
}

export const useFeedLikesStore = create<FeedLikesStore>((set) => ({
  overrides: {},
  setLike: (itemId, liked) =>
    set((state) => ({ overrides: { ...state.overrides, [itemId]: liked } })),
}));
