import { create } from "zustand";

interface LanguageState {
  selectedLanguageId: string;
  setLanguage: (id: string) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  selectedLanguageId: "izon",
  setLanguage: (id) => set({ selectedLanguageId: id }),
}));
