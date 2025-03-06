'use server'

import { createClient } from "@/utils/supabase/server";

export async function getUsers() {
    const supabase = await createClient();
  
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers();
  
    if (error) {
      throw new Error(error.message);
    }
  
    // `users` should now be an array of user objects
    return users;
  }