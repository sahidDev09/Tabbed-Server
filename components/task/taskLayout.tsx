import React from "react";

import ContentLayout from "./contentLayout";
import { User } from "@supabase/supabase-js";

type TestTabProps = {
  title: string | null;
  user?: User;
  users: User[];
  email?: string;
};

const TestTab = ({ title, user }: TestTabProps) => {
  return (
    <div className="flex flex-col min-h-screen p-4 ">
      <ContentLayout user={user} title={title || "Untitled"} />
    </div>
  );
};

export default TestTab;
