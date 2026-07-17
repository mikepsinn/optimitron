import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  PersonalCalendar,
  type PersonalCalendarEvent,
} from "@/components/calendar/PersonalCalendar";
import { authOptions } from "@/lib/auth";
import { getRouteMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { calendarLink, getSignInPath, getTaskPath, ROUTES } from "@/lib/routes";
import { getAuthorizedExecutionPlan } from "@/lib/tasks/personal-planning.server";
import {
  getStartOfZonedDayUtc,
  getZonedDateKey,
  getZonedDateTimeUtc,
  parseDateKey,
  shiftDateKey,
} from "@/lib/time-zone";

export const metadata: Metadata = getRouteMetadata(calendarLink);

function formatDateLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone,
    weekday: "long",
    year: "numeric",
  }).format(date);
}

function formatActionTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

function calendarHref(dateKey: string) {
  return `${ROUTES.calendar}?date=${encodeURIComponent(dateKey)}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;
  if (!userId) redirect(getSignInPath(ROUTES.calendar));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timeZone: true },
  });
  if (!user) redirect(getSignInPath(ROUTES.calendar));

  const timeZone = user.timeZone ?? "UTC";
  const now = new Date();
  const todayKey = getZonedDateKey(now, timeZone);
  const params = (await searchParams) ?? {};
  const requestedDate =
    typeof params.date === "string" && parseDateKey(params.date)
      ? params.date
      : todayKey;
  const dateKey = requestedDate < todayKey ? todayKey : requestedDate;
  const dateParts = parseDateKey(dateKey)!;
  const nextDateKey = shiftDateKey(dateKey, 1)!;
  const previousDateKey = shiftDateKey(dateKey, -1)!;
  const nextDateParts = parseDateKey(nextDateKey)!;
  const dayStart = getZonedDateTimeUtc(
    { ...dateParts, hour: 8, minute: 0, second: 0 },
    timeZone,
  );
  const dayEnd = getStartOfZonedDayUtc(nextDateParts, timeZone);
  const planningStart =
    dateKey === todayKey && now > dayStart && now < dayEnd ? now : dayStart;
  const plan = await getAuthorizedExecutionPlan({
    maxResults: 100,
    planningWindowEnd: dayEnd,
    planningWindowStart: planningStart,
    target: { kind: "self" },
    userId,
  });
  const events: PersonalCalendarEvent[] = plan.checklist.map((action) => ({
    classNames: [
      action.deadlinePolicy === "REQUIRED"
        ? "optimitron-calendar-required"
        : "optimitron-calendar-task",
    ],
    end: action.scheduledEndAt,
    extendedProps: {
      expectedValueUsd: action.realEv,
      priority: action.priority,
      reason: action.reason,
      required: action.deadlinePolicy === "REQUIRED",
    },
    id: action.id,
    start: action.scheduledStartAt,
    title: action.title,
    url: getTaskPath(action.id),
  }));
  const nextAction = plan.nextAction;
  const scheduledMinutes = plan.checklist.reduce(
    (total, action) => total + action.estimatedMinutes,
    0,
  );

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-4">
          <div>
            <h1 className="text-2xl font-black uppercase sm:text-3xl">
              Your Calendar
            </h1>
            <p className="mt-1 text-sm font-bold text-muted-foreground">
              {formatDateLabel(dayStart, timeZone)} · {timeZone}
            </p>
          </div>
          <nav aria-label="Calendar date" className="flex items-center gap-2">
            {dateKey === todayKey ? (
              <span
                aria-label="Previous day unavailable"
                className="inline-flex size-9 items-center justify-center border-2 border-foreground/30 text-muted-foreground"
              >
                <ChevronLeft aria-hidden size={18} />
              </span>
            ) : (
              <Link
                aria-label="Previous day"
                className="inline-flex size-9 items-center justify-center border-2 border-foreground hover:bg-muted"
                href={calendarHref(previousDateKey)}
              >
                <ChevronLeft aria-hidden size={18} />
              </Link>
            )}
            <Link
              className="border-2 border-foreground px-3 py-1.5 text-xs font-black uppercase hover:bg-muted"
              href={calendarHref(todayKey)}
            >
              Today
            </Link>
            <Link
              aria-label="Next day"
              className="inline-flex size-9 items-center justify-center border-2 border-foreground hover:bg-muted"
              href={calendarHref(nextDateKey)}
            >
              <ChevronRight aria-hidden size={18} />
            </Link>
          </nav>
        </header>

        <div className="grid grid-cols-2 border-b border-foreground text-center text-xs font-black uppercase sm:max-w-sm">
          <div className="border-r border-foreground px-3 py-2">
            {plan.checklist.length} actions
          </div>
          <div className="px-3 py-2">
            {Math.round(scheduledMinutes / 6) / 10} hours
          </div>
        </div>

        <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section
            aria-label="Day calendar"
            className="order-2 min-w-0 lg:order-1"
          >
            <PersonalCalendar
              dateKey={dateKey}
              events={events}
              timeZone={timeZone}
            />
          </section>

          <aside className="order-1 space-y-8 border-b-2 border-foreground pb-6 lg:order-2 lg:border-b-0 lg:border-l-2 lg:pb-0 lg:pl-6">
            <section>
              <h2 className="text-xs font-black uppercase text-muted-foreground">
                Next
              </h2>
              {nextAction ? (
                <Link
                  className="mt-3 block border-y-2 border-foreground py-4 hover:bg-muted"
                  href={getTaskPath(nextAction.id)}
                >
                  <span className="text-xs font-black">
                    {formatActionTime(nextAction.scheduledStartAt, timeZone)}
                  </span>
                  <strong className="mt-1 block text-lg leading-tight">
                    {nextAction.title}
                  </strong>
                </Link>
              ) : (
                <p className="mt-3 text-sm font-bold text-muted-foreground">
                  Nothing fits this day yet.
                </p>
              )}
            </section>

            <section>
              <h2 className="text-xs font-black uppercase text-muted-foreground">
                AI can do
              </h2>
              {plan.proposedAiAssistedWork.length > 0 ? (
                <ol className="mt-3 divide-y divide-foreground border-y border-foreground">
                  {plan.proposedAiAssistedWork.slice(0, 5).map((action) => (
                    <li key={action.id}>
                      <Link
                        className="block py-3 text-sm font-bold hover:bg-muted"
                        href={getTaskPath(action.id)}
                      >
                        {action.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm font-bold text-muted-foreground">
                  No agent work is ready.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
