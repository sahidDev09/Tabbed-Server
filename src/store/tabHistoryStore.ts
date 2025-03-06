"use client";

import { create } from "zustand";

export interface HistoryEntry {
  id: string;
  title: string | null;
  chatId?: string;
}

interface TabHistoryStore {
  history: HistoryEntry[];   
  currentTab: number; 

  pushTabEntry: (entry: HistoryEntry) => void;
  goBack: () => void;
  goForward: () => void;
}

export const useTabHistoryStore = create<TabHistoryStore>((set, get) => ({
  history: [],
  currentTab: -1,

  pushTabEntry: (entry) => {
    const { history, currentTab: currentIndex } = get();

    const newHistory = history.slice(0, currentIndex + 1);

    newHistory.push(entry);

    set({
      history: newHistory,
      currentTab: newHistory.length - 1, 
    });
  },

  goBack: () => {
    const { currentTab: currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentTab: currentIndex - 1 });
    }
  },

  goForward: () => {
    const { currentTab: currentIndex, history } = get();
    if (currentIndex < history.length - 1) {
      set({ currentTab: currentIndex + 1 });
    }
  },
}));