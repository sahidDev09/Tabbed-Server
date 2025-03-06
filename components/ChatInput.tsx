"use client";

import React, { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useChatContext } from "@/src/ChatContext";
import { useChatInputStore } from "@/src/store/chatInputStore";
import { useChatStore } from "@/src/store/chatStore";

export default function ChatInput({
  userId,
  chatId,
  users,
}: {
  userId: string;
  chatId: string;
  users: User[];
}) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const { addOptimisticMessage, updateMessageStatus } = useChatContext();

  const {
    textByChatId,
    setTextForChat,
    selectedFilesByChatId,
    setSelectedFilesForChat,
    addSelectedFileForChat,
    filePreviewsByChatId,
    setFilePreviewsForChat,
    addFilePreviewForChat,
    mentionQueryByChatId,
    setMentionQueryForChat,
    filteredMentionUsersByChatId,
    setFilteredMentionUsersForChat,
    showMentionDropdownByChatId,
    setShowMentionDropdownForChat,
    selectedUserIndexByChatId,
    setSelectedUserIndexForChat,
    resetMentionForChat,
    isKeyboardNavigation,
    setIsKeyboardNavigation,
  } = useChatInputStore();

  const replyByChatId = useChatStore((state) => state.replyByChatId);
  const setReplyForChat = useChatStore((state) => state.setReplyForChat);
  const clearReplyForChat = useChatStore((state) => state.clearReplyForChat);

  const replyData = replyByChatId[chatId] || { message: null, user: "" };

  const text = textByChatId[chatId] || "";
  const selectedFiles = selectedFilesByChatId[chatId] || [];
  const filePreviews = filePreviewsByChatId[chatId] || [];

  const mentionQuery = mentionQueryByChatId[chatId] || "";
  const filteredMentionUsers = filteredMentionUsersByChatId[chatId] || [];
  const showMentionDropdown = showMentionDropdownByChatId[chatId] || false;
  const selectedUserIndex = selectedUserIndexByChatId[chatId] ?? 0;

  const setText = (val: string) => setTextForChat(chatId, val);
  const setSelectedFiles = (files: File[]) =>
    setSelectedFilesForChat(chatId, files);
  const addSelectedFile = (file: File) => addSelectedFileForChat(chatId, file);

  const setFilePreviews = (previews: string[]) =>
    setFilePreviewsForChat(chatId, previews);
  const addFilePreview = (preview: string) =>
    addFilePreviewForChat(chatId, preview);

  const setMentionQuery = (q: string) => setMentionQueryForChat(chatId, q);
  const setFilteredMentionUsers = (usersVal: { id: string; name: string }[]) =>
    setFilteredMentionUsersForChat(chatId, usersVal);
  const setShowMentionDropdown = (show: boolean) =>
    setShowMentionDropdownForChat(chatId, show);

  const setSelectedUserIndex = (i: number) =>
    setSelectedUserIndexForChat(chatId, i);

  const resetMention = () => resetMentionForChat(chatId);

  const extractUsername = (email: string) => email.split("@")[0];

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setText(value);

    const mentionIndex = value.lastIndexOf("@");
    if (mentionIndex !== -1) {
      const query = value.slice(mentionIndex + 1);
      const matchedUsers =
        query.length === 0
          ? users.map((user) => ({
              id: user.id,
              name: extractUsername(user.email!),
            }))
          : users
              .map((user) => ({
                id: user.id,
                name: extractUsername(user.email!),
              }))
              .filter((user) =>
                user.name.toLowerCase().startsWith(query.toLowerCase())
              );
      setFilteredMentionUsers(matchedUsers);
      setMentionQuery(query);
      setShowMentionDropdown(matchedUsers.length > 0);
    } else {
      setShowMentionDropdown(false);
    }
  };

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      const scrollHeight = textAreaRef.current.scrollHeight;
      const maxHeight = 200;
      const newHeight = Math.min(scrollHeight, maxHeight);
      textAreaRef.current.style.height = `${newHeight}px`;
      textAreaRef.current.style.overflowY =
        scrollHeight > maxHeight ? "auto" : "hidden";
      if (scrollHeight > maxHeight) {
        textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
      }
    }
  }, [text]);

  useEffect(() => {
    if (filteredMentionUsers.length > 0) {
      setSelectedUserIndex(0);
    }
  }, [filteredMentionUsers]);

  const handleSelectUser = (username: string) => {
    const mentionIndex = text.lastIndexOf("@");
    const newText =
      text.slice(0, mentionIndex + 1) +
      username +
      " " +
      text.slice(mentionIndex + 1 + mentionQuery.length);
    setText(newText);
    setShowMentionDropdown(false);
    resetMention();
  };

  // Handle sending the message
  const handleSendMessage = async () => {
    if (!text && selectedFiles.length === 0) return;

    const currentReply = replyByChatId[chatId] || { message: null, user: "" };

    if (selectedFiles.length === 0) {
      const tempId = `temp-${Date.now()}`;

      addOptimisticMessage({
        id: tempId,
        chat_id: chatId,
        text,
        is_edit: false,
        send_by: userId,
        created_at: new Date().toISOString(),
        status: "sending",
        file_url: null,
        final_url: null,
        file_type: null,
        reply_to: currentReply.message ? currentReply.message.id : null,
      });

      setText("");
      resetMention();
      clearReplyForChat(chatId);

      const { data, error } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          text,
          send_by: userId,
          file_url: null,
          file_type: null,
          reply_to: currentReply.message ? currentReply.message.id : null,
        })
        .select();

      if (error) {
        console.error("Error sending message:", error.message);
        updateMessageStatus(tempId, "failed");
      } else {
        const newMessage = data![0];
        updateMessageStatus(tempId, "sent", newMessage);
      }
      return;
    }

    const tempMessages = selectedFiles.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      chat_id: chatId,
      text: index === 0 ? text : "",
      is_edit: false,
      send_by: userId,
      created_at: new Date().toISOString(),
      status: "sending" as "sending",
      file_url: filePreviews[index] || null,
      final_url: null,
      file_type: file.type,
      reply_to: currentReply.message ? currentReply.message.id : null,
    }));

    tempMessages.forEach((tempMessage) => {
      console.log("Optimistic message =", JSON.stringify(tempMessage, null, 2));
      addOptimisticMessage(tempMessage);
    });

    setText("");
    setFilePreviews([]);
    setSelectedFiles([]);
    resetMention();
    clearReplyForChat(chatId);

    const entries = Array.from(selectedFiles.entries());
    for (const [index, file] of entries) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${index}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from("chat-uploads")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Error uploading file:", uploadError.message);
        updateMessageStatus(tempMessages[index].id, "failed");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("chat-uploads")
        .getPublicUrl(data?.path ?? fileName);

      const { data: messageData, error } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          text: index === 0 ? text : "",
          send_by: userId,
          file_url: publicUrl,
          file_type: file.type,
          reply_to: currentReply.message ? currentReply.message.id : null,
        })
        .select();

      console.log("Message =", JSON.stringify(messageData, null, 2));
      if (error) {
        console.error("Error sending message:", error.message);
        updateMessageStatus(tempMessages[index].id, "failed");
      } else {
        const newMessage = messageData![0];
        newMessage.final_url = publicUrl || null;
        updateMessageStatus(tempMessages[index].id, "sent", newMessage);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    items.forEach((item) => {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          handleFile(file);
        }
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    files.forEach((file) => handleFile(file));

    e.target.value = "";
  };

  const handleFile = (file: File) => {
    addSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        addFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      addFilePreview(file.name);
    }
  };

  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-2 flex flex-col gap-2">
      {replyByChatId[chatId]?.message && (
        <div className="reply-bar p-2 bg-neutral-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border-b flex justify-between items-center text-sm">
          <span>Replying to {replyByChatId[chatId].user}</span>
          <button
            className="text-sm text-gray-700 dark:text-gray-200"
            onClick={() => {
              clearReplyForChat(chatId);
            }}
          >
            x
          </button>
        </div>
      )}

      <div className="relative w-full border border-gray-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 rounded-md">
        <div className="px-3 py-1 relative">
          <textarea
            ref={textAreaRef}
            className="bg-transparent w-full py-1 resize-none min-h-[20px] text-gray-800 dark:text-gray-200 outline-none"
            placeholder="Send Message"
            value={text}
            rows={1}
            onPaste={handlePaste}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                setIsKeyboardNavigation(true);
                const newIndex = Math.min(
                  selectedUserIndex + 1,
                  filteredMentionUsers.length - 1
                );
                setSelectedUserIndex(newIndex);
                e.preventDefault();
              } else if (e.key === "ArrowUp") {
                setIsKeyboardNavigation(true);
                const newIndex = Math.max(selectedUserIndex - 1, 0);
                setSelectedUserIndex(newIndex);
                e.preventDefault();
              } else if (e.key === "Enter") {
                if (e.shiftKey) {
                  e.preventDefault();
                  setText(text + "\n");
                } else if (
                  showMentionDropdown &&
                  filteredMentionUsers.length > 0
                ) {
                  e.preventDefault();
                  handleSelectUser(
                    filteredMentionUsers[selectedUserIndex].name
                  );
                } else {
                  e.preventDefault();
                  handleSendMessage();
                }
              } else if (e.key === "Tab") {
                if (showMentionDropdown && filteredMentionUsers.length > 0) {
                  e.preventDefault();
                  setIsKeyboardNavigation(false);
                  handleSelectUser(
                    filteredMentionUsers[selectedUserIndex].name
                  );
                }
              }
            }}
          />
          {showMentionDropdown && (
            <div className="absolute bottom-full left-0 w-full border rounded mb-1 z-10 bg-neutral-100 dark:bg-neutral-900">
              {filteredMentionUsers.map((user, index) => (
                <div
                  key={user.id}
                  className={`p-2 cursor-pointer 
                       ${
                         index === selectedUserIndex
                           ? "bg-neutral-200 dark:bg-sidebar-accent dark:text-sidebar-accent-foreground"
                           : "hover:dark:bg-sidebar-accent hover:dark:text-sidebar-accent-foreground hover:bg-neutral-200"
                       }`}
                  onMouseEnter={() => {
                    if (!isKeyboardNavigation) {
                      setSelectedUserIndex(index);
                    }
                  }}
                  onClick={() => {
                    setIsKeyboardNavigation(false);
                    handleSelectUser(user.name);
                  }}
                >
                  {user.name}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleOpenFileDialog}
              className="p-1 border rounded bg-neutral-200 dark:bg-neutral-800"
            >
              +
            </button>

            <button
              onClick={handleSendMessage}
              className="bg-emerald-900 text-white px-3 rounded"
            >
              Send
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
            multiple
          />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap rounded gap-2">
        {selectedFiles.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="relative group h-20 w-20 border rounded-md overflow-hidden"
          >
            {filePreviews[index] && file.type.startsWith("image/") ? (
              <img
                src={filePreviews[index]}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <p className="text-gray-700 truncate p-2">{file.name}</p>
            )}
            <button
              className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-sm rounded-full h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                setFilePreviews(filePreviews.filter((_, i) => i !== index));
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
