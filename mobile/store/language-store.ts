import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "language-store-language-id";
const ENROLLED_KEY = "language-store-enrolled-ids";

interface LanguageState {
  selectedLanguageId: string;
  enrolledLanguageIds: string[];
  _hydrated: boolean;
  setLanguage: (id: string) => void;
  enrollLanguage: (id: string) => void;
  unenrollLanguage: (id: string) => void;
  hydrate: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  selectedLanguageId: "izon",
  enrolledLanguageIds: ["izon"],
  _hydrated: false,

  setLanguage: (id) => {
    const { enrolledLanguageIds } = get();
    const enrolled = enrolledLanguageIds.includes(id)
      ? enrolledLanguageIds
      : [...enrolledLanguageIds, id];
    set({ selectedLanguageId: id, enrolledLanguageIds: enrolled });
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
    AsyncStorage.setItem(ENROLLED_KEY, JSON.stringify(enrolled)).catch(() => {});
  },

  enrollLanguage: (id) => {
    const { enrolledLanguageIds } = get();
    if (enrolledLanguageIds.includes(id)) {
      set({ selectedLanguageId: id });
      AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
      return;
    }
    const enrolled = [...enrolledLanguageIds, id];
    set({ selectedLanguageId: id, enrolledLanguageIds: enrolled });
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
    AsyncStorage.setItem(ENROLLED_KEY, JSON.stringify(enrolled)).catch(() => {});
  },

  unenrollLanguage: (id) => {
    const { enrolledLanguageIds, selectedLanguageId } = get();
    const enrolled = enrolledLanguageIds.filter((l) => l !== id);
    const newSelected =
      selectedLanguageId === id ? (enrolled[0] ?? "izon") : selectedLanguageId;
    set({ enrolledLanguageIds: enrolled, selectedLanguageId: newSelected });
    AsyncStorage.setItem(STORAGE_KEY, newSelected).catch(() => {});
    AsyncStorage.setItem(ENROLLED_KEY, JSON.stringify(enrolled)).catch(() => {});
  },

  hydrate: async () => {
    try {
      const [storedId, storedEnrolled] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(ENROLLED_KEY),
      ]);
      const selectedLanguageId = storedId ?? "izon";
      let enrolledLanguageIds: string[];
      if (storedEnrolled) {
        enrolledLanguageIds = JSON.parse(storedEnrolled);
        // Ensure selected is always in enrolled list
        if (!enrolledLanguageIds.includes(selectedLanguageId)) {
          enrolledLanguageIds = [selectedLanguageId, ...enrolledLanguageIds];
        }
      } else {
        enrolledLanguageIds = [selectedLanguageId];
      }
      set({ selectedLanguageId, enrolledLanguageIds, _hydrated: true });
    } catch {
      set({ _hydrated: true });
    }
  },
}));
