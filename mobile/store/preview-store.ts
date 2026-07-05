import type { DictionaryEntry } from "@/lib/dictionary";
import type { LessonWord, LocalizedText } from "@/types";
import type { UiLanguage } from "@/store/ui-language-store";
import { create } from "zustand";

export interface PreviewLesson {
  title: string;
  overline: string;
  accentColor: string;
  level?: string | null;
  wordCount?: number;
  duration?: number;
  vocab: LessonWord[];
  objectives: (string | LocalizedText)[];
}

export type PreviewPayload =
  | { kind: "dictionary"; entry: DictionaryEntry; uiLanguage: UiLanguage }
  | { kind: "lesson"; lesson: PreviewLesson; uiLanguage: UiLanguage };

interface PreviewState {
  payload: PreviewPayload | null;
  setPreview: (payload: PreviewPayload) => void;
  clear: () => void;
}

/**
 * Ephemeral holder for "the draft currently being previewed" — set by an
 * editor screen right before navigating to /admin/preview, read once there,
 * then cleared. Avoids an Expo Router param (size-limited, string-only) and
 * needs no new server endpoint since the editor already has the draft in memory.
 */
export const usePreviewStore = create<PreviewState>((set) => ({
  payload: null,
  setPreview: (payload) => set({ payload }),
  clear: () => set({ payload: null }),
}));
