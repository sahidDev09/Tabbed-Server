import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import React from "react";
import TabsClientComponent from "@/components/tabs-client";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return <TabsClientComponent />;
}
