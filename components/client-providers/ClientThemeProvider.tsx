"use client";

import { ThemeProvider } from "@/src/ThemeProvider";
import React from "react";

export function ClientThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
