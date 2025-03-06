/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { CalendarClockIcon, Loader } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { createClient } from "@/utils/supabase/client";
import { Timesheet } from "@/types/types";
import { User } from "@supabase/supabase-js";
import TaskCard from "./taskCard";
import Image from "next/image";
import emptyImg from "/public/notask.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

import "@schedule-x/theme-shadcn/dist/index.css";
import Calendar from "./calender";
import { differenceInMinutes, parse } from "date-fns";
import { toast } from "sonner";

type TestTabProps = {
  user?: User;
  title: string;
  id?: string;
  email?: string;
};

const ContentLayout = ({ user, title }: TestTabProps) => {
  const [time, setTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [task, setTask] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Timesheet[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [totalWorkTime, setTotalWorkTime] = useState("");

  type Event = {
    id: string;
    title: string;
    start: string;
    end: string;
  };

  const [events, setEvents] = useState<Event[]>([]);

  const userEmailCut =
    typeof user === "object" && user?.email ? user.email.split("@")[0] : "";

  const supabase = createClient();

  const formattedDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // display total work hours for day

  const calculateTotalWorkForDay = () => {
    const totalMinutes = tasks.reduce((sum, task) => {
      const startTime = parse(String(task.start_time), "HH:mm", new Date());
      const endTime = parse(String(task.end_time), "HH:mm", new Date());
      return sum + differenceInMinutes(endTime, startTime);
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} hours ${minutes} minutes`;
  };

  useEffect(() => {
    setTotalWorkTime(calculateTotalWorkForDay());
  }, [tasks]);

  // fetch data based on title and date

  useEffect(() => {
    if (title) {
      fetchTasks();
    }
  }, [title, currentDate]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("timesheet")
        .select("*")
        .eq("user_email", title)
        .eq("date", formattedDate(currentDate).split(" ")[0]);

      if (error) throw error;

      if (data) {
        setTasks(data as Timesheet[]);
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error.message);
      toast.error(`Error fetching tasks: ${error.message}`);
    }
  };

  // fetch events for calender

  useEffect(() => {
    if (title) {
      fetchEvents();
    }
  }, [title]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("timesheet")
        .select("*")
        .eq("user_email", title);

      if (error) {
        throw error;
      }

      // Log the raw data from Supabase
      console.log("Raw data from Supabase:", data);

      // Format events to match the required structure
      const formattedEvents = data.map((event) => ({
        id: String(event.id), // Ensure id is a string
        title: event.task,
        start: `${event.date} ${event.start_time}`,
        end: `${event.date} ${event.end_time}`,
      }));

      console.log("Formatted Events:", formattedEvents);
      setEvents(formattedEvents);
    } catch (error: any) {
      console.error("Error fetching events:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // submit click handle

  const handleSubmitData = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!time || !task || !endTime) {
      toast.error("Please provide both time and task details");
      return;
    }

    setIsUploading(true);

    // Adjust date to local timezone
    const formatDateForSupabase = (date: Date) => {
      const offset = date.getTimezoneOffset();
      const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
      return adjustedDate.toISOString().split("T")[0];
    };

    try {
      const { data, error } = await supabase.from("timesheet").insert([
        {
          user_id: user?.id || null,
          task: task,
          start_time: time,
          end_time: endTime,
          user_email: user?.email?.split("@")[0] || "",
          date: formatDateForSupabase(currentDate), // Adjusted date
        },
      ]);

      if (error) {
        toast.error("Failed to add task: " + error.message);
      } else {
        toast.success("Task Added Successfully!");
        fetchTasks();
        fetchEvents();
      }
    } catch (error: any) {
      console.error("Error adding task:", error.message);
      toast.error("An error occurred while adding the task.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreviousDate = () => {
    setCurrentDate((prev) => new Date(prev.setDate(prev.getDate() - 1)));
  };

  const handleNextDate = () => {
    setCurrentDate((prev) => new Date(prev.setDate(prev.getDate() + 1)));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  console.log("All events array", events);

  return (
    <div className="w-full h-full relative">
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between bg-slate-400 bg-opacity-10 p-4 my-4 rounded-md">
        <h3 className="md:text-md text-center md:text-left">
          Time-sheets: <span className="text-orange-500">{title}</span>
        </h3>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <CalendarClockIcon className="text-orange-500" />
                </Button>
              </DialogTrigger>
              <DialogContent
                className="min-w-[75%]"
                aria-describedby="calendar-dialog-description"
              >
                <DialogTitle></DialogTitle>
                <DialogHeader>
                  <div className="pt-3">
                    <Calendar events={events} />
                  </div>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <Button onClick={handleToday} variant="outline">
              Today
            </Button>
          </div>
          <div>
            <Pagination>
              <PaginationContent className="flex gap-3">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={handlePreviousDate}
                    className="transition duration-300 hover:bg-gray-300 hover:text-gray-800 rounded-md p-2"
                  />
                </PaginationItem>
                <PaginationItem>
                  <span>{formattedDate(currentDate).split(" ")[0]}</span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={handleNextDate}
                    className="transition duration-300 hover:bg-gray-300 hover:text-gray-800 rounded-md p-2"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>

      <div>
        <section className="pb-4">
          {tasks.length > 0 ? (
            tasks.map((task: Timesheet, index) => (
              <TaskCard
                key={index}
                userEmailCut={userEmailCut}
                tasks={task}
                setTasks={setTasks}
                title={title}
              />
            ))
          ) : (
            <div className="flex flex-col items-center my-8">
              <Image
                src={emptyImg}
                alt="No task image"
                width={200}
                height={200}
              />
              <h1 className="text-2xl md:text-3xl font-bold">Empty Tasks</h1>
              <p className="text-gray-500 text-center">
                No tasks available for{" "}
                {formattedDate(currentDate).split(" ")[0]} or current user.
              </p>
            </div>
          )}
        </section>
        {tasks.length > 0 && (
          <div className="pb-48 md:pb-24">
            <h1 className="text-lg font-medium text-start">
              Total Worked: {totalWorkTime}
            </h1>
          </div>
        )}
      </div>

      {userEmailCut === title && (
        <div className="footerInput fixed bottom-0 bg-white dark:bg-[#232628] p-4 pr-[100%] -ml-4">
          <form
            onSubmit={handleSubmitData}
            className="flex flex-col md:flex-row md:items-center gap-4 ml-2"
          >
            <div className=" flex gap-2 items-center">
              <span className="text-black dark:text-white">Start</span>
              <Input
                type="time"
                onChange={(e) => setTime(e.target.value)}
                aria-label="Select time"
                className="border dark:border-gray-700 rounded-md p-2 w-fit md:w-auto"
              />
              <span className="text-black dark:text-white">End</span>
              <Input
                type="time"
                onChange={(e) => setEndTime(e.target.value)}
                aria-label="Select time"
                className="border dark:border-gray-700 rounded-md p-2 w-fit md:w-auto"
              />
            </div>
            <Input
              type="text"
              placeholder="What did you work on...?"
              onChange={(e) => setTask(e.target.value)}
              aria-label="Task description"
              className="border dark:border-gray-700 rounded-md p-2 md:w-[400px] w-[100%] flex-1"
            />
            <Button
              variant="outline"
              className="bg-green-600 text-white p-2 rounded-md border-none"
              type="submit"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Add Entry"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ContentLayout;
