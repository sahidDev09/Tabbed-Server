import React, { useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

const handleDeleteMessage = async (id: string) => {
  const supabase = createClient();
  if (id.length === 0) {
    return;
  }

  const { error } = await supabase.from("messages").delete().eq("id", id);

  if (error) {
    toast.error(error.message);
  }
};

export const handleEditMessage = async (
  id: string,
  newText: string,
  closeEditMenu: () => void
) => {
  const supabase = createClient();
  if (id.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("messages")
    .update({ text: newText, is_edit: true })
    .eq("id", id);

  if (error) {
    toast.error(error.message);
  } else {
    closeEditMenu();
  }
};

export function DeleteAlert({
  msgId,
  onClose,
}: {
  msgId: string;
  onClose: () => void;
}) {
  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. It will permanently delete this
            message.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleDeleteMessage(msgId)}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
