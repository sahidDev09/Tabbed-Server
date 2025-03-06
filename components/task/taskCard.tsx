/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Input } from "../ui/input";
import { Timesheet } from "@/types/types";
import { differenceInMinutes, parse } from "date-fns";

interface TaskCardProps {
  tasks: Timesheet;
  userEmailCut: string;
  setTasks: React.Dispatch<React.SetStateAction<Timesheet[]>>;
  title: string;
}

const TaskCard = ({ userEmailCut, tasks, setTasks, title }: TaskCardProps) => {
  const [deleteDialogue, setDeleteDialogue] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [newTime, setNewTime] = useState(tasks.time);
  const [newTask, setNewTask] = useState(tasks.task);

  const supabase = createClient();

  // Function to calculate total work time
  const calculateTotalWork = (start: string, end: string) => {
    const startTime = parse(start, "HH:mm", new Date());
    const endTime = parse(end, "HH:mm", new Date());
    const totalMinutes = differenceInMinutes(endTime, startTime);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours} hours ${minutes} minutes`;
  };

  const handleDeleteTask = React.useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("timesheet").delete().eq("id", id);

      if (error) {
        toast.error("Failed to delete the task");
      } else {
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
        toast.success("Task deleted successfully!");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setDeleteDialogue(false);
    }
  }, []);

  const handleUpdateTask = React.useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from("timesheet")
          .update({ time: newTime, task: newTask })
          .eq("id", id);

        if (error) {
          toast.error("Failed to update the task");
        } else {
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === id ? { ...task, time: newTime, task: newTask } : task
            )
          );
          toast.success("Task updated successfully!");
        }
      } catch (error) {
        toast.error("An unexpected error occurred" + error);
      } finally {
        setEditDialog(false);
      }
    },
    [newTime, newTask]
  );

  return (
    <div className="my-2 bg-slate-400 bg-opacity-10 p-3 rounded-md">
      <div className="xs:flex-col md:flex items-center gap-2 rounded-md">
        <Card className="p-3 md:w-[15%] md:text-md xs:text-sm">
          <h4 className=" xs:text-sm">
            {tasks.start_time} - {tasks.end_time}
          </h4>
        </Card>

        <Card className="p-3 my-2 flex-1">
          <h1>{tasks.task}</h1>
        </Card>
        {userEmailCut === title && (
          <div className="flex gap-2">
            {/* Dialog for updating task */}
            <AlertDialog open={editDialog} onOpenChange={setEditDialog}>
              <AlertDialogTrigger asChild>
                <Button className="xs:text-sm md:text-md">Edit</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Update your task?</AlertDialogTitle>
                  <form className="flex flex-col items-start gap-2">
                    <Input
                      type="text"
                      defaultValue={`${tasks.start_time} - ${tasks.end_time}`}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="border border-gray-300 rounded-md p-2 w-fit"
                    />
                    <Input
                      type="text"
                      placeholder="What did you work on...?"
                      defaultValue={tasks.task}
                      onChange={(e) => setNewTask(e.target.value)}
                      className="border border-gray-300 rounded-md p-2 flex-1"
                    />
                  </form>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleUpdateTask(tasks.id)}>
                    Update
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Dialog for deleting task */}
            <AlertDialog open={deleteDialogue} onOpenChange={setDeleteDialogue}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The task will be permanently
                    deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteTask(tasks.id)}>
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
      <div className="text-xs text-gray-500">
        {calculateTotalWork(tasks.start_time, tasks.end_time)}
      </div>
    </div>
  );
};

export default TaskCard;
