import { create } from "zustand";

interface DictionaryNavState {
  entryIds: string[];
  currentId: string;
  languageId: string;
  setContext: (entryIds: string[], currentId: string, languageId: string) => void;
  clear: () => void;
}

export const useDictionaryNavStore = create<DictionaryNavState>((set) => ({
  entryIds: [],
  currentId: "",
  languageId: "",
  setContext: (entryIds, currentId, languageId) => set({ entryIds, currentId, languageId }),
  clear: () => set({ entryIds: [], currentId: "", languageId: "" }),
}));
