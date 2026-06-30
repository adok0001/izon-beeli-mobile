import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "guest-mode";

interface GuestState {
  isGuest: boolean;
  _hydrated: boolean;
  enterGuest: () => void;
  exitGuest: () => void;
  hydrate: () => Promise<void>;
}

export const useGuestStore = create<GuestState>((set) => ({
  isGuest: false,
  _hydrated: false,

  enterGuest: () => {
    set({ isGuest: true });
    AsyncStorage.setItem(STORAGE_KEY, "1").catch(() => {});
  },

  exitGuest: () => {
    set({ isGuest: false });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      set({ isGuest: stored === "1", _hydrated: true });
    } catch {
      set({ _hydrated: true });
    }
  },
}));
