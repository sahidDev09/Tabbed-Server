/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { User } from "@supabase/supabase-js";
import { Card } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Lock, Unlock } from "lucide-react";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Switch } from "../ui/switch";
import { useDocsStore } from "@/src/store/useDocsStore";
import { Label } from "../ui/label";
import { socket } from "../lib/socketClient";

interface HeaderProps {
  users: User[];
  id: string;
  user: User | null;
}

const HeaderDoc = ({ users, id, user }: HeaderProps) => {
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [socketRoom, setSocketRoom] = useState<
    { email: string; roomId: string; socketId: string }[] // Explicit type for socketRoom state
  >([]);
  const [room, setRoom] = useState<{ user_email: string; status: string }[]>(
    []
  );
  //zustand state
  const triggerRefresh = useDocsStore((state) => state.triggerRefresh);
  const supabase = createClient();

  interface DocumentData {
    room: { user_email: string; status: string }[];
    public: boolean;
    private: boolean;
  }

  // fetch the room array

  useEffect(() => {
    const fetchRoom = async () => {
      const { data, error } = await supabase
        .from("docs")
        .select("room,public")
        .eq("id", id)
        .single();
      if (error) {
        toast.error("Error fetching room data");
        console.error(error);
      } else {
        const docData = data as DocumentData;
        setRoom(docData?.room || []);
        setIsPublic(docData?.public ?? true);
        setIsPrivate(docData?.private ?? false);
      }
    };
    fetchRoom();
  }, [id, supabase]);

  // listen socket users room

  useEffect(() => {
    if (user) {
      socket.emit("join-room", id, user.email);
    }

    socket.on("room-users", (updatedRoomUsers: any[]) => {
      // Ensure one avatar shows if the array has two same emails
      const uniqueUsers = updatedRoomUsers.reduce(
        (acc, currentUser) => {
          if (
            !acc.some(
              (user: { email: any }) => user?.email === currentUser.email
            )
          ) {
            acc.push(currentUser);
          }
          return acc;
        },
        [] as { email: string; roomId: string; socketId: string }[]
      );

      // Update state with the latest users
      setSocketRoom(uniqueUsers);
    });

    // Listen for when a user leaves the room
    socket.on("user-left", (message: string) => {
      // Handle user left by emitting the new room users
      setSocketRoom((prevState) =>
        prevState.filter((user) => user.socketId === socket.id)
      );
    });

    return () => {
      socket.disconnect(); // Disconnect socket on cleanup
    };
  }, [id, user]);

  // handle role changes

  const handleRoleChange = (userId: string, newRole: string) =>
    setRoles((prev) => ({ ...prev, [userId]: newRole }));

  const handleAddUser = async (singleUser: User) => {
    const selectedRole = roles[singleUser.id];
    if (!singleUser.email || !selectedRole || selectedRole === "Role") {
      toast.warning("Please select a valid role before adding.");
      return;
    }
    const newUser = { user_email: singleUser.email, status: selectedRole };
    const updatedRoom = [...room, newUser];

    const { error } = await supabase
      .from("docs")
      .update({ room: updatedRoom })
      .eq("id", id);
    if (error) {
      console.error(error);
    } else {
      toast.success("User added successfully!");
      setRoom(updatedRoom);
    }
  };

  // handle remove user access from room

  const handleRemoveUser = async (singleUser: User) => {
    const updatedRoom = room.filter(
      (entry) => entry.user_email !== singleUser.email
    );
    const { error } = await supabase
      .from("docs")
      .update({ room: updatedRoom })
      .eq("id", id);
    if (error) {
      console.error(error);
    } else {
      toast.success("Access removed");
      setRoom(updatedRoom);
      setRoles({});
    }
  };

  const handleUpdateUserRole = async (singleUser: User, newRole: string) => {
    const updatedRoom = room.map((entry) =>
      entry.user_email === singleUser.email
        ? { ...entry, status: newRole }
        : entry
    );
    const { error } = await supabase
      .from("docs")
      .update({ room: updatedRoom })
      .eq("id", id);
    if (error) {
      console.error(error);
    } else {
      setRoom(updatedRoom);
    }
  };

  // Update toggle handler to use checked value and sync with Supabase

  const handleToggle = async (checked: boolean) => {
    const newPublicValue = !checked;
    const newPrivateValue = checked;

    try {
      const { error } = await supabase
        .from("docs")
        .update({ public: newPublicValue, private: newPrivateValue })
        .eq("id", id);
      if (error) throw error;

      setIsPublic(newPublicValue);
      setIsPrivate(newPrivateValue);
      triggerRefresh();
      toast.success(`Document is now ${newPublicValue ? "public" : "private"}`);
    } catch (error) {
      console.error("Error updating document visibility:", error);
      toast.error("Failed to update document visibility");
    }
  };

  // check current user is owner or not

  const ownerEmail = room.find((entry) => entry.status === "owner")?.user_email;
  const isOwner = user?.email === ownerEmail;

  const currentUserEmail = user?.email;

  return (
    <div className="p-3 bg-zinc-200 dark:bg-zinc-800 mx-auto w-full">
      <div className="container flex items-center justify-between">
        {/* invite btn pop */}
        {isPrivate ? (
          <Popover>
            <PopoverTrigger className="bg-blue-500 dark:bg-white dark:text-black hover:bg-blue-700 hover:dark:bg-gray-300 border-none py-2 px-3 rounded-md text-white">
              Invite
            </PopoverTrigger>
            <PopoverContent align="start" className="min-w-[370px]">
              {users.map((singleUser) => {
                const roomEntry = room.find(
                  (entry) => entry.user_email === singleUser.email
                );

                // Hide the user if they're the owner.
                if (roomEntry?.status === "owner") return null;

                const dropdownValue = roomEntry
                  ? roomEntry.status
                  : roles[singleUser.id] || "Role";
                const onValueChangeHandler = roomEntry
                  ? (value: string) => handleUpdateUserRole(singleUser, value)
                  : (value: string) => handleRoleChange(singleUser.id, value);

                return (
                  <div key={singleUser.id}>
                    <Card className="flex items-center justify-between p-2 my-1">
                      <h1 className="text-sm">
                        {singleUser.email?.split("@")[0]}
                      </h1>
                      <div className="flex gap-2 items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              {dropdownValue}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Access Role</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup
                              value={dropdownValue}
                              onValueChange={onValueChangeHandler}
                            >
                              <DropdownMenuRadioItem value="editor">
                                Editor
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="viewer">
                                Viewer
                              </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {roomEntry ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveUser(singleUser)}
                          >
                            X Access
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className=" bg-blue-500 hover:bg-blue-700"
                            onClick={() => handleAddUser(singleUser)}
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    </Card>
                  </div>
                );
              })}
            </PopoverContent>
          </Popover>
        ) : (
          <div>
            <h1>Public Document</h1>
          </div>
        )}
        {/* displayed current access users */}
        <div className="flex items-center gap-4">
          {socketRoom.length > 1 ? (
            <h1 className="text-sm text-gray-400">All Collaborators</h1>
          ) : (
            <h1 className="text-sm text-gray-400">No Collaborators</h1>
          )}
          <div className="flex items-center -space-x-4">
            {socketRoom.map((roomUser, index) => (
              <div key={index} className="relative group">
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="z-10 w-9 h-9 border-2 border-zinc-300 dark:border-zinc-500 transition-transform transform duration-300 hover:scale-105 hover:z-20">
                      <AvatarImage
                        src="https://github.com/shadcn.png"
                        alt={roomUser.email}
                      />
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent className="text-sm bg-black text-white p-1 rounded-md">
                    {roomUser.email?.split("@")[0] || currentUserEmail}
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>

          {/* Make private switch */}

          {isOwner && (
            <div className="flex items-center space-x-2">
              <Switch
                checked={!isPublic}
                onCheckedChange={handleToggle}
                className="scale-90"
                id="private"
              />
              <Label htmlFor="private" className="cursor-pointer">
                {isPublic ? (
                  <Unlock className="size-5" />
                ) : (
                  <Lock className="size-5" />
                )}
              </Label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderDoc;
