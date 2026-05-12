import AsyncStorage from "@/lib/storage";
import { MOBILE_TOUR_REGISTRY, type TourId } from "@/lib/tours/mobile-tour-registry";
import { create } from "zustand";

interface TourState {
  /** Set of tour IDs that have been dismissed */
  seen: Record<string, boolean>;
  /** The tour currently being shown (only one at a time) */
  activeTour: TourId | null;
  _hydrated: boolean;

  hasSeen: (id: TourId) => boolean;
  showTour: (id: TourId) => void;
  dismissTour: () => void;
  /** Reset all seen tours and optionally show one immediately */
  reset: () => Promise<void>;
  start: () => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = "izon-beeli-tours-seen";

function persist(seen: Record<string, boolean>) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seen)).catch(() => {});
}

export const useTourStore = create<TourState>((set, get) => ({
  seen: {},
  activeTour: null,
  _hydrated: false,

  hasSeen: (id) => !!get().seen[id],

  showTour: (id) => {
    if (id !== "welcome") return;
    if (!MOBILE_TOUR_REGISTRY[id]) return;
    if (get().seen[id] || get().activeTour) return;
    set({ activeTour: id });
  },

  dismissTour: () => {
    const { activeTour, seen } = get();
    if (!activeTour) return;
    const updated = { ...seen, [activeTour]: true };
    set({ activeTour: null, seen: updated });
    persist(updated);
  },

  reset: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    set({ seen: {}, activeTour: null });
    // After reset, show welcome tour immediately
    setTimeout(() => {
      get().showTour("welcome");
    }, 0);
  },

  start: () => {
    get().showTour("welcome");
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ seen: JSON.parse(stored) as Record<string, boolean>, _hydrated: true });
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));
