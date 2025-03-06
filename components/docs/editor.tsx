import React, { useEffect, useMemo, useRef, useState } from "react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";
import { PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import { useTheme } from "@/src/ThemeProvider";
import { createClient } from "@/utils/supabase/client";
import { socket } from "../lib/socketClient";

const supabase = createClient();

interface EditorProps {
  userEmail?: string;
  documentId?: string;
  initialContent?: string | PartialBlock[];
  onChange: (content: string) => void;
  editable: boolean;
}

const uploadFileToSupabase = async (file: File): Promise<string> => {
  try {
    const filePath = `docs/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("docs")
      .upload(filePath, file);

    if (error) throw error;

    return supabase.storage.from("docs").getPublicUrl(filePath).data.publicUrl;
  } catch (error) {
    console.error("Upload Error:", error);
    return "";
  }
};

const Editor: React.FC<EditorProps> = ({
  documentId,
  userEmail,
  onChange,
  initialContent,
  editable = true,
}) => {
  const [lastUpdateFromUser, setLastUpdateFromUser] = useState<string | null>(null);
  // This ref signals that the next local change (triggered by a remote update) should be skipped.
  const skipNextChangeRef = useRef(false);

  const parsedInitialContent = useMemo(() => {
    if (!initialContent) return undefined;
    try {
      return typeof initialContent === "string"
        ? JSON.parse(initialContent)
        : initialContent;
    } catch (e) {
      console.error("Content Parsing Error:", e);
      return undefined;
    }
  }, [initialContent]);

  const editor = useCreateBlockNote({
    initialContent: parsedInitialContent,
    uploadFile: uploadFileToSupabase,
  });

  const { theme } = useTheme();

  // Remote update handler. Only process the update if it is coming from another user.
  const handleRemoteContentUpdate = useMemo(
    () =>
      async (data: { roomId: string; content: string; userEmail: string }) => {
        if (data.roomId !== documentId || data.userEmail === userEmail) return;
        try {
          // Mark that the next local change event should be skipped.
          skipNextChangeRef.current = true;
          setLastUpdateFromUser(data.userEmail);
          const parsedContent = JSON.parse(data.content);
          editor.replaceBlocks(editor.topLevelBlocks, parsedContent);
          onChange(data.content);
        } catch (err) {
          console.error("Remote Update Error:", err);
        }
      },
    [documentId, userEmail, editor, onChange]
  );

  useEffect(() => {
    if (!documentId || !userEmail) return;
    socket.on("document_content", handleRemoteContentUpdate);
    return () => {
      socket.off("document_content", handleRemoteContentUpdate);
    };
  }, [documentId, userEmail, handleRemoteContentUpdate]);

  useEffect(() => {
    if (!documentId || !userEmail || !editor) return;

    let isMounted = true;

    const handleEditorChange = () => {
      if (!isMounted) return;
      // If this event was triggered by a remote update, skip it.
      if (skipNextChangeRef.current) {
        skipNextChangeRef.current = false;
        return;
      }
      const content = JSON.stringify(editor.topLevelBlocks);
      onChange(content);
      socket.emit("document_content", {
        roomId: documentId,
        content,
        userEmail,
      });
    };

    // Subscribe to editor content changes.
    editor.onEditorContentChange(handleEditorChange);

    return () => {
      // Prevent further events from firing after unmounting.
      isMounted = false;
    };
  }, [documentId, userEmail, editor, onChange]);

  // Clear the "is editing" message after a short delay.
  useEffect(() => {
    if (lastUpdateFromUser) {
      const timer = setTimeout(() => {
        setLastUpdateFromUser(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdateFromUser]);

  return (
    <div className="max-w-full overflow-x-hidden flex flex-col">
      {lastUpdateFromUser && (
        <div className="text-xs text-gray-500 mb-1 italic container mx-auto">
          {lastUpdateFromUser.split("@")[0]} is editing...
        </div>
      )}
      <BlockNoteView
        className="mt-3 flex flex-col items-start"
        editor={editor}
        theme={theme === "dark" ? "dark" : "light"}
        editable={editable}
      />
    </div>
  );
};

export default Editor;
