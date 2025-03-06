"use client";

import React, { useEffect, useRef, useState } from "react";
import { TabData, useTabsContext } from "@/app/(protected)/home/tabs-context";
import { useChatStore } from "@/src/store/chatStore";
import { useTabHistoryStore } from "@/src/store/tabHistoryStore";
import { MessagesSquare } from "lucide-react";
import { socket } from "./lib/socketClient";
import { useDocsStore } from "@/src/store/useDocsStore";

export default function TabsClientComponent() {
  const { tabs, activeTabIndex, setActiveTabIndex, setTabs } = useTabsContext();
  const { addChatId, removeChatId, setChatIds } = useChatStore();
  const { titles, updateTitle } = useDocsStore();

  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  const [draggingTabIndex, setDraggingTabIndex] = useState<number | null>(null);
  const [dragOverTabIndex, setDragOverTabIndex] = useState<number | null>(null);
  const [dragOverSide, setDragOverSide] = useState<"left" | "right" | null>(
    null
  );

  const { pushTabEntry } = useTabHistoryStore();

  const [draggingSide, setDraggingSide] = useState<"left" | "right" | null>(
    null
  );
  const [activeLeftIndex, setActiveLeftIndex] = useState<number>(0);
  const [activeRightIndex, setActiveRightIndex] = useState<number>(0);
  const [isSplit, setIsSplit] = useState(false);
  const [hoverRight, setHoverRight] = useState(false);
  const [hoverLeft, setHoverLeft] = useState(false);
  const [leftTabs, setLeftTabs] = useState<TabData[]>([]);
  const [rightTabs, setRightTabs] = useState<TabData[]>([]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const container = splitContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;
    if (newLeftWidth < 25) newLeftWidth = 25;
    if (newLeftWidth > 75) newLeftWidth = 75;
    setLeftPanelWidth(newLeftWidth);
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    if (isSplit && (leftTabs.length === 0 || rightTabs.length === 0)) {
      setIsSplit(false);
      setActiveLeftIndex(0);
      setActiveRightIndex(0);
      setRightTabs([]);
    }
  }, [isSplit, leftTabs, rightTabs]);

  useEffect(() => {
    if (isSplit && tabs.length > 0) {
      const activeTab = tabs[activeTabIndex];
      const leftIndex = leftTabs.findIndex((tab) => tab.id === activeTab.id);
      const rightIndex = rightTabs.findIndex((tab) => tab.id === activeTab.id);
      if (leftIndex !== -1) {
        setActiveLeftIndex(leftIndex);
      }
      if (rightIndex !== -1) {
        setActiveRightIndex(rightIndex);
      }
    }
  }, [activeTabIndex, tabs, isSplit, leftTabs, rightTabs]);

  useEffect(() => {
    if (isSplit) {
      setLeftTabs((oldLeft) =>
        oldLeft.filter((tab) => tabs.find((t) => t.id === tab.id))
      );

      setRightTabs((oldRight) =>
        oldRight.filter((tab) => tabs.find((t) => t.id === tab.id))
      );

      const localIds = new Set([
        ...leftTabs.map((t) => t.id),
        ...rightTabs.map((t) => t.id),
      ]);
      const newTabs = tabs.filter((tab) => !localIds.has(tab.id));
      if (newTabs.length) {
        setLeftTabs((prev) => [...prev, ...newTabs]);
      }
    } else {
      setLeftTabs(tabs);
      setRightTabs([]);
    }
  }, [tabs, isSplit]);

  // listen realtime title in the tab
  // Update the tab's title in real-time based on docs title

  useEffect(() => {
    if (tabs[activeTabIndex] && titles) {
      const activeTab = tabs[activeTabIndex];
      const currentTitle = titles[activeTab.id];

      // Only update if the title has actually changed that's prevent unnecessary api calls
      if (currentTitle && currentTitle !== activeTab.title) {
        const updatedTabs = [...tabs];
        updatedTabs[activeTabIndex].title = currentTitle;
        setTabs(updatedTabs);
      }
    }
  }, [titles, activeTabIndex, tabs, setTabs]);

  const closeTab = (index: number) => {
    const tabToClose = tabs[index];
    if (tabToClose.chatId) {
      removeChatId(tabToClose.chatId);
    }
    const newTabs = tabs.filter((_, i) => i !== index);

    if (index === activeTabIndex) {
      setActiveTabIndex(Math.max(0, index - 1));
    } else if (index < activeTabIndex) {
      setActiveTabIndex(activeTabIndex - 1);
    }

    setTabs(newTabs);
  };

  function closeLeftTab(index: number) {
    if (index === activeLeftIndex) {
      setActiveLeftIndex(Math.max(0, index - 1));
    } else if (index < activeLeftIndex) {
      setActiveLeftIndex(activeLeftIndex - 1);
    }

    const tabToClose = leftTabs[index];
    const globalIndex = tabs.findIndex((tab) => tab.id === tabToClose.id);
    if (globalIndex !== -1) {
      closeTab(globalIndex);
    }
  }

  function truncateText(text: string, maxLength: number = 20): string {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  }

  function closeRightTab(index: number) {
    if (index === activeRightIndex) {
      setActiveRightIndex(Math.max(0, index - 1));
    } else if (index < activeRightIndex) {
      setActiveRightIndex(activeRightIndex - 1);
    }

    const tabToClose = rightTabs[index];
    const globalIndex = tabs.findIndex((tab) => tab.id === tabToClose.id);
    if (globalIndex !== -1) {
      closeTab(globalIndex);
    }
  }

  const handleDragStart =
    (index: number, side: "left" | "right") => (e: React.DragEvent) => {
      setDraggingTabIndex(index);
      setDraggingSide(side);
      if (!isSplit) {
        setActiveTabIndex(index);
      } else {
        if (side === "left") setActiveLeftIndex(index);
        else setActiveRightIndex(index);
      }
      e.dataTransfer.effectAllowed = "move";
      const tabElement = e.currentTarget as HTMLElement;
      const clone = tabElement.cloneNode(true) as HTMLElement;
      clone.style.position = "absolute";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, 0, 0);
      setTimeout(() => document.body.removeChild(clone), 0);
    };

  const handleLeftDrop = (hoverIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingTabIndex === null || draggingSide !== "left") return;

    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX < rect.left + rect.width / 2;

    const newLeft = [...leftTabs];
    const [removed] = newLeft.splice(draggingTabIndex, 1);

    let newIndex = isLeftHalf ? hoverIndex : hoverIndex + 1;

    if (draggingTabIndex < newIndex) {
      newIndex -= 1;
    }

    if (newIndex < 0) newIndex = 0;
    if (newIndex > newLeft.length) newIndex = newLeft.length;

    newLeft.splice(newIndex, 0, removed);
    setLeftTabs(newLeft);

    setTabs([...newLeft, ...rightTabs]);

    const newActiveIndex = newLeft.findIndex((tab) => tab.id === removed.id);
    if (newActiveIndex !== -1) {
      setActiveLeftIndex(newActiveIndex);
    }

    setDraggingTabIndex(null);
    setDraggingSide(null);
    setDragOverTabIndex(null);
    setDragOverSide(null);
  };

  const handleRightDrop = (hoverIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingTabIndex === null || draggingSide !== "right") return;

    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX < rect.left + rect.width / 2;

    const newRight = [...rightTabs];
    const [removed] = newRight.splice(draggingTabIndex, 1);

    let newIndex = isLeftHalf ? hoverIndex : hoverIndex + 1;

    if (draggingTabIndex < newIndex) {
      newIndex -= 1;
    }
    if (newIndex < 0) newIndex = 0;
    if (newIndex > newRight.length) newIndex = newRight.length;

    newRight.splice(newIndex, 0, removed);
    setRightTabs(newRight);

    setTabs([...leftTabs, ...newRight]);

    const newActiveIndex = newRight.findIndex((tab) => tab.id === removed.id);
    if (newActiveIndex !== -1) {
      setActiveRightIndex(newActiveIndex);
    }

    setDraggingTabIndex(null);
    setDraggingSide(null);
    setDragOverTabIndex(null);
    setDragOverSide(null);
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    if (draggingTabIndex !== null && tabs.length > 1) {
      e.preventDefault();
      const containerRect = (
        e.currentTarget as HTMLElement
      ).getBoundingClientRect();
      const midpoint = containerRect.left + containerRect.width / 2;
      setHoverRight(e.clientX > midpoint);
    } else {
      setHoverRight(false);
    }
  };

  const handleLeftPanelDragOver = (e: React.DragEvent) => {
    if (draggingTabIndex !== null && draggingSide === "right") {
      e.preventDefault();
      setHoverLeft(true);
    }
  };

  const handleLeftPanelDragLeave = (e: React.DragEvent) => {
    setHoverLeft(false);
  };

  const handleRightPanelDragOver = (e: React.DragEvent) => {
    if (draggingTabIndex !== null && draggingSide === "left") {
      e.preventDefault();
      setHoverRight(true);
    }
  };

  const handleRightPanelDragLeave = (e: React.DragEvent) => {
    setHoverRight(false);
  };

  const handleSplitDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggingTabIndex === null) return;

    if (draggingSide === "left" && hoverRight) {
      setIsSplit(true);
      const newLeft = [...leftTabs];
      const [removedTab] = newLeft.splice(draggingTabIndex, 1);
      if (draggingTabIndex === activeLeftIndex) {
        setActiveLeftIndex(Math.max(0, draggingTabIndex - 1));
      }
      setLeftTabs(newLeft);
      setRightTabs((prev) => [...prev, removedTab]);
    } else if (draggingSide === "right" && hoverLeft) {
      setIsSplit(true);
      const newRight = [...rightTabs];
      const [removedTab] = newRight.splice(draggingTabIndex, 1);
      if (draggingTabIndex === activeRightIndex) {
        setActiveRightIndex(Math.max(0, draggingTabIndex - 1));
      }
      setRightTabs(newRight);

      console.log(leftTabs);
      setLeftTabs((prev) => [...prev, removedTab]);
    } else {
      return;
    }

    setDraggingTabIndex(null);
    setHoverRight(false);
    setHoverLeft(false);
    setDragOverTabIndex(null);
    setDragOverSide(null);
  };

  const handleContainerDragLeave = () => {
    setHoverRight(false);
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX < rect.left + rect.width / 2;
    setDragOverTabIndex(index);
    setDragOverSide(isLeftHalf ? "left" : "right");
  };

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingTabIndex === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX < rect.left + rect.width / 2;

    const newTabs = [...tabs];
    const [removed] = newTabs.splice(draggingTabIndex, 1);

    let newIndex = isLeftHalf ? index : index + 1;

    if (draggingTabIndex < newIndex) {
      newIndex -= 1;
    }
    if (newIndex < 0) newIndex = 0;
    if (newIndex > newTabs.length) newIndex = newTabs.length;

    newTabs.splice(newIndex, 0, removed);

    setActiveTabIndex(newTabs.findIndex((tab) => tab.id === removed.id));

    setTabs(newTabs);
    setDraggingTabIndex(null);
    setDragOverTabIndex(null);
    setDragOverSide(null);
  };

  const handleDragEnd = () => {
    setDraggingTabIndex(null);
    setDragOverTabIndex(null);
    setDragOverSide(null);
  };

  useEffect(() => {
    if (tabs.length > 0) {
      const activeTab = tabs[activeTabIndex];
    }
  }, [activeTabIndex, tabs]);

  return (
    <div className="flex h-screen bg-neutral-100 dark:bg-neutral-900">
      {tabs.length === 0 ? (
        <div className="flex flex-col p-2">
          No tabs open. Click an option in the sidebar.
        </div>
      ) : !isSplit ? (
        <div className="flex flex-col w-full min-w-0">
          <div className="flex overflow-x-auto whitespace-nowrap max-w-full">
            {" "}
            {leftTabs.map((tab, index) => (
              <div
                key={tab.id}
                draggable
                onDragStart={handleDragStart(index, "left")}
                onDragOver={handleDragOver(index)}
                onDrop={handleDrop(index)}
                onDragEnd={handleDragEnd}
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  if (
                    e.target instanceof HTMLElement &&
                    e.target.closest("button")
                  ) {
                    return;
                  }

                  setActiveTabIndex(index);
                  if (tab.chatId) {
                    setChatIds([]);
                    addChatId(tab.chatId);
                    pushTabEntry({
                      id: tab.id,
                      title: tab.title,
                      chatId: tab.chatId,
                    });
                  } else {
                    pushTabEntry({
                      id: tab.id,
                      title: tab.title,
                    });
                  }
                }}
                className={`group flex items-center inline-flex px-4 py-2 relative transition-colors
                ${
                  index === activeTabIndex
                    ? "border-b-2 border-gray-500"
                    : "hover:dark:bg-sidebar-accent hover:dark:text-sidebar-accent-foreground hover:bg-neutral-200"
                }
                ${
                  dragOverTabIndex === index && dragOverSide === "left"
                    ? "border-l-4 border-white"
                    : ""
                }
                ${
                  dragOverTabIndex === index && dragOverSide === "right"
                    ? "border-r-4 border-white"
                    : ""
                }
              `}
                onAuxClick={(e) => {
                  if (e.button === 1) {
                    e.stopPropagation();
                    closeTab(index);
                  }
                }}
              >
                <div className="flex items-center gap-2 truncate">
                  {tab.chatId && <MessagesSquare className="w-4 h-4" />}
                  {truncateText(tab.title as string, 15)}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(index);
                  }}
                  className={`
                    ml-2 h-4 w-4 flex items-center justify-center text-gray-400 dark:text-gray-500 
                    ${
                      index === activeTabIndex
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }
                    hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                  `}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div
            className="relative flex-1 overflow-hidden"
            onDragOver={handleContainerDragOver}
            onDragLeave={handleContainerDragLeave}
            onDrop={handleSplitDrop}
          >
            {draggingTabIndex !== null && hoverRight && (
              <div className="pointer-events-none absolute top-0 right-0 w-1/2 h-full bg-sidebar-accent opacity-70 z-50" />
            )}

            {leftTabs.map((tab, index) => (
              <div
                key={tab.id}
                style={{ display: index === activeTabIndex ? "block" : "none" }}
                className="h-full w-full"
              >
                {tab.content}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div ref={splitContainerRef} className="flex w-full h-full">
          <div
            className="flex flex-col h-full overflow-hidden"
            style={{ width: `${leftPanelWidth}%` }}
          >
            <div className="flex overflow-x-auto whitespace-nowrap">
              {leftTabs.map((tab, index) => (
                <div
                  key={tab.id}
                  draggable
                  onDragStart={handleDragStart(index, "left")}
                  onDragOver={handleDragOver(index)}
                  onDrop={handleLeftDrop(index)}
                  onDragEnd={handleDragEnd}
                  onMouseDown={(e) => {
                    if (e.button !== 0) return;
                    if (
                      e.target instanceof HTMLElement &&
                      e.target.closest("button")
                    ) {
                      return;
                    }

                    setActiveLeftIndex(index);
                    if (tab.chatId) {
                      addChatId(tab.chatId);
                      pushTabEntry({
                        id: tab.id,
                        title: tab.title,
                        chatId: tab.chatId,
                      });
                    } else {
                      pushTabEntry({
                        id: tab.id,
                        title: tab.title,
                      });
                    }
                  }}
                  className={`group flex items-center inline-flex px-4 py-2 relative transition-colors
                ${
                  index === activeLeftIndex
                    ? "border-b-2 border-gray-500"
                    : "hover:dark:bg-sidebar-accent hover:dark:text-sidebar-accent-foreground hover:bg-neutral-200"
                }
                ${
                  dragOverTabIndex === index &&
                  dragOverSide === "left" &&
                  draggingSide === "left"
                    ? "border-l-4 border-white"
                    : ""
                }
                ${
                  dragOverTabIndex === index &&
                  dragOverSide === "right" &&
                  draggingSide === "left"
                    ? "border-r-4 border-white"
                    : ""
                }
              `}
                  onAuxClick={(e) => {
                    if (e.button === 1) {
                      e.stopPropagation();
                      closeLeftTab(index);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    {tab.chatId && <MessagesSquare className="w-4 h-4" />}
                    {truncateText(tab.title as string, 15)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeLeftTab(index);
                    }}
                    className={`
                    ml-2 h-4 w-4 flex items-center justify-center text-gray-400 dark:text-gray-500 
                    ${
                      index === activeLeftIndex
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }
                    hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                  `}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div
              className="relative flex-1 overflow-hidden"
              onDragOver={handleLeftPanelDragOver}
              onDragLeave={handleLeftPanelDragLeave}
              onDrop={handleSplitDrop}
            >
              {draggingTabIndex !== null && hoverLeft && (
                <div className="pointer-events-none absolute top-0 left-0 w-full h-full bg-sidebar-accent opacity-70 z-50" />
              )}

              {leftTabs.map((tab, i) => (
                <div
                  key={tab.id}
                  style={{ display: i === activeLeftIndex ? "block" : "none" }}
                  className={`absolute inset-0 ${
                    i === activeLeftIndex ? "block" : "hidden"
                  }`}
                >
                  {tab.content || "No content here"}
                </div>
              ))}
            </div>
          </div>
          <div
            className="cursor-col-resize bg-gray-300"
            style={{ width: "1px" }}
            onMouseDown={handleMouseDown}
          />

          <div
            className="flex flex-col h-full overflow-hidden"
            style={{ width: `${100 - leftPanelWidth}%` }}
          >
            <div className="flex overflow-x-auto whitespace-nowrap">
              {rightTabs.map((tab, index) => (
                <div
                  key={tab.id}
                  draggable
                  onDragStart={handleDragStart(index, "right")}
                  onDragOver={handleDragOver(index)}
                  onDrop={handleRightDrop(index)}
                  onDragEnd={handleDragEnd}
                  onMouseDown={(e) => {
                    if (e.button !== 0) return;
                    if (
                      e.target instanceof HTMLElement &&
                      e.target.closest("button")
                    ) {
                      return;
                    }

                    setActiveRightIndex(index);
                    if (tab.chatId) {
                      addChatId(tab.chatId);
                      pushTabEntry({
                        id: tab.id,
                        title: tab.title,
                        chatId: tab.chatId,
                      });
                    } else {
                      pushTabEntry({
                        id: tab.id,
                        title: tab.title,
                      });
                    }
                  }}
                  className={`group flex items-center inline-flex px-4 py-2 relative transition-colors
                ${
                  index === activeRightIndex
                    ? "border-b-2 border-gray-500"
                    : "hover:dark:bg-sidebar-accent hover:dark:text-sidebar-accent-foreground hover:bg-neutral-200"
                }
                ${
                  dragOverTabIndex === index &&
                  dragOverSide === "left" &&
                  draggingSide === "right"
                    ? "border-l-4 border-white"
                    : ""
                }
                ${
                  dragOverTabIndex === index &&
                  dragOverSide === "right" &&
                  draggingSide === "right"
                    ? "border-r-4 border-white"
                    : ""
                }
              `}
                  onAuxClick={(e) => {
                    if (e.button === 1) {
                      e.stopPropagation();
                      closeRightTab(index);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    {tab.chatId && <MessagesSquare className="w-4 h-4" />}
                    {truncateText(tab.title as string, 15)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeRightTab(index);
                    }}
                    className={`
                    ml-2 h-4 w-4 flex items-center justify-center text-gray-400 dark:text-gray-500 
                    ${
                      index === activeRightIndex
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }
                    hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                  `}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div
              className="relative flex-1 overflow-hidden"
              onDragOver={handleRightPanelDragOver}
              onDragLeave={handleRightPanelDragLeave}
              onDrop={handleSplitDrop}
            >
              {draggingTabIndex !== null && hoverRight && (
                <div className="pointer-events-none absolute top-0 left-0 w-full h-full bg-sidebar-accent opacity-70 z-50" />
              )}

              {rightTabs.map((tab, i) => (
                <div
                  key={tab.id}
                  style={{ display: i === activeRightIndex ? "block" : "none" }}
                  className={`absolute inset-0 ${
                    i === activeRightIndex ? "block" : "hidden"
                  }`}
                >
                  {tab.content || "No content here"}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
