"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSubContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

export function ColorPicker({
  onChange,
}: {
  onChange: (color: string) => void;
}) {
  return (
    <DropdownMenuSub>
      {/* The trigger to open the sub-menu */}
      <DropdownMenuSubTrigger>Pick a color</DropdownMenuSubTrigger>
      {/* The sub-menu content */}
      <DropdownMenuSubContent>
        <DropdownMenuItem onClick={() => onChange("black")}>
          Black
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange("white")}>
          White
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
