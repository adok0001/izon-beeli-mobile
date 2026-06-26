import { create } from "zustand";
import AsyncStorage from "@/lib/storage";

const STORAGE_KEY = "beeli-profile-avatar";

interface ProfileAvatarState {
  selectedId: string;
  _hydrated: boolean;
  hydrate: () => Promise<void>;
  setSelectedId: (id: string) => void;
}

export const useProfileAvatarStore = create<ProfileAvatarState>((set) => ({
  selectedId: "witness",
  _hydrated: false,

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      set({ selectedId: stored ?? "witness", _hydrated: true });
    } catch {
      set({ _hydrated: true });
    }
  },

  setSelectedId: (id: string) => {
    set({ selectedId: id });
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  },
}));
