import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LanguageState {
  selectedLanguageId: string;
  setLanguage: (id: string) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      selectedLanguageId: "izon",
      setLanguage: (id) => set({ selectedLanguageId: id }),
    }),
    { name: "izon-beeli-language" }
  )
);
