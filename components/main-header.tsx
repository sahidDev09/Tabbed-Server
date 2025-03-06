"use client";

import { useTabsContext } from "@/app/(protected)/home/tabs-context";
import { useTabHistoryStore } from "@/src/store/tabHistoryStore";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import React from "react";

export default function MainHeader({}: {}) {
  const { goBack, goForward } = useTabsContext();
  const { history, currentTab } = useTabHistoryStore();

  const canGoForward = currentTab < history.length - 1;

  return (
    <header className="fixed w-full h-[var(--header-height)] border-b bg-neutral-100 dark:bg-neutral-900 flex items-center px-5 gap-2">
      <div className="md:hidden">
        <SidebarTrigger/>
      </div>
      <button onClick={goBack}>
        <ArrowLeft />
      </button>
      <button
        onClick={goForward}
        disabled={!canGoForward}
        className={`transition-opacity ${!canGoForward ? "opacity-50" : "opacity-100"}`}
      >
        <ArrowRight />
      </button>
    </header>
  );
}
