"use client";

import { Message } from "@/types/types";
import { User } from "@supabase/auth-js/dist/module/lib/types";
import React, { useEffect, useRef, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ellipsis } from "lucide-react";
import { DeleteAlert, handleEditMessage } from "./MessageActions";
import { Textarea } from "./ui/textarea";
import { ImageWithPlaceholder } from "./ImageWithPlaceholder";
import { createPortal } from "react-dom";
import { useChatStore } from "@/src/store/chatStore";

const formatMentions = (text: string, userEmail: string, users: User[]) => {
  const mentionRegex = /@(\w+)/g;

  return text.split(mentionRegex).map((part, index) => {
    const isUserMentioned = users.some(
      (user) => user.email?.split("@")[0] === part
    );

    if (index % 2 !== 0) {
      return isUserMentioned ? (
        <span
          key={index}
          className="px-1 py-0.1 rounded dark:bg-blue-700 bg-opacity-40 bg-blue-300 text-blue-600 dark:text-white font-medium"
        >
          @{part}
        </span>
      ) : (
        <span key={index}>@{part}</span>
      );
    }
    return part;
  });
};

export function MessageItem({
  chatId,
  msg,
  replyMessage,
  users,
  user,
  isEditing,
  onEdit,
  onCancelEdit,
  grouped,
  userIcons,
}: {
  chatId: string;
  msg: Message;
  replyMessage?: Message | null;
  users: User[];
  user: User;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  grouped: boolean;
  userIcons: Record<string, string>;
}) {
  const foundUser = users.find((u) => u.id === msg.send_by);
  const senderName = foundUser ? foundUser.email!.split("@")[0] : "Unknown";

  const senderColor = userIcons[msg.send_by];

  const [editText, setEditText] = useState(msg.text || "");
  const messageRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState<string | null>(null);

  const currentUserUsername = user.email!.split("@")[0];
  const isUserMentioned = msg.text?.includes(`@${currentUserUsername}`);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const [imgSrc, setImgSrc] = useState(msg.file_url ?? "");

  useEffect(() => {
    if (msg.final_url && msg.final_url !== msg.file_url) {
      const loader = new Image();
      loader.onload = () => {
        setImgSrc(msg.final_url as string);
      };
      loader.src = msg.final_url;
    }
  }, [msg.final_url, msg.file_url]);

  useEffect(() => {
    if (isEditing && messageRef.current) {
      messageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isEditing]);

  const formattedTime = new Date(msg.created_at).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const handleImageClick = (src: string) => {
    setModalImageSrc(src);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalImageSrc(null);
  };

  const handleReply = () => {
    useChatStore
      .getState()
      .setReplyForChat(chatId, { message: msg, user: senderName });
  };

  return (
    <>
      <div
        key={msg.id}
        ref={messageRef}
        id={`message-${msg.id}`}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenuOpen(true);
          setMenuPosition({ x: e.clientX, y: e.clientY });
        }}
        className={`relative group rounded border-l-4 ${
          isEditing
            ? ""
            : isUserMentioned
              ? "bg-orange-200 bg-opacity-25 dark:bg-amber-500 dark:bg-opacity-10 border-[#f1c40f]"
              : "hover:dark:bg-sidebar-accent hover:dark:text-sidebar-accent-foreground hover:bg-neutral-200 border-transparent"
        }`}
      >
        {replyMessage && (
          <div className="flex items-center pl-4 relative">
            <div className="absolute left-6 w-7 h-3 border-l-2 border-t-2 border-gray-500 dark:border-gray-600 rounded-tl-md"></div>

            <div className="flex flex-row gap-2 pl-11 pb-2">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-300">
                {users
                  .find((u) => u.id === replyMessage.send_by)
                  ?.email?.split("@")[0] || "Unknown"}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                {replyMessage.text}
              </p>
            </div>
          </div>
        )}

        {!grouped && (
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2 pl-2 pt-2">
              {senderColor === "black" ? (
                <div className="w-8 h-8 rounded-full bg-black" />
              ) : senderColor === "white" ? (
                <div className="w-8 h-8 rounded-full bg-white border border-gray-300" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-500" />
              )}
              <h1 className="font-medium truncate text-gray-900 dark:text-gray-100">
                {senderName}
              </h1>
              <span className="text-xs text-gray-400 pt-1">
                {formattedTime}
              </span>
            </div>
            {msg.status === "failed" && (
              <div className="message-error text-red-500">
                Failed to deliver. Please retry.
              </div>
            )}
          </div>
        )}

        {isEditing ? (
          <div className="mt-2 pl-12 pr-8">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <div style={{ textAlign: "right", marginTop: "8px" }}>
              <button onClick={onCancelEdit} style={{ marginRight: "8px" }}>
                Cancel
              </button>
              <button
                onClick={() => {
                  handleEditMessage(msg.id, editText, onCancelEdit);
                }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-1 pl-12">
            <div
              className="
          absolute 
          top-0 
          right-0 
          opacity-0 
          pointer-events-none 
          group-hover:opacity-100 
          group-hover:pointer-events-auto
        "
            >
              <MessageMenu
                msg={msg}
                user={user}
                onEdit={onEdit}
                onReply={handleReply}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                menuPosition={menuPosition}
              />
            </div>
            {msg.text && (
              <div className="break-words whitespace-pre-wrap text-gray-700 dark:text-gray-200">
                {formatMentions(msg.text, user.email!, users)}{" "}
                {msg.is_edit && (
                  <span className="text-xs text-gray-400">(edited)</span>
                )}
              </div>
            )}

            {msg.file_type && msg.file_type.startsWith("image/") && (
              <ImageWithPlaceholder
                src={imgSrc}
                alt="Uploaded file"
                className="cursor-pointer"
                onClick={() => handleImageClick(msg.file_url || "")}
              />
            )}

            {msg.file_type &&
              !msg.file_type.startsWith("image/") &&
              msg.file_url && (
                <div className="flex items-center gap-2 rounded">
                  <span>{msg.file_url.split("/").pop()}</span>
                  <a
                    href={msg.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    Download
                  </a>
                </div>
              )}
          </div>
        )}
      </div>

      {isModalOpen &&
        modalImageSrc &&
        createPortal(
          <div
            className="
            fixed inset-0 z-[9999]
            flex flex-col items-center justify-center 
            bg-black bg-opacity-80 
          "
            onClick={handleCloseModal}
          >
            <button
              className="
                absolute top-4 right-4 
                text-white 
                bg-gray-900 bg-opacity-70
                hover:bg-opacity-90
                rounded-full w-8 h-8 
                flex items-center justify-center 
                z-10
              "
              onClick={handleCloseModal}
            >
              ✕
            </button>
            <div
              className="relative cursor-auto max-w-[90vw] max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={modalImageSrc}
                alt="Full view"
                className="w-auto h-full max-w-full max-h-full object-contain"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

const MessageMenu = ({
  msg,
  user,
  onEdit,
  onReply,
  menuOpen,
  setMenuOpen,
  menuPosition,
}: {
  msg: Message;
  user: User;
  onEdit: () => void;
  onReply: () => void;
  menuOpen: boolean;
  setMenuOpen: (val: boolean) => void;
  menuPosition: { x: number; y: number };
}) => {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(true);
          }}
        >
          <Ellipsis />
        </DropdownMenuTrigger>

        {menuOpen && (
          <DropdownMenuContent>
            <DropdownMenuLabel>Action</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {msg.send_by === user.id && (
              <>
                <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
                  Delete
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={onReply}>Reply</DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>

      {isDeleteDialogOpen && (
        <DeleteAlert
          msgId={msg.id}
          onClose={() => setDeleteDialogOpen(false)}
        />
      )}
    </>
  );
};
