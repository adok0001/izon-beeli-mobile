import { create } from "zustand";
import {
  cleanupLegacyCache,
  clearAllDownloads,
  deleteDownload,
  downloadLesson,
  listDownloads,
  totalBytes,
  type DownloadRecord,
} from "@/lib/downloads";
import type { LocalizedText } from "@/types";

export interface DownloadInput {
  lessonId: string;
  courseId: string;
  title: string | LocalizedText;
  courseTitle?: string | LocalizedText;
  remoteUrl: string;
}

interface DownloadsState {
  downloads: Record<string, DownloadRecord>;
  downloadingIds: Record<string, true>;
  _hydrated: boolean;
  isDownloaded: (lessonId: string) => boolean;
  isDownloading: (lessonId: string) => boolean;
  totalSizeBytes: () => number;
  download: (input: DownloadInput) => Promise<void>;
  downloadCourse: (inputs: DownloadInput[]) => Promise<void>;
  remove: (lessonId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  hydrate: () => Promise<void>;
  reset: () => void;
}

export const useDownloadsStore = create<DownloadsState>((set, get) => ({
  downloads: {},
  downloadingIds: {},
  _hydrated: false,

  isDownloaded: (lessonId) => !!get().downloads[lessonId],
  isDownloading: (lessonId) => !!get().downloadingIds[lessonId],
  totalSizeBytes: () => totalBytes(Object.values(get().downloads)),

  download: async (input) => {
    if (get().downloads[input.lessonId] || get().downloadingIds[input.lessonId]) return;
    set((s) => ({ downloadingIds: { ...s.downloadingIds, [input.lessonId]: true } }));
    try {
      const record = await downloadLesson(input);
      set((s) => {
        const downloadingIds = { ...s.downloadingIds };
        delete downloadingIds[input.lessonId];
        return { downloads: { ...s.downloads, [input.lessonId]: record }, downloadingIds };
      });
    } catch (err) {
      set((s) => {
        const downloadingIds = { ...s.downloadingIds };
        delete downloadingIds[input.lessonId];
        return { downloadingIds };
      });
      throw err;
    }
  },

  // Sequential rather than parallel — keeps bulk-download UX simple (one
  // lesson progressing at a time) and avoids saturating bandwidth on
  // cellular. The manifest write-lock in lib/downloads.ts makes concurrent
  // calls safe regardless, but sequential is the deliberate choice here.
  downloadCourse: async (inputs) => {
    for (const input of inputs) {
      try {
        await get().download(input);
      } catch {
        // Continue past individual failures so one bad lesson doesn't block the rest.
      }
    }
  },

  remove: async (lessonId) => {
    await deleteDownload(lessonId);
    set((s) => {
      const next = { ...s.downloads };
      delete next[lessonId];
      return { downloads: next };
    });
  },

  clearAll: async () => {
    await clearAllDownloads();
    set({ downloads: {} });
  },

  hydrate: async () => {
    try {
      const records = await listDownloads();
      const downloads: Record<string, DownloadRecord> = {};
      for (const r of records) downloads[r.lessonId] = r;
      set({ downloads, _hydrated: true });
    } catch {
      set({ _hydrated: true });
    }
    // Runs after the manifest load unblocks the UI (set() above already
    // notified subscribers) — reclaiming the old volatile cache dir isn't
    // needed for the app to become usable, so it shouldn't gate startup.
    cleanupLegacyCache();
  },

  reset: () => set({ downloads: {}, downloadingIds: {}, _hydrated: false }),
}));
