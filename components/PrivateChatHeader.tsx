"use client";

import { User } from "@supabase/supabase-js";
import React from "react";

export default function PrivateChatHeader({ username }: { username: string }) {
  return (
    <div>
      <div className="p-5 border-b flex items-center justify-between h-full">
        <div>
          <h1 className="text-xl font-bold">{username}</h1>
        </div>
      </div>
    </div>
  );
}
