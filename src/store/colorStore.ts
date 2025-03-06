import { create } from "zustand";

type ColorStore = {
  color: string;
  setColor: (newColor: string) => void;
};

export const useColorStore = create<ColorStore>((set) => ({
  color: "",
  setColor: (newColor) => set({ color: newColor }),
}));