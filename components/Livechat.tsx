import ChatHeader from "@/components/ChatHeader";
import ChatInput from "@/components/ChatInput";
import React, { useEffect, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import { getOrCreateChatId } from "./lib/chats";
import { createClient } from "@/utils/supabase/client";
import ListMessages from "./ListMessages";

export default function LiveChat({
  user,
  users,
}: {
  user: User;
  users: User[];
}) {
  const supabase = createClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [chatId, setChatId] = useState(null);

  useEffect(() => {
    if (!chatId) {
      const fetchChatId = async () => {
        const id = await getOrCreateChatId(users, supabase);
        setChatId(id);
      };
      fetchChatId();
    }
  }, []);

  if (!chatId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <div className="flex-1 min-h-0 overflow-y-auto" ref={containerRef}>
        <ListMessages
          users={users}
          user={user}
          chatId={chatId}
          containerRef={containerRef}
        />
      </div>
      <div className="inset-x-0 bottom-0 pb-12">
        <ChatInput userId={user.id} chatId={chatId} users={users} />
      </div>
    </div>
  );
}
