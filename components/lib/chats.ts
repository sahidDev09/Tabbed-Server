import { useChatContext } from "@/src/ChatContext";
import { Message } from "@/types/types";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export async function getOrCreateChatId(
  chatUsers: User[],
  supabase: SupabaseClient
) {
  try {
    const userIds = chatUsers.map((user) => user.id);

    const { data: matchingChats, error: matchingChatsError } =
      await supabase.rpc("find_chat_by_users", { user_ids: userIds });

    if (matchingChatsError) {
      console.error(
        "Error finding matching chats:",
        matchingChatsError.message
      );
      throw matchingChatsError;
    }

    if (matchingChats && matchingChats.length > 0) {
      return matchingChats[0].id;
    }

    const { data: newChat, error: newChatError } = await supabase
      .from("chats")
      .insert({
        type: chatUsers.length === 2 ? "private" : "group",
        name: chatUsers.length > 2 ? "Group Chat" : null,
      })
      .select("id")
      .single();

    if (newChatError) {
      console.error("Error creating new chat:", newChatError.message);
      throw newChatError;
    }

    const chatId = newChat.id;

    const participants = chatUsers.map((user) => ({
      chat_id: chatId,
      user_id: user.id,
    }));

    const { error: participantsError } = await supabase
      .from("chat_participants")
      .insert(participants);

    if (participantsError) {
      console.error("Error adding participants:", participantsError.message);
      throw participantsError;
    }

    return chatId;
  } catch (unknownError) {
    const error = unknownError as Error;
    console.error("Error in getOrCreateChatId:", error.message);
    throw error;
  }
}

export function useMessages(chatId: string, supabase: SupabaseClient) {
  const { messagesCache, setMessagesCache } = useChatContext();
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    let isMounted = true;

    async function fetchMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
  
      if (error) {
        console.error("Error fetching messages:", error.message);
        return;
      }
  
      if (isMounted && data) {
        const reversedData = [...data].reverse();
        setMessagesCache(chatId, (prevMessages: Message[]) => {
          const combined = [...prevMessages, ...reversedData];

          const deduped = combined.filter((msg, index, self) =>
            index === self.findIndex((m) => m.id === msg.id)
          );

          deduped.sort(
            (a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

          return deduped;
      });
      }
    }

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [chatId, supabase, setMessagesCache, page]);

  return {
    messages: messagesCache[chatId] ?? [],
    loadMoreMessages: () => setPage((prev) => prev + 1),
  };
}
