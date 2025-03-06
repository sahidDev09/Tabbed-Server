import { create } from "zustand";

type ChatInputState = {
  textByChatId: Record<string, string>;
  setTextForChat: (chatId: string, text: string) => void;

  selectedFilesByChatId: Record<string, File[]>;
  setSelectedFilesForChat: (chatId: string, files: File[]) => void;
  addSelectedFileForChat: (chatId: string, file: File) => void;

  filePreviewsByChatId: Record<string, string[]>;
  setFilePreviewsForChat: (chatId: string, previews: string[]) => void;
  addFilePreviewForChat: (chatId: string, preview: string) => void;

  mentionQueryByChatId: Record<string, string>;
  setMentionQueryForChat: (chatId: string, query: string) => void;

  filteredMentionUsersByChatId: Record<
    string,
    { id: string; name: string }[]
  >;
  setFilteredMentionUsersForChat: (
    chatId: string,
    users: { id: string; name: string }[]
  ) => void;

  showMentionDropdownByChatId: Record<string, boolean>;
    setShowMentionDropdownForChat: (chatId: string, show: boolean) => void;

  selectedUserIndexByChatId: Record<string, number>;
  setSelectedUserIndexForChat: (chatId: string, index: number) => void;

  resetMentionForChat: (chatId: string) => void;

  isKeyboardNavigation: boolean;
  setIsKeyboardNavigation: (isKeyboard: boolean) => void;
};

export const useChatInputStore = create<ChatInputState>(
  (set: (partial: Partial<ChatInputState> | ((state: ChatInputState) => Partial<ChatInputState>)) => void) => ({
  textByChatId: {},
  setTextForChat: (chatId: string, text: string) =>
    set((state) => ({
      textByChatId: { ...state.textByChatId, [chatId]: text },
    })),

    selectedFilesByChatId: {},
  setSelectedFilesForChat: (chatId, files) =>
    set((state) => ({
      selectedFilesByChatId: { ...state.selectedFilesByChatId, [chatId]: files },
    })),
  addSelectedFileForChat: (chatId, file) =>
    set((state) => ({
      selectedFilesByChatId: {
        ...state.selectedFilesByChatId,
        [chatId]: [...(state.selectedFilesByChatId[chatId] || []), file],
      },
    })),

    filePreviewsByChatId: {},
  setFilePreviewsForChat: (chatId, previews) =>
    set((state) => ({
      filePreviewsByChatId: {
       ...state.filePreviewsByChatId,
        [chatId]: previews,
      },
   })),
  addFilePreviewForChat: (chatId, preview) =>
    set((state) => ({
     filePreviewsByChatId: {
        ...state.filePreviewsByChatId,
        [chatId]: [
       ...(state.filePreviewsByChatId[chatId] || []),
          preview,
        ],
      },
    })),

    mentionQueryByChatId: {},
  setMentionQueryForChat: (chatId, query) =>
    set((state) => ({
      mentionQueryByChatId: {
        ...state.mentionQueryByChatId,
        [chatId]: query,
      },
    })),

  filteredMentionUsersByChatId: {},
  setFilteredMentionUsersForChat: (chatId, users) =>
    set((state) => ({
      filteredMentionUsersByChatId: {
        ...state.filteredMentionUsersByChatId,
        [chatId]: users,
      },
    })),

  showMentionDropdownByChatId: {},
  setShowMentionDropdownForChat: (chatId, show) =>
    set((state) => ({
      showMentionDropdownByChatId: {
        ...state.showMentionDropdownByChatId,
        [chatId]: show,
      },
    })),

  selectedUserIndexByChatId: {},
  setSelectedUserIndexForChat: (chatId, index) =>
    set((state) => ({
      selectedUserIndexByChatId: {
        ...state.selectedUserIndexByChatId,
        [chatId]: index,
     },
    })),

  resetMentionForChat: (chatId) =>
    set((state) => ({
      mentionQueryByChatId: {
        ...state.mentionQueryByChatId,
        [chatId]: "",
      },
      filteredMentionUsersByChatId: {
        ...state.filteredMentionUsersByChatId,
        [chatId]: [],
      },
      showMentionDropdownByChatId: {
        ...state.showMentionDropdownByChatId,
        [chatId]: false,
      },
    })),
    
    isKeyboardNavigation: false,
    setIsKeyboardNavigation: (isKeyboard: boolean) => set({ isKeyboardNavigation: isKeyboard }),
  })
);