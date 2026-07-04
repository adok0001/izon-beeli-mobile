import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLevelInfo } from "@/lib/xp-levels";
import type { ProgressSummary } from "@/lib/hooks/use-progress";

const STORAGE_KEY = "guest-progress";
const POINTS_PER_LESSON = 50;

// Mirrors server/src/lib/update-streak.ts and server/src/routes/progress.ts
// so a guest's local streak/XP behaves identically once it migrates to an account.
const STREAK_MILESTONES = new Set([3, 7, 14, 30, 50, 75, 100]);
const FREEZE_GRANT_MILESTONES: Record<number, number> = { 7: 1, 30: 2, 50: 1, 100: 2 };

export interface CompletedLessonRecord {
  lessonId: string;
  completedAt: string; // ISO timestamp, replayed during guest->account migration
}

export interface CompleteLessonResult {
  alreadyCompleted: boolean;
  pointsEarned: number;
  totalPoints: number;
  streak: number;
  streakIncremented: boolean;
  streakMilestone: number | null;
  leveledUp: boolean;
  newLevel?: number;
  newTitle?: string;
  freezeCount: number;
}

interface PersistedShape {
  completedLessons: CompletedLessonRecord[];
  wordbankIds: string[];
  points: number;
  streak: number;
  lastActiveDate: string | null;
  freezeCount: number;
  lastFreezeUsedDate: string | null;
}

export interface UseFreezeResult {
  restored: boolean;
  streak: number;
  freezesRemaining: number;
}

export interface TrackListenResult {
  streak: number;
  streakIncremented: boolean;
  streakMilestone: number | null;
  freezeCount: number;
}

interface GuestProgressState extends PersistedShape {
  _hydrated: boolean;
  isLessonCompleted: (lessonId: string) => boolean;
  isWordSaved: (dictionaryEntryId: string) => boolean;
  completeLesson: (lessonId: string) => CompleteLessonResult;
  trackListen: () => TrackListenResult;
  useFreeze: () => UseFreezeResult;
  saveWord: (dictionaryEntryId: string) => void;
  removeWord: (dictionaryEntryId: string) => void;
  getSummary: () => ProgressSummary;
  reset: () => void;
  hydrate: () => Promise<void>;
}

function todayUtcStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function diffDaysFromToday(dateStr: string | null): number {
  if (!dateStr) return Infinity;
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const [y, m, d] = dateStr.split("-").map(Number);
  const lastUtc = Date.UTC(y, m - 1, d);
  return Math.floor((todayUtc - lastUtc) / (1000 * 60 * 60 * 24));
}

function applyStreakUpdate(lastActiveDate: string | null, currentStreak: number, currentFreezeCount: number) {
  const diff = diffDaysFromToday(lastActiveDate);

  if (diff === 0) {
    return {
      newStreak: currentStreak,
      streakIncremented: false,
      streakMilestone: null as number | null,
      lastActiveDate,
      freezeCount: currentFreezeCount,
    };
  }

  const newStreak = !lastActiveDate ? 1 : diff === 1 ? currentStreak + 1 : 1;
  const freezeGrant = FREEZE_GRANT_MILESTONES[newStreak] ?? 0;
  const firstTimerGrant = !lastActiveDate ? 1 : 0;

  return {
    newStreak,
    streakIncremented: true,
    streakMilestone: STREAK_MILESTONES.has(newStreak) ? newStreak : null,
    lastActiveDate: todayUtcStr(),
    freezeCount: currentFreezeCount + freezeGrant + firstTimerGrant,
  };
}

function persist(state: PersistedShape) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
}

const INITIAL: PersistedShape = {
  completedLessons: [],
  wordbankIds: [],
  points: 0,
  streak: 0,
  lastActiveDate: null,
  freezeCount: 0,
  lastFreezeUsedDate: null,
};

export const useGuestProgressStore = create<GuestProgressState>((set, get) => ({
  ...INITIAL,
  _hydrated: false,

  isLessonCompleted: (lessonId) => get().completedLessons.some((c) => c.lessonId === lessonId),
  isWordSaved: (dictionaryEntryId) => get().wordbankIds.includes(dictionaryEntryId),

  completeLesson: (lessonId) => {
    const state = get();

    if (state.isLessonCompleted(lessonId)) {
      return {
        alreadyCompleted: true,
        pointsEarned: 0,
        totalPoints: state.points,
        streak: state.streak,
        streakIncremented: false,
        streakMilestone: null,
        leveledUp: false,
        freezeCount: state.freezeCount,
      };
    }

    const prevLevel = getLevelInfo(state.points).level;
    const points = state.points + POINTS_PER_LESSON;
    const newLevelInfo = getLevelInfo(points);
    const leveledUp = newLevelInfo.level > prevLevel;
    const streakUpdate = applyStreakUpdate(state.lastActiveDate, state.streak, state.freezeCount);

    const next: PersistedShape = {
      ...state,
      completedLessons: [...state.completedLessons, { lessonId, completedAt: new Date().toISOString() }],
      points,
      streak: streakUpdate.newStreak,
      lastActiveDate: streakUpdate.lastActiveDate,
      freezeCount: streakUpdate.freezeCount,
    };
    set(next);
    persist(next);

    return {
      alreadyCompleted: false,
      pointsEarned: POINTS_PER_LESSON,
      totalPoints: points,
      streak: streakUpdate.newStreak,
      streakIncremented: streakUpdate.streakIncremented,
      streakMilestone: streakUpdate.streakMilestone,
      leveledUp,
      newLevel: leveledUp ? newLevelInfo.level : undefined,
      newTitle: leveledUp ? newLevelInfo.title : undefined,
      freezeCount: streakUpdate.freezeCount,
    };
  },

  trackListen: () => {
    const state = get();
    const streakUpdate = applyStreakUpdate(state.lastActiveDate, state.streak, state.freezeCount);
    const next: PersistedShape = {
      ...state,
      streak: streakUpdate.newStreak,
      lastActiveDate: streakUpdate.lastActiveDate,
      freezeCount: streakUpdate.freezeCount,
    };
    set(next);
    persist(next);
    return {
      streak: streakUpdate.newStreak,
      streakIncremented: streakUpdate.streakIncremented,
      streakMilestone: streakUpdate.streakMilestone,
      freezeCount: streakUpdate.freezeCount,
    };
  },

  useFreeze: () => {
    const state = get();
    const today = todayUtcStr();
    const diff = diffDaysFromToday(state.lastActiveDate);

    if (diff < 2) throw new Error("Streak is not broken");
    if (state.freezeCount <= 0) throw new Error("No freezes available");
    if (state.lastFreezeUsedDate === today) throw new Error("Already used a freeze today");

    const now = new Date();
    const yesterdayStr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1))
      .toISOString()
      .slice(0, 10);

    const next: PersistedShape = {
      ...state,
      lastActiveDate: yesterdayStr,
      freezeCount: state.freezeCount - 1,
      lastFreezeUsedDate: today,
    };
    set(next);
    persist(next);

    return { restored: true, streak: state.streak, freezesRemaining: next.freezeCount };
  },

  saveWord: (dictionaryEntryId) => {
    const state = get();
    if (state.wordbankIds.includes(dictionaryEntryId)) return;
    const next: PersistedShape = { ...state, wordbankIds: [...state.wordbankIds, dictionaryEntryId] };
    set(next);
    persist(next);
  },

  removeWord: (dictionaryEntryId) => {
    const state = get();
    const next: PersistedShape = {
      ...state,
      wordbankIds: state.wordbankIds.filter((id) => id !== dictionaryEntryId),
    };
    set(next);
    persist(next);
  },

  getSummary: () => {
    const state = get();
    const diff = diffDaysFromToday(state.lastActiveDate);
    return {
      points: state.points,
      streak: state.streak,
      completedCount: state.completedLessons.length,
      quizCount: 0,
      freezeCount: state.freezeCount,
      streakBroken: diff >= 2 && state.streak > 0,
      refreshedToday: state.lastActiveDate === todayUtcStr(),
    };
  },

  reset: () => {
    set({ ...INITIAL });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ ...(JSON.parse(stored) as PersistedShape), _hydrated: true });
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));
