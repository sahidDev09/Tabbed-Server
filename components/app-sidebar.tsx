/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import * as React from "react";
import { User } from "@supabase/supabase-js";
import {
  ArrowBigDown,
  ChevronRight,
  File,
  FileLock2Icon,
  FileStack,
  Globe,
  GlobeLock,
  Home,
  LucideProps,
  MessagesSquare,
  Moon,
  Plus,
  Sun,
  Table,
  Trash2,
  User2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NavUser } from "@/components/nav-user";
import { useTabsContext } from "@/app/(protected)/home/tabs-context";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/src/ThemeProvider";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { useDocsStore } from "@/src/store/useDocsStore";
import { getOrCreateChatId } from "./lib/chats";
import { useEffect, useState } from "react";
import { useChatStore } from "@/src/store/chatStore";
import { useChatContext } from "@/src/ChatContext";
import { Database } from "./lib/types/database.types";
import { socket } from "./lib/socketClient";

// This is sample data
const data = {
  user: {
    name: "shaqib",
    email: "shaqibae@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Chats",
      url: "/",
      icon: MessagesSquare,
      isActive: true,
    },
    {
      title: "Time sheet",
      url: "/",
      icon: Table,
    },
    {
      title: "Docs",
      url: "/",
      icon: FileStack,
    },
  ],
  collapseSection: [
    {
      title: "Channels",
      icon: Globe,
      url: "#",
      items: [
        {
          title: "General",
          url: "/livechat",
          chatId: 0,
        },
      ],
    },
    {
      title: "DMs",
      icon: GlobeLock,
      url: "#",
      items: [
        {
          title: "Amran",
          url: "#",
          chatId: 0,
        },
        {
          title: "Shaqib",
          url: "/privatechat",
          chatId: 0,
        },
        {
          title: "Sahid",
          url: "#",
          chatId: 0,
        },
      ],
    },
  ],

  timeSheetCollapseSection: [
    {
      title: "User List",
      icon: User2,
      items: [],
    },
  ],

  docscollapseSection: [
    {
      title: "Public Documents",
      icon: File,
      items: [],
    },
    {
      title: "Private Documents",
      icon: FileLock2Icon,
      items: [],
    },
  ],
};

const supabase = createClient();

export function AppSidebar({
  selfUser,
  users = [],
  ...props
}: { selfUser: User; users: User[] } & React.ComponentProps<typeof Sidebar>) {
  const { theme, toggleTheme } = useTheme();
  // Note: I'm using state to show active item.
  // IRL you should use the url/router.
  const { unreadCounts } = useChatContext();

  const [dmChatIds, setDmChatIds] = useState<Record<string, string>>({});

  const { chatIds: activeChatIds } = useChatStore();

  useEffect(() => {
    activeChatIds.forEach((activeChatId) => {
      if (unreadCounts[activeChatId] > 0) {
        unreadCounts[activeChatId] = 0;
      }
    });
  }, [activeChatIds, unreadCounts]);

  useEffect(() => {
    const supabase = createClient();
    const fetchChatIdsAndUnreadCounts = async () => {
      const nextMap: Record<string, string> = {};
      const generalChatId = await getOrCreateChatId(users, supabase);

      data.collapseSection[0].items[0].chatId = generalChatId;

      for (const other of users.filter((u) => u.id !== selfUser.id)) {
        const chatId = await getOrCreateChatId([selfUser, other], supabase);
        nextMap[other.id] = chatId;
      }

      setDmChatIds(nextMap);
    };

    fetchChatIdsAndUnreadCounts();
  }, [users, selfUser]);

  const [activeItem, setActiveItem] = React.useState(data.navMain[0]);
  const { open, isMobile, setOpen, setOpenMobile } = useSidebar();
  const { openTab, closeTab } = useTabsContext();
  const router = useRouter();
  const pathname = usePathname();
  const [deleteDialogue, setDeleteDialogue] = React.useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [publicDocs, setPublicDocs] = React.useState<
    {
      isOwner: React.JSX.Element;
      id: string | null | undefined;
      title: string;
      url: string;
    }[]
  >([]);

  const [privateDocs, setPrivateDocs] = React.useState<
    {
      isOwner: React.JSX.Element;
      id: string | null | undefined;
      title: string;
      url: string;
    }[]
  >([]);

  interface Item {
    title: string;
    url: string;
  }

  const { refresh, updateTitle } = useDocsStore();

  // Listen for title updates from socket io
  useEffect(() => {
    socket.on("title_updated", (data: { title: string }) => {
      setActiveItem((prevItem) => {
        return {
          ...prevItem,
          title: data.title,
        };
      });
    });

    return () => {
      socket.off("title_updated");
    };
  }, []);

  const updatedTimeSheetSection = React.useMemo(() => {
    return data.timeSheetCollapseSection.map((section) => {
      if (section.title === "User List") {
        const sortedUsers = [
          {
            title: `${selfUser.email?.split("@")[0]}`,
            displayTitle: (
              <>
                {selfUser.email?.split("@")[0] || "Unknown"}{" "}
                <span style={{ color: "green" }}>(you)</span>
              </>
            ),
            url: selfUser.id || "invalid user id",
          },
          ...users
            .filter((user) => user.email !== selfUser.email)
            .map((user) => ({
              title: `${user.email?.split("@")[0] || "Unknown"}`,
              displayTitle: `${user.email?.split("@")[0] || "Unknown"}`,
              url: user.id || "invalid user id",
            })),
        ];
        return { ...section, items: sortedUsers };
      }
      return section;
    });
  }, [users, selfUser]);

  const headlines: { [key: string]: string } = {
    Home: "Message Overview",
    "Time sheet": "Time Sheet Overview",
    Docs: "Documents Overview",
  };

  const handleSubItemClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleNavItem = (item: {
    title: string;
    url: string;
    icon: React.ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
    >;
    isActive?: boolean;
  }) => {
    // if (activeItem.title !== item.title) {
    // clearTabs();
    // }
    if (!open) {
      setOpen(true);
    }
    setActiveItem(item);
    router.push(item.url);
  };

  // fetch data for public doc subitems

  const fetchDocs = async () => {
    const { data, error } = await supabase
      .from("docs")
      .select("id, document_title, room, public, private, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching docs:", error);
    } else {
      // Fetch all public documents for all users
      setPublicDocs(
        data
          .filter((doc) => doc.public === true)
          .map((doc) => ({
            id: doc.id,
            title: doc.document_title || "Untitled",
            url: doc.id,
            // Check if the current user is the owner of the document
            isOwner: doc.room.some(
              (user: { status: string; user_email: string }) =>
                user.user_email === selfUser.email && user.status === "owner"
            ),
          }))
      );

      // Fetch private documents based on current user's email
      setPrivateDocs(
        data
          .filter(
            (doc) =>
              doc.private === true &&
              doc.room.some(
                (user: { user_email: string | undefined }) =>
                  user.user_email === selfUser.email
              )
          )
          .map((doc) => ({
            id: doc.id,
            title: doc.document_title || "Untitled",
            url: doc.id,
            // Check if the current user is the owner of the document
            isOwner: doc.room.some(
              (user: { status: string; user_email: string }) =>
                user.user_email === selfUser.email && user.status === "owner"
            ),
          }))
      );
    }
  };

  //realtime documents title changes

  useEffect(() => {
    const channel = supabase
      .channel("docs")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "docs" },
        (payload) => {
          if (payload.new.id && payload.new.document_title) {
            updateTitle(payload.new.id, payload.new.document_title);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    fetchDocs();
  }, [refresh]);

  // if same title available in the supabase add another name

  const getNewUntitledTitle = async () => {
    const { count, error } = await supabase
      .from("docs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", selfUser.id)
      .ilike("document_title", "📄 Untitled%");

    if (error || count === null || count === undefined) return "Untitled";

    //if untitled not available add untitled other-wise untitled + number
    return count === 0 ? "📄 Untitled" : `📄 Untitled ${count}`;
  };

  // handle create blank page

  const handleBlankPage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newTitle = await getNewUntitledTitle();
      const { data, error } = await supabase
        .from("docs")
        .insert([
          {
            user_id: selfUser.id || null,
            document_title: newTitle,
            content: "",
            public: true,
            private: false,
            room: [
              {
                user_email: selfUser.email!,
                status: "owner",
              },
            ],
            cover: "",
          },
        ])
        .select();

      if (error) {
        toast.error("Failed to create blank page");
        return;
      }

      if (data && data.length > 0) {
        const newDoc = data[0];
        console.log("New document created: ", newDoc);

        if (openTab) {
          openTab(newDoc.document_title, newDoc.id);
        }
        fetchDocs();
      }
    } catch (error) {
      console.error("Error occurred:", error);
      toast.error("An unexpected error occurred");
    }
  };

  // handle delete documents

  const handldeleteDocs = async (id: string | null) => {
    const { error } = await supabase.from("docs").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete document");
    } else {
      toast.success("Document deleted successfully");

      setPublicDocs((prevDocs) => prevDocs.filter((doc) => doc.id !== id));
      setPrivateDocs((prevDocs) => prevDocs.filter((doc) => doc.id !== id));
      closeTab(id);
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="flex flex-col h-screen overflow-hidden [&>[data-sidebar=sidebar]]:flex-row md:flex"
      {...props}
    >
      {" "}
      <Sidebar
        collapsible="none"
        className="!w-16 border-r flex flex-col h-full md:w-64 lg:w-64"
      >
        <SidebarContent className="flex-1 ">
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu className="space-y-2">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={{ children: "Toggle Sidebar", hidden: false }}
                    className="flex items-center justify-center"
                    asChild
                  >
                    <SidebarTrigger iconSize={80}></SidebarTrigger>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={String(item.title)}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => handleNavItem(item)}
                      isActive={activeItem.title === item.title}
                      className="px-3.5"
                    >
                      <item.icon size={64} className="!w-5 !h-5" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="mt-auto p-2 border-t flex items-center justify-center">
          <button
            className="p-2 rounded-full"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
          >
            {theme === "light" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          <NavUser user={selfUser} />
        </SidebarFooter>
      </Sidebar>
      <Sidebar collapsible="none" className=" overflow-y-auto scrollbar-hide">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <SidebarInput placeholder="Type to search..." />
        </SidebarHeader>
        <div className="flex w-full items-center px-4 py-4 whitespace-nowrap">
          <div className="text-base font-medium text-foreground">
            {headlines[activeItem.title] || activeItem.title}
          </div>
        </div>
        <SidebarContent className="gap-0">
          {/* home sidebar collapse items */}

          {activeItem.title !== "Time sheet" &&
            activeItem.title !== "Docs" &&
            data.collapseSection.map((item) => {
              const sectionItems =
                item.title === "DMs"
                  ? users
                      .filter((u) => u.id !== selfUser.id)
                      .map((u) => {
                        const dmChatId = dmChatIds[u.id];
                        return {
                          title: u.email!.split("@")[0],
                          url: u.email!.split("@")[0],
                          chatId: dmChatId,
                        };
                      })
                  : item.items.map((subItem) => ({
                      ...subItem,
                      chatId: subItem.chatId || "",
                    }));

              return (
                <Collapsible
                  key={item.title}
                  title={item.title}
                  defaultOpen
                  className="group/collapsible"
                >
                  <SidebarGroup>
                    <SidebarGroupLabel
                      asChild
                      className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <CollapsibleTrigger>
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.title}{" "}
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </CollapsibleTrigger>
                    </SidebarGroupLabel>
                    <CollapsibleContent>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {sectionItems.map((subItem) => (
                            <SidebarMenuItem key={subItem.title}>
                              <SidebarMenuButton
                                asChild
                                onClick={() => {
                                  openTab(
                                    subItem.title,
                                    subItem.url,
                                    subItem.chatId as string
                                  );
                                  handleSubItemClick();
                                }}
                              >
                                <a className="whitespace-nowrap flex justify-between items-center">
                                  {subItem.title}
                                  {subItem.chatId &&
                                    unreadCounts[subItem.chatId] > 0 &&
                                    !activeChatIds.includes(
                                      subItem.chatId as string
                                    ) && (
                                      <span className="ml-2 rounded-full bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center">
                                        {unreadCounts[subItem.chatId]}
                                      </span>
                                    )}
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  </SidebarGroup>
                </Collapsible>
              );
            })}

          {/* Time sheet sidebar collapse items */}

          {activeItem.title === "Time sheet" &&
            updatedTimeSheetSection.map((timeSheet) => (
              <Collapsible
                key={timeSheet.title}
                title={timeSheet.title}
                defaultOpen
                className="group/collapsible"
              >
                <SidebarGroup>
                  <SidebarGroupLabel
                    asChild
                    className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <CollapsibleTrigger>
                      <timeSheet.icon className="mr-2 h-4 w-4" />
                      {timeSheet.title}
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {timeSheet.items.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              onClick={() => {
                                if (typeof item.title === "string") {
                                  openTab(item.title, item.url);
                                }
                              }}
                              className=" whitespace-nowrap"
                            >
                              {item.displayTitle}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            ))}

          {/*Docs sidebar collapse items */}

          {activeItem.title === "Docs" &&
            data.docscollapseSection.map((docsSection) => (
              <Collapsible
                key={docsSection.title}
                title={docsSection.title}
                defaultOpen
                className="group/collapsible"
              >
                <SidebarGroup>
                  <SidebarGroupLabel
                    asChild
                    className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <CollapsibleTrigger className="flex justify-between items-center">
                      <div className=" flex items-center mr-2">
                        <docsSection.icon className="mr-2 h-4 w-4" />
                        {docsSection.title}
                        <ChevronRight className="transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </div>
                      <div>
                        {activeItem.title === "Docs" &&
                          docsSection.title === "Public Documents" && (
                            <div
                              className="p-2 bg-zinc-200 dark:bg-zinc-700 w-7 h-7 rounded-md flex items-center justify-center"
                              onClick={handleBlankPage}
                            >
                              <Plus className=" text-sm text-zinc-800 dark:text-zinc-200" />
                            </div>
                          )}
                      </div>
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {docsSection.title === "Public Documents" ? (
                          publicDocs.length > 0 ? (
                            publicDocs.map((doc, index) => (
                              <SidebarMenuItem key={index}>
                                <SidebarMenuButton
                                  onClick={() => openTab(doc.title, doc.url)}
                                  className="whitespace-nowrap"
                                >
                                  <div className="flex items-center justify-between w-full ml-2">
                                    {doc.title}
                                    {doc.isOwner && (
                                      <AlertDialog
                                        open={deleteDialogue}
                                        onOpenChange={setDeleteDialogue}
                                      >
                                        <AlertDialogTrigger asChild>
                                          <Trash2
                                            size={15}
                                            className="text-red-700"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedDocId(doc.id ?? null);
                                              setDeleteDialogue(true);
                                            }}
                                          />
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Are you sure?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This action cannot be undone. The
                                              document will be permanently
                                              deleted.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handldeleteDocs(selectedDocId);
                                                setDeleteDialogue(false);
                                              }}
                                            >
                                              Confirm
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                  </div>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))
                          ) : (
                            <p className="text-gray-500 p-2">
                              No records found
                            </p>
                          )
                        ) : docsSection.title === "Private Documents" ? (
                          privateDocs.length > 0 ? (
                            privateDocs.map((doc) => (
                              <SidebarMenuItem key={doc.id}>
                                <SidebarMenuButton
                                  onClick={() => openTab(doc.title, doc.url)}
                                  className="whitespace-nowrap"
                                >
                                  <div className="flex items-center justify-between w-full ml-2">
                                    {doc.title}
                                    {doc.isOwner && (
                                      <AlertDialog
                                        open={deleteDialogue}
                                        onOpenChange={setDeleteDialogue}
                                      >
                                        <AlertDialogTrigger asChild>
                                          <Trash2
                                            size={15}
                                            className="text-red-700"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedDocId(doc.id ?? null);
                                              setDeleteDialogue(true);
                                            }}
                                          />
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Are you sure?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This action cannot be undone. The
                                              document will be permanently
                                              deleted.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handldeleteDocs(selectedDocId);
                                                setDeleteDialogue(false);
                                              }}
                                            >
                                              Confirm
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                  </div>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))
                          ) : (
                            <p className="text-gray-500 p-2">
                              No records found
                            </p>
                          )
                        ) : (
                          docsSection.items.map((item: Item) => (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton
                                onClick={() => {
                                  if (typeof item.title === "string") {
                                    openTab(item.title, item.url);
                                  }
                                }}
                                className="whitespace-nowrap"
                              >
                                {item.title}
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))
                        )}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            ))}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </Sidebar>
  );
}
