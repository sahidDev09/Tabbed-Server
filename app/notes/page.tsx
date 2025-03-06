import { createClient } from "@/utils/supabase/server";
import React from "react";

export default async function Page() {
  const supabase = await createClient();
  const { data: notes } = await supabase.from("notes").select();
  console.log(notes);

  return <pre>{JSON.stringify(notes, null, 2)}</pre>;
}
