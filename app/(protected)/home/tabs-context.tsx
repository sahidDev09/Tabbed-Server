/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  createContext,
  lazy,
  useContext,
  useEffect,
  useState,
} from "react";
import { User } from "@supabase/supabase-js";
import { Message } from "@/types/types";
import { useChatStore } from "@/src/store/chatStore";
import { HistoryEntry, useTabHistoryStore } from "@/src/store/tabHistoryStore";
import { socket } from "@/components/lib/socketClient";

export type TabData = {
  id: string;
  title: string | null;
  content: React.ReactNode;
  chatId?: string;
};

type TabsContextValue = {
  tabs: TabData[];
  activeTabIndex: number;
  openTab: (title: string, id: string, chatId?: string) => void;
  closeTab: (id: string | null) => void;
  setActiveTabIndex: (index: number) => void;
  setTabs: React.Dispatch<React.SetStateAction<TabData[]>>;
  goBack: () => void;
  goForward: () => void;
};

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

const LiveChat = lazy(() => import("@/components/Livechat"));
const PrivateChat = lazy(() => import("@/components/PrivateChat"));
const TestTab = lazy(() => import("@/components/task/taskLayout"));
const Docs = lazy(() => import("@/components/docs/docsLayout"));

export function TabsProvider({
  children,
  user,
  users,
}: {
  children: React.ReactNode;
  user: User;
  messages: Message[];
  users: User[];
}) {
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(-1);
  const { addChatId } = useChatStore();
  const {
    pushTabEntry,
    goBack: historyGoBack,
    goForward: historyGoForward,
  } = useTabHistoryStore();

  // Listen for title updates from the server
  useEffect(() => {
    socket.on("title_updated", (data: { roomId: any; title: any }) => {
      const { roomId, title } = data;

      // Update the tab title in the state
      setTabs((prevTabs) => {
        return prevTabs.map((tab) =>
          tab.id === roomId ? { ...tab, title: title } : tab
        );
      });
    });

    // Cleanup on component unmount
    return () => {
      socket.off("title_updated");
    };
  }, [tabs]);

  // Function to open a tab
  useEffect(() => {
    const storedTabs = localStorage.getItem("tabs");
    const storedActiveIndex = localStorage.getItem("activeTabIndex");

    if (storedTabs) {
      try {
        const parsedTabs: Array<{
          id: string;
          title: string | null;
          chatId?: string;
        }> = JSON.parse(storedTabs);

        parsedTabs.forEach((tab) => {
          openTab(tab.title, tab.id, tab.chatId);
        });
        if (storedActiveIndex !== null) {
          setActiveTabIndex(Number(storedActiveIndex));
        }
      } catch (error) {
        console.error("Error parsing persisted tabs", error);
      }
    }
  }, []);

  useEffect(() => {
    const savedTabs = tabs.map(({ id, title, chatId }) => ({
      id,
      title,
      chatId,
    }));
    localStorage.setItem("tabs", JSON.stringify(savedTabs));
    localStorage.setItem("activeTabIndex", activeTabIndex.toString());
  }, [tabs, activeTabIndex]);

  function openTab(title: string | null, id: string, chatId?: string) {
    if (chatId) {
      addChatId(chatId);
    }

    const existingIndex = tabs.findIndex((tab) => tab.id === id);

    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
      pushTabEntry({ id, title, chatId });
      return;
    }

    const UserList = users.find((u) => u.id === id);
    const isUserList = !!UserList;

    const messageUser = users.find((u) => id === `${u.email!.split("@")[0]}`);
    const isMessageUserTab = !!messageUser;

    const isDocumentId = !isNaN(Number(id));

    const Component = isMessageUserTab
      ? PrivateChat
      : isUserList
        ? TestTab
        : id === "/livechat"
          ? LiveChat
          : id === "/docs" || isDocumentId
            ? Docs
            : null;

    if (!Component) {
      console.error(`No component found for ID: ${id}`);
      return;
    }

    const newTab: TabData = {
      id,
      title: isMessageUserTab
        ? messageUser.email!.split("@")[0]
        : isUserList
          ? title
          : title,
      content: (
        <React.Suspense fallback={<div>Loading...</div>}>
          {isMessageUserTab ? (
            <PrivateChat user={user} secondUser={messageUser} />
          ) : isUserList ? (
            <TestTab
              title={title}
              user={user}
              users={users}
              email={user.email || "unknown@example.com"}
            />
          ) : id === "/livechat" ? (
            <LiveChat user={user} users={users} />
          ) : (
            <Docs
              users={users}
              id={id}
              user={user}
              title={title || "untitled"}
              cover={""}
            />
          )}
        </React.Suspense>
      ),
      chatId,
    };

    setTabs((prevTabs) => {
      const existingIndex = prevTabs.findIndex((tab) => tab.id === id);
      if (existingIndex !== -1) {
        setActiveTabIndex(existingIndex);
        return prevTabs;
      }
      const updatedTabs = [...prevTabs, newTab];
      setActiveTabIndex(updatedTabs.length - 1);
      return updatedTabs;
    });

    pushTabEntry({ id, title, chatId });
  }

  function goBack() {
    const { currentTab, history } = useTabHistoryStore.getState();
    if (currentTab < 0 || history.length === 0) return;

    const currentEntry: HistoryEntry = history[currentTab];
    const currentTabIdx = tabs.findIndex((t) => t.id === currentEntry.id);

    if (currentTabIdx === -1) {
      openTab(currentEntry.title, currentEntry.id, currentEntry.chatId);
    } else if (currentTab > 0) {
      useTabHistoryStore.setState({ currentTab: currentTab - 1 });
      const newEntry: HistoryEntry = history[currentTab - 1];
      const newTabIdx = tabs.findIndex((t) => t.id === newEntry.id);
      if (newTabIdx === -1) {
        openTab(newEntry.title, newEntry.id, newEntry.chatId);
      } else {
        setActiveTabIndex(newTabIdx);
      }
    }
  }

  function goForward() {
    const { currentTab, history } = useTabHistoryStore.getState();
    if (currentTab < 0 || currentTab >= history.length - 1) return;

    const nextEntry: HistoryEntry = history[currentTab + 1];
    const nextTabIdx = tabs.findIndex((t) => t.id === nextEntry.id);

    if (nextTabIdx !== -1) {
      useTabHistoryStore.setState({ currentTab: currentTab + 1 });
      setActiveTabIndex(nextTabIdx);
    }
  }

  // closeTab function when id is removed

  function closeTab(id: string | null) {
    setTabs((prevTabs) => {
      const filteredTabs = prevTabs.filter((tab) => tab.id !== id);

      // If the currently active tab is removed, set the next available tab as active
      if (filteredTabs.length > 0) {
        setActiveTabIndex(Math.max(0, activeTabIndex - 1));
      } else {
        setActiveTabIndex(-1);
      }

      return filteredTabs;
    });
  }

  return (
    <TabsContext.Provider
      value={{
        tabs,
        activeTabIndex,
        openTab,
        setActiveTabIndex,
        setTabs,
        closeTab,
        goBack,
        goForward,
      }}
    >
      {children}
    </TabsContext.Provider>
  );
}

// Hook to use the context
export function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("useTabs() must be used inside a <TabsProvider>");
  }
  return context;
}
