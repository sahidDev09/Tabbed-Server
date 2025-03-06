"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { MessageItem } from "./MessageItem";
import { User } from "@supabase/auth-js/dist/module/lib/types";
import React from "react";
import { useMessages } from "./lib/chats";
import { useChatContext } from "@/src/ChatContext";
import { useChatStore } from "@/src/store/chatStore";

export default function ListMessages({
  users,
  user,
  chatId,
  containerRef,
}: {
  users: User[];
  user: User;
  chatId: string;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const supabase = createClient();
  const { messages, loadMoreMessages: loadMore } = useMessages(
    chatId,
    supabase
  );

  const { fetchUnreadCounts } = useChatContext();

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const [userIcons, setUserIcons] = useState<Record<string, string>>({});

  const handleEdit = (messageId: string | null) => {
    setEditingMessageId(messageId);
  };

  const prevScrollRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);

  const isFetchingRef = useRef(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const activeChatIds = useChatStore.getState().chatIds;
    if (!activeChatIds.includes(chatId)) return;

    const validMessages = messages.filter((m) => !m.id.startsWith("temp-"));
    if (validMessages.length === 0) return;
    const lastMessage = validMessages[validMessages.length - 1];
    (async () => {
      const { error } = await supabase
        .from("chat_participants")
        .update({ last_read_message_id: lastMessage.id })
        .eq("chat_id", chatId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to update last_read_message_id:", error);
      }

      await fetchUnreadCounts();
    })();
  }, [messages, chatId, user.id]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 1000 && !isFetchingRef.current) {
        isFetchingRef.current = true;
        prevScrollRef.current = {
          scrollHeight: container.scrollHeight,
          scrollTop: container.scrollTop,
        };
        setLoadingMore(true);
        loadMore();
      }
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerRef, loadMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (loadingMore && prevScrollRef.current) {
      const newScrollHeight = container.scrollHeight;
      const { scrollHeight: oldScrollHeight, scrollTop: oldScrollTop } =
        prevScrollRef.current;
      container.scrollTop = newScrollHeight - oldScrollHeight + oldScrollTop;
      prevScrollRef.current = null;
      isFetchingRef.current = false;
    }
  }, [messages, containerRef]);

  useEffect(() => {
    const uniqueUserIds = Array.from(new Set(messages.map((m) => m.send_by)));
    if (uniqueUserIds.length === 0) return;

    (async () => {
      const { data, error } = await supabase
        .from("icons")
        .select("user_id, icon")
        .in("user_id", uniqueUserIds);

      if (error) {
        console.error("Error fetching icons:", error.message);
        return;
      }

      const iconsMap: Record<string, string> = {};
      data?.forEach((row: { user_id: string; icon: string }) => {
        iconsMap[row.user_id] = row.icon;
      });

      setUserIcons(iconsMap);
    })();
  }, [messages, supabase]);

  useEffect(() => {
    if (containerRef.current && !loadingMore) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, containerRef]);

  return (
    <div className="">
      <div className="space-y-2">
        {messages.map((msg, index) => {
          const prevMessage = messages[index - 1];
          const shouldGroup =
            prevMessage &&
            prevMessage.send_by === msg.send_by &&
            !msg.reply_to &&
            new Date(msg.created_at).getTime() -
              new Date(prevMessage.created_at).getTime() <
              60000;

          const replyMessageObj = msg.reply_to
            ? messages.find((m) => m.id === msg.reply_to)
            : null;

          return (
            <MessageItem
              key={msg.id}
              chatId={chatId}
              msg={msg}
              replyMessage={replyMessageObj}
              users={users}
              user={user}
              isEditing={editingMessageId === msg.id}
              onEdit={() => handleEdit(msg.id)}
              onCancelEdit={() => handleEdit(null)}
              grouped={shouldGroup}
              userIcons={userIcons}
            />
          );
        })}
      </div>
    </div>
  );
}
