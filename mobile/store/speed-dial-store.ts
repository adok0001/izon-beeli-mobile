import { create } from "zustand";

interface SpeedDialState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useSpeedDialStore = create<SpeedDialState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
