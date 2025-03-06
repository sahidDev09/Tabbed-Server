/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from "react";
import Cover from "./cover";
import dynamic from "next/dynamic";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { debounce } from "lodash";
import { useDocsStore } from "@/src/store/useDocsStore";
import { Skeleton } from "../ui/skeleton";
import { User } from "@supabase/supabase-js";
import HeaderDoc from "./header";
import { socket } from "@/components/lib/socketClient";

interface DocsLayoutProps {
  value?: string;
  id: string;
  title: string;
  cover: string;
  users: User[];
  user: User | null;
}

// Initialize Supabase Client
const supabase = createClient();

const DocsLayout: React.FC<DocsLayoutProps> = ({ id, title, users, user }) => {
  const storedTitle = useDocsStore((state) => state.titles[id]);

  const [coverUrl, setCoverUrl] = useState<string>("");
  const [titleState, setTitleState] = useState<string>(storedTitle || title);
  const [editorContent, setEditorContent] = useState<string>("");

  const [socketTitle, setSocketTitle] = useState<string>(title || "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingFromServer, setIsUpdatingFromServer] =
    useState<boolean>(false);
  const [userColors, setUserColors] = useState<{ [email: string]: string }>({});
  const [userCursors, setUserCursors] = useState<{
    [email: string]: { x: number; y: number };
  }>({});

  const userEmail = user?.email;

  //zustand state
  const triggerRefresh = useDocsStore((state) => state.triggerRefresh);

  const Editor = useMemo(
    () => dynamic(() => import("@/components/docs/editor"), { ssr: false }),
    []
  );

  // Fetch and update content with debounce
  const throttledUpdateContent = useMemo(
    () =>
      debounce(async (content: string) => {
        if (!id || !content) return;

        const { error } = await supabase
          .from("docs")
          .update({ content })
          .eq("id", id);

        if (error) {
          toast.error("Error updating content: " + error.message);
        }
      }, 500),
    [id]
  );

  const handleEditorChange = (content: string) => {
    // setEditorContent(content);
    throttledUpdateContent(content); // Debounced server update
  };

  useEffect(() => {
    if (id && user?.email) {
      socket.emit("join-room", id, user?.email); // Ensure users join the room using the document ID and their email
    }

    return () => {
      socket.off("join-room");
    };
  }, [id, user?.email]);

  //fetch cursor moving
  useEffect(() => {
    // Listen for mouse movements
    const handleMouseMove = (e: MouseEvent) => {
      // Capture the cursor position
      const { clientX, clientY } = e;

      // Emit cursor position to the server
      socket.emit("cursor_moved", {
        roomId: id,
        userEmail: user?.email,
        x: clientX + window.scrollX,
        y: clientY + window.scrollY - 110,
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [id, userEmail]);

  // fetch user cursor moving
  useEffect(() => {
    socket.on(
      "cursor_moved",
      (data: { userEmail: string; x: number; y: number }) => {
        const { userEmail, x, y } = data;
        if (!userColors[userEmail]) {
          const color = getRandomUserColor(userEmail);
          setUserColors((prev) => ({
            ...prev,
            [userEmail]: color,
          }));
        }

        setUserCursors((prev) => ({
          ...prev,
          [userEmail]: { x: x - window.scrollX, y: y - window.scrollY },
        }));
      }
    );
  }, [userColors]);

  useEffect(() => {
    socket.on("user_joined", () => {
      if (user) {
        console.log(`Connected to server: ${user.email}`);
      } else {
        console.log("Connected to server");
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    // cleanup listeners on unmount
    return () => {
      socket.off("cursor_moved");
      socket.off("document_content");
      socket.off("user_joined");
      socket.off("disconnect");
    };
  }, [user]);

  // Function to handle file selection and upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = `cover/${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("docs")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) {
      console.error("Upload error:", error.message);
      toast.error("Error uploading cover: " + error.message);
      return;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("docs").getPublicUrl(fileName);

    if (publicUrl) {
      setCoverUrl(publicUrl);

      // Update cover URL in Supabase database
      const { data: updateData, error: updateError } = await supabase
        .from("docs")
        .update({
          cover: publicUrl,
        })
        .eq("id", id);

      if (updateError) {
        toast.error("Error updating cover: " + updateError.message);
      } else {
        toast.success("Cover added!");
      }
    }
  };

  // fetch docs data
  const fetchDocs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("docs")
      .select("document_title, cover, content")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching document:", error.message);
      toast.error("Failed to fetch document");
      setIsLoading(false);
      return;
    }

    if (data) {
      setTitleState(data.document_title);
      setCoverUrl(data.cover);
      setEditorContent(data.content || "");
    }
    setIsLoading(false);
  };

  // update title using debounces because I want to update after 800 ms
  const updateTitle = debounce(async (newTitle: string) => {
    if (!id || !newTitle) return;

    const { error } = await supabase
      .from("docs")
      .update({ document_title: newTitle })
      .eq("id", id);

    if (error) {
      console.error("Error updating title:", error.message);
      toast.error("Error updating title: " + error.message);
    } else {
      triggerRefresh();
    }
  }, 800);

  // Fetch document when id changes or modified
  useEffect(() => {
    if (id) {
      fetchDocs();
    }
  }, [id]);

  // get random cursor color
  const getRandomUserColor = (email: string) => {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 70%, 50%)`; // Generate random color for each user
    return color;
  };

  // handle socket title change

  const handleSocketTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const socTitle = e.target.value;
    setSocketTitle(socTitle);

    socket.emit("document_title_updated", {
      roomId: id,
      socketHeadline: socTitle,
      userEmail: user?.email,
    });

    updateTitle(socTitle);
  };

  // Listen for socket title change

  useEffect(() => {
    socket.on("document_title_updated", (data: { socketHeadline: string }) => {
      const { socketHeadline } = data;
      setSocketTitle(socketHeadline);
    });
  });

  // Loading while fetching
  if (isLoading) {
    return (
      <div className="my-2 max-w-full min-h-full bg-neutral-200 dark:bg-neutral-900 border-none">
        <div className="px-20 py-4 border-4">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-48 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-96 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mainDocsLayout flex flex-col max-h-full ">
      <HeaderDoc user={user} users={users} id={id} />
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        ref={containerRef}
      >
        {Object.keys(userCursors).map((userEmail) => {
          const { x, y } = userCursors[userEmail];
          const cursorColor =
            userColors[userEmail] || getRandomUserColor(userEmail); // Random color for each cursor

          return (
            <div
              key={userEmail}
              style={{
                position: "absolute",
                left: `${x}px`,
                top: `${y}px`,
                transform: "translate(0, 0)",
                zIndex: 100,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-17px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: cursorColor,
                  color: "white",
                  padding: "2px 5px",
                  borderRadius: "4px",
                  fontSize: "5px",
                  whiteSpace: "nowrap",
                }}
              >
                {userEmail.split("@")[0]}
              </div>
              {/* cursor shape */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "-5px",
                  transform: "translateX(-50%)",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: cursorColor,
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "0",
                  transform: "translateX(-50%)",
                  width: "2px",
                  height: "25px",
                  backgroundColor: cursorColor,
                }}
              />
            </div>
          );
        })}

        <Cover docId={id} url={coverUrl} setCoverUrl={setCoverUrl} />
        <div className="lg:px-20 md:py-4 md:px-2">
          <div className="flex flex-col">
            <div className="group flex flex-col gap-2">
              {!coverUrl && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="invisible w-0 h-0"
                    id="upload-cover"
                  />
                  <label htmlFor="upload-cover">
                    <div className="bg-neutral-400 rounded-md px-3 w-fit p-2 text-white text-sm">
                      📷 Upload Cover
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className=" mt-4">
              <input
                type="text"
                value={socketTitle}
                onChange={handleSocketTitleChange}
                placeholder="Enter title..."
                className="w-full ml-5 resize-none appearance-none overflow-hidden bg-transparent text-4xl font-semibold focus:outline-none"
              />

              <Editor
                onChange={handleEditorChange}
                initialContent={editorContent}
                editable={true}
                documentId={id}
                userEmail={user?.email}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsLayout;
