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
  | {
      kind: "dictionary";
      entry: DictionaryEntry;
      uiLanguage: UiLanguage;
      /** Set by Studio for rows the viewer may edit in place — contribution-sourced
       * rows are excluded, since they live outside `dictionary_entries`. */
      editable?: boolean;
    }
  | { kind: "lesson"; lesson: PreviewLesson; uiLanguage: UiLanguage };

interface PreviewState {
  payload: PreviewPayload | null;
  setPreview: (payload: PreviewPayload) => void;
  /** Swap in the row a field save returned. Keeps the previewed entry current
   * without invalidating the query behind it — that refetch is what tore the
   * old inline editor's input out mid-edit. */
  updateDictionaryEntry: (entry: DictionaryEntry) => void;
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
  updateDictionaryEntry: (entry) =>
    set((state) =>
      state.payload?.kind === "dictionary" ? { payload: { ...state.payload, entry } } : {}
    ),
  clear: () => set({ payload: null }),
}));
