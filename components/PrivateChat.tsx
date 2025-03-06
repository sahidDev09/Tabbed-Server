import ChatInput from "@/components/ChatInput";
import React, { useEffect, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { getOrCreateChatId } from "./lib/chats";
import ListMessages from "./ListMessages";
import PrivateChatHeader from "./PrivateChatHeader";

export default function PrivateChat({
  user,
  secondUser,
}: {
  user: User;
  secondUser: User;
}) {
  const supabase = createClient();
  const chatUsers = [user, secondUser];
  const containerRef = useRef<HTMLDivElement>(null);
  const [chatId, setChatId] = useState(null);

  useEffect(() => {
    const fetchChatId = async () => {
      const id = await getOrCreateChatId(chatUsers, supabase);
      setChatId(id);
    };
    fetchChatId();
  }, [chatUsers]);

  if (!chatId) {
    return <div>Loading...</div>;
  }

  const secondUsername = secondUser
    ? secondUser.email!.split("@")[0]
    : "Unknown";

  return (
    <div className="flex flex-col h-full">
      <PrivateChatHeader username={secondUsername} />
      <div className="flex-1 min-h-0 overflow-y-auto" ref={containerRef}>
        <ListMessages
          users={chatUsers}
          user={user}
          chatId={chatId}
          containerRef={containerRef}
        />
      </div>
      <div className="inset-x-0 bottom-0 pb-12">
        <ChatInput userId={user.id} chatId={chatId} users={chatUsers} />
      </div>
    </div>
  );
}
