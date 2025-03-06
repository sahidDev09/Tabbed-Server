"use client";

import { useTabsContext } from "@/app/(protected)/home/tabs-context";
import { useSendNotification } from "@/components/hooks/useSendNotifications";
import { Message } from "@/types/types";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useChatStore } from "./store/chatStore";

type MessagesCache = {
  [chatId: string]: Message[];
};

type MessageUpdater = Message[] | ((prev: Message[]) => Message[]);

type ChatContextType = {
  messagesCache: MessagesCache;
  setMessagesCache: (chatId: string, updater: MessageUpdater) => void;
  unreadCounts: Record<string, number>;
  fetchUnreadCounts: () => Promise<void>;
  addOptimisticMessage: (message: Message) => void;
  updateMessageStatus: (
    tempId: string,
    status: string,
    newMessage?: Message
  ) => void;
  mergeMessagesWithOptimistic: (
    chatId: string,
    fetchedMessages: Message[]
  ) => void;
  fetchIconForUser: (userID: string) => Promise<string | undefined>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({
  children,
  currentUser,
  users,
}: {
  children: React.ReactNode;
  currentUser: User;
  users: User[];
}) => {
  const supabase = createClient();
  const [messagesCache, setMessagesCacheState] = useState<MessagesCache>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const { sendNotification } = useSendNotification();

  useEffect(() => {
    (async () => {
      await fetchUnreadCounts();
    })();
  }, []);

  const setMessagesCache = (chatId: string, updater: MessageUpdater) => {
    setMessagesCacheState((prev) => {
      const currentMessages: Message[] = prev[chatId] || [];
      const newMessages =
        typeof updater === "function" ? updater(currentMessages) : updater;

      if (JSON.stringify(currentMessages) === JSON.stringify(newMessages)) {
        return prev;
      }
      return {
        ...prev,
        [chatId]: newMessages,
      };
    });
  };

  const fetchIconForUser = async (userId: string) => {
    const { data, error } = await supabase
      .from("icons")
      .select("icon")
      .eq("user_id", userId);

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0].icon || null;
  };

  const mergeMessagesWithOptimistic = (
    chatId: string,
    fetchedMessages: Message[]
  ) => {
    setMessagesCacheState((prev) => {
      const oldMessages = prev[chatId] || [];

      const optimisticMessages = oldMessages.filter(
        (msg) => msg.status === "sending"
      );

      const failedMessages = oldMessages.filter(
        (msg) => msg.status === "failed"
      );

      const mergedMessages = Array.from(
        new Map(
          [...fetchedMessages, ...optimisticMessages, ...failedMessages].map(
            (msg) => [msg.id, msg]
          )
        ).values()
      );

      if (JSON.stringify(oldMessages) === JSON.stringify(mergedMessages)) {
        return prev;
      }

      return {
        ...prev,
        [chatId]: mergedMessages as Message[],
      };
    });
  };

  const addOptimisticMessage = (message: Message) => {
    setMessagesCacheState((prev) => {
      const oldMessages = prev[message.chat_id] || [];
      return {
        ...prev,
        [message.chat_id]: [...oldMessages, message],
      };
    });
  };

  const updateMessageStatus = (
    tempId: string,
    status: string,
    newMessage?: Message
  ) => {
    setMessagesCacheState((prev) => {
      const updatedCache = { ...prev };

      for (const chatId in updatedCache) {
        let updatedMessages = updatedCache[chatId].map((msg) =>
          msg.id === tempId
            ? ({ ...msg, ...newMessage, status } as Message)
            : msg
        );

        if (newMessage) {
          const seen = new Set<string>();
          updatedMessages = updatedMessages.filter((msg) => {
            if (msg.id === newMessage.id) {
              if (seen.has(msg.id)) {
                return false;
              }
              seen.add(msg.id);
              return true;
            }
            return true;
          });
        }

        updatedCache[chatId] = updatedMessages;
      }

      return updatedCache;
    });
  };

  const fetchUnreadCounts = async () => {
    const { data, error } = await supabase.rpc("get_unread_counts", {
      user_id: currentUser.id,
    });

    if (error) {
      console.error("Error fetching unread counts:", error.message);
      return;
    }

    const counts: Record<string, number> = {};
    data.forEach((row: { chat_id: string; unread_count: number }) => {
      const lastMessage = messagesCache[row.chat_id]?.slice(-1)[0];
      if (lastMessage?.send_by !== currentUser.id) {
        counts[row.chat_id] = row.unread_count;
      } else {
        counts[row.chat_id] = 0;
      }
    });

    setUnreadCounts((prevCounts) => ({
      ...prevCounts,
      ...counts,
    }));
  };

  function handleInsert(newMessage: Message) {
    const globalChatIds = useChatStore.getState().chatIds;
    if (
      newMessage.send_by !== currentUser.id &&
      !globalChatIds.includes(newMessage.chat_id)
    ) {
      setUnreadCounts((prev) => ({
        ...prev,
        [newMessage.chat_id]: (prev[newMessage.chat_id] || 0) + 1,
      }));
    }

    setMessagesCacheState((prev) => {
      const oldMessages = prev[newMessage.chat_id] ?? [];

      const alreadyExists = oldMessages.some((msg) => msg.id === newMessage.id);

      if (alreadyExists) {
        return prev;
      }

      const updated = [...oldMessages, newMessage];
      return {
        ...prev,
        [newMessage.chat_id]: updated,
      };
    });

    if (newMessage.send_by !== currentUser.id) {
      const sender = users.find((u) => u.id === newMessage.send_by);
      const senderName = sender?.email?.split("@")[0] ?? "Unknown";
      sendNotification(senderName, newMessage.chat_id, {
        body: newMessage.text ? newMessage.text : "Sent a file",
      });
    }
  }

  function handleUpdate(updatedMessage: Message) {
    setMessagesCacheState((prev) => {
      const oldMessages = prev[updatedMessage.chat_id] ?? [];
      const nextMessages = oldMessages.map((m) =>
        m.id === updatedMessage.id ? updatedMessage : m
      );
      return {
        ...prev,
        [updatedMessage.chat_id]: nextMessages,
      };
    });
  }

  function handleDelete(deletedMessage: Message) {
    setMessagesCacheState((prev) => {
      const oldMessages = prev[deletedMessage.chat_id] ?? [];
      const filtered = oldMessages.filter((m) => m.id !== deletedMessage.id);
      return {
        ...prev,
        [deletedMessage.chat_id]: filtered,
      };
    });
  }

  useEffect(() => {
    const channel = supabase.channel("messages").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
      },
      async (payload) => {
        if (payload.eventType === "INSERT") {
          handleInsert(payload.new as Message);
        } else if (payload.eventType === "UPDATE") {
          handleUpdate(payload.new as Message);
        } else if (payload.eventType === "DELETE") {
          handleDelete(payload.old as Message);
        }
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messagesCache,
        setMessagesCache,
        unreadCounts,
        fetchUnreadCounts,
        addOptimisticMessage,
        updateMessageStatus,
        mergeMessagesWithOptimistic,
        fetchIconForUser,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
