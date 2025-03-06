import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TabsProvider } from "@/app/(protected)/home/tabs-context";
import { redirect } from "next/navigation";
import React from "react";
import { Toaster } from "sonner";
import { createClient } from "@/utils/supabase/server";
import { getUsers } from "./getUsers";
import { ChatProvider } from "@/src/ChatContext";
import { ClientThemeProvider } from "@/components/client-providers/ClientThemeProvider";
import MainHeader from "@/components/main-header";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const users = await getUsers();

  const { data: fetchedMessages } = await supabase.from("messages").select("*");
  const messages = fetchedMessages ?? [];

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <ClientThemeProvider>
      <div
        style={{ "--header-height": "4rem" } as React.CSSProperties}
        className="h-screen flex flex-col"
      >
        <TabsProvider user={user} messages={messages} users={users}>
          <ChatProvider currentUser={user} users={users}>
            <SidebarProvider>
              <MainHeader />
              <div className="pt-[var(--header-height)] flex flex-1 overflow-hidden">
                <AppSidebar selfUser={user} users={users} />

                <main className="flex-1 h-full w-full overflow-hidden">
                  {children}
                  <Toaster position="top-center" />
                </main>
              </div>
            </SidebarProvider>
          </ChatProvider>
        </TabsProvider>
      </div>
    </ClientThemeProvider>
  );
}
