import {
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
} from "@schedule-x/calendar";
import { ScheduleXCalendar, useNextCalendarApp } from "@schedule-x/react";
import React from "react";

// Define the type for an event
type Event = {
  id: string;
  title: string;
  start: string;
  end: string;
};

type CalendarLayoutProps = {
  events: Event[];
};

const CalenderLayout = ({ events }: CalendarLayoutProps) => {
  const calendar = useNextCalendarApp({
    
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    events: events as Event[],
  });

  return (
    <div>
      <ScheduleXCalendar calendarApp={calendar} />
    </div>
  );
};

export default CalenderLayout;
