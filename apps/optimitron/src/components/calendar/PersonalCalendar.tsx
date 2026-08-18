"use client";

import type {
  EventClickArg,
  EventContentArg,
  EventInput,
} from "@fullcalendar/core";
import luxonPlugin from "@fullcalendar/luxon3";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import styles from "./personal-calendar.module.css";

export interface PersonalCalendarEvent extends EventInput {
  end: string;
  extendedProps: {
    expectedValueUsd: number;
    priority: number;
    reason: string;
    required: boolean;
  };
  id: string;
  start: string;
  title: string;
  url: string;
}

function renderEventContent(info: EventContentArg) {
  return (
    <div className={styles.eventContent}>
      <span className={styles.eventTime}>{info.timeText}</span>
      <span className={styles.eventTitle}>{info.event.title}</span>
    </div>
  );
}

function openTask(info: EventClickArg) {
  if (!info.event.url) return;
  info.jsEvent.preventDefault();
  window.location.assign(info.event.url);
}

export function PersonalCalendar({
  dateKey,
  events,
  timeZone,
}: {
  dateKey: string;
  events: PersonalCalendarEvent[];
  timeZone: string;
}) {
  return (
    <div className={styles.calendar}>
      <FullCalendar
        allDaySlot={false}
        dayHeaderFormat={{ weekday: "long", month: "short", day: "numeric" }}
        eventClick={openTask}
        eventContent={renderEventContent}
        eventMinHeight={22}
        eventShortHeight={36}
        events={events}
        headerToolbar={false}
        height="auto"
        initialDate={dateKey}
        initialView="timeGridDay"
        nowIndicator
        plugins={[luxonPlugin, timeGridPlugin]}
        slotDuration="00:15:00"
        slotEventOverlap={false}
        slotLabelFormat={{
          hour: "numeric",
          minute: "2-digit",
          meridiem: "short",
        }}
        slotLabelInterval="01:00:00"
        slotMaxTime="24:00:00"
        slotMinTime="08:00:00"
        timeZone={timeZone}
      />
    </div>
  );
}
