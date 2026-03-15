import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const TOUR_STORAGE_KEY = "feature-tour-completed-v1";

export interface TourRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TourStep {
  id: string;
  /** Tab index (0-4) to spotlight, or null for a centered modal step */
  tabIndex: number | null;
  title: string;
  description: string;
  /** Whether the tooltip appears above or below the spotlight */
  tooltipPosition: "above" | "below" | "center";
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    tabIndex: null,
    title: "Welcome to Izon Beeli 🌍",
    description:
      "Your platform for learning African languages. Let's take a quick look at what's inside.",
    tooltipPosition: "center",
  },
  {
    id: "learn",
    tabIndex: 0,
    title: "Learn",
    description:
      "Browse courses for your chosen language — grouped by theme and difficulty.",
    tooltipPosition: "above",
  },
  {
    id: "listen",
    tabIndex: 1,
    title: "Practice",
    description:
      "Listen to audio lessons with an interactive transcript. Tap any line to jump to that moment.",
    tooltipPosition: "above",
  },
  {
    id: "journal",
    tabIndex: 2,
    title: "Journal",
    description:
      "Write notes after each session. Journaling reinforces vocabulary and tracks your growth.",
    tooltipPosition: "above",
  },
  {
    id: "feed",
    tabIndex: 3,
    title: "Community",
    description:
      "See what other learners are completing, celebrate achievements, and leave comments.",
    tooltipPosition: "above",
  },
  {
    id: "profile",
    tabIndex: 4,
    title: "Your Profile",
    description:
      "Track your streak, XP, and lessons completed. Consistency is the key to fluency.",
    tooltipPosition: "above",
  },
  {
    id: "done",
    tabIndex: null,
    title: "You're all set! 🎉",
    description:
      "Start with the Learn tab — your first lesson is waiting. You can replay this tour from your Profile anytime.",
    tooltipPosition: "center",
  },
];

interface TabBarLayout {
  y: number;
  height: number;
  screenWidth: number;
}

interface TourState {
  completed: boolean;
  active: boolean;
  stepIndex: number;
  tabBarLayout: TabBarLayout | null;
  /** Called from TabBarWithPlayer onLayout */
  setTabBarLayout: (layout: TabBarLayout) => void;
  start: () => void;
  next: () => void;
  skip: () => void;
  reset: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useTourStore = create<TourState>()((set, get) => ({
  completed: false,
  active: false,
  stepIndex: 0,
  tabBarLayout: null,

  setTabBarLayout: (layout) => set({ tabBarLayout: layout }),

  start: () => set({ active: true, stepIndex: 0 }),

  next: () => {
    const { stepIndex } = get();
    const nextIndex = stepIndex + 1;
    if (nextIndex >= TOUR_STEPS.length) {
      set({ active: false, completed: true, stepIndex: 0 });
      AsyncStorage.setItem(TOUR_STORAGE_KEY, "1").catch(() => {});
    } else {
      set({ stepIndex: nextIndex });
    }
  },

  skip: () => {
    set({ active: false, completed: true, stepIndex: 0 });
    AsyncStorage.setItem(TOUR_STORAGE_KEY, "1").catch(() => {});
  },

  reset: async () => {
    await AsyncStorage.removeItem(TOUR_STORAGE_KEY).catch(() => {});
    set({ completed: false, active: false, stepIndex: 0 });
import AsyncStorage from "@/lib/storage";

export type TourId =
  | "learn"
  | "practice"
  | "journal"
  | "feed"
  | "profile";

interface TourState {
  /** Set of tour IDs that have been dismissed */
  seen: Record<string, boolean>;
  /** The tour currently being shown (only one at a time) */
  activeTour: TourId | null;

  hasSeen: (id: TourId) => boolean;
  showTour: (id: TourId) => void;
  dismissTour: () => void;
  hydrate: () => Promise<void>;
  _hydrated: boolean;
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

  hydrate: async () => {
    try {
      const val = await AsyncStorage.getItem(TOUR_STORAGE_KEY);
      if (val) set({ completed: true });
    } catch {
      // ignore
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ seen: JSON.parse(stored), _hydrated: true });
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));
