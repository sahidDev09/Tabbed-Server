import { Message } from "@/types/types";
import { create } from "zustand";

type ChatReplyData = {
  message: Message | null;
  user: string;
};

type ChatStore = {
  chatIds: string[];

  addChatId: (id: string) => void;
  removeChatId: (id: string) => void;
  setChatIds: (ids: string[]) => void;

  replyByChatId: Record<string, ChatReplyData>;
  setReplyForChat: (chatId: string, data: ChatReplyData) => void;
  clearReplyForChat: (chatId: string) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  chatIds: [],

  addChatId: (id: string) => set((state) => ({
    chatIds: [...state.chatIds, id]
  })),

  removeChatId: (id: string) => set((state) => ({
    chatIds: state.chatIds.filter((chatId) => chatId !== id)
  })),

  setChatIds: (ids: string[]) => set({ chatIds: ids }),

  replyByChatId: {},
  setReplyForChat: (chatId, data) =>
    set((state) => ({
      replyByChatId: {
        ...state.replyByChatId,
        [chatId]: data,
      },
    })),
  clearReplyForChat: (chatId) =>
    set((state) => {
      const updated = { ...state.replyByChatId };
      delete updated[chatId];
      return { replyByChatId: updated };
    }),
}));