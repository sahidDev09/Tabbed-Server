"use client";

import React, { useEffect } from "react";

import { Bell, ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOutAction } from "@/app/actions";
import { User } from "@supabase/supabase-js";
import { useNotificationPreferences } from "./useNotificationPreferences";
import { ColorPicker } from "./lib/ColorPicker";
import { createClient } from "@/utils/supabase/client";
import { useColorStore } from "@/src/store/colorStore";

export function NavUser({ user }: { user: User }) {
  const { isMobile } = useSidebar();

  const supabase = createClient();
  const { color, setColor } = useColorStore();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("icons")
        .select("icon")
        .eq("user_id", user.id)
        .single();

      if (!error && data?.icon) {
        setColor(data.icon);
      }
    })();
  }, [user.id]);

  async function handleColorChange(newColor: string) {
    const { error } = await supabase
      .from("icons")
      .upsert({ user_id: user.id, icon: newColor }, { onConflict: "user_id" });

    if (error) {
      console.error("Failed to update color", error);
      return;
    }

    setColor(newColor);
  }

  const { notificationEnabled, toggleNotifications } =
    useNotificationPreferences();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="sm"
              className="p-2 pl-3.5 rounded-full hover:bg-sidebar-accent"
            >
              <Settings size={64} className="!w-5 !h-5" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuCheckboxItem
                onSelect={(e) => e.preventDefault()}
                checked={notificationEnabled}
                onCheckedChange={toggleNotifications}
              >
                <Bell className="mr-2 h-4 w-4" />
                Enable Notifications
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            <DropdownMenuItem>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex items-center gap-2 w-full"
                >
                  Log out
                </button>
              </form>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <ColorPicker onChange={handleColorChange} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
