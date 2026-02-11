import { create } from "zustand";
import { SAMPLE_JOURNAL_ENTRIES } from "@/lib/mock-data";
import type { JournalEntry } from "@/types";

interface JournalState {
  entries: JournalEntry[];
  addEntry: (title: string, content: string, lessonId?: string) => void;
  updateEntry: (id: string, title: string, content: string) => void;
  deleteEntry: (id: string) => void;
}

export const useJournalStore = create<JournalState>((set) => ({
  entries: SAMPLE_JOURNAL_ENTRIES,

  addEntry: (title, content, lessonId) =>
    set((state) => ({
      entries: [
        {
          id: `j-${Date.now()}`,
          title,
          content,
          lessonId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...state.entries,
      ],
    })),

  updateEntry: (id, title, content) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id
          ? { ...e, title, content, updatedAt: new Date().toISOString() }
          : e
      ),
    })),

  deleteEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    })),
}));
