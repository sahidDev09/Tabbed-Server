import { create } from "zustand";
import { socket } from "@/components/lib/socketClient";

type DocsStore = {
  refresh: boolean;
  titles: { [id: string]: string }; // Mapping document IDs to titles
  triggerRefresh: () => void;
  updateTitle: (id: string, newTitle: string) => void;
};

export const useDocsStore = create<DocsStore>((set) => ({
  refresh: false,
  titles: {},
  updateTitle: (id: string, newTitle: string) => set((state) => ({
    titles: { ...state.titles, [id]: newTitle } 
  })),
  triggerRefresh: () => set((state) => ({ refresh: !state.refresh })),
}));

socket.on("title_updated", (data: { roomId: string; title: string; userEmail: string; }) => {
  const { roomId, title } = data;

  useDocsStore.getState().updateTitle(roomId, title);

});
