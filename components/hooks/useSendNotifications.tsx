"use client";

import { useTabsContext } from "@/app/(protected)/home/tabs-context";
import { useChatStore } from "@/src/store/chatStore";
import { createClient } from "@/utils/supabase/client";

export async function isGeneralChat(chatId: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("chats")
    .select("name")
    .eq("id", chatId)
    .single();

  if (error) {
    console.error("Error checking chat type:", error.message);
    return false;
  }

  return data?.name === "Group Chat";
}

export function useSendNotification() {
  const { openTab } = useTabsContext();

  const sendNotification = async (
    title: string,
    chatId: string,
    options?: NotificationOptions
  ) => {
    const activeChatIds = useChatStore.getState().chatIds;
    if (activeChatIds.includes(chatId)) return;

    const generalChat = await isGeneralChat(chatId);

    if (!("Notification" in window)) {
      console.error("This browser does not support notifications.");
      return;
    }

    if (Notification.permission === "granted") {
      const notification = new Notification(title, options);

      notification.onclick = () => {
        if (generalChat) {
          openTab("General", "/livechat", chatId);
        } else {
          openTab(title, title, chatId);
        }
        window.focus();
      };
    } else {
      console.warn("Notifications are disabled or not granted.");
    }
  };

  return { sendNotification };
}
