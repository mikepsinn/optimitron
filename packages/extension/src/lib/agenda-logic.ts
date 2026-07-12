/**
 * Pure agenda logic — sorting, partitioning, next-action selection, and
 * snooze-time math. No chrome.* APIs, no network, no clock reads: every
 * function takes `now` explicitly so it stays unit-testable.
 */

export interface AgendaTask {
  id: string;
  title: string;
  /** ISO timestamp or null when unscheduled. */
  dueAt: string | null;
  /** Expected economic value in USD (marginal frame), if estimated. */
  ev: number | null;
  estimatedEffortHours: number | null;
  deadlinePolicy?: string | null;
}

export interface AgendaPartition<T extends AgendaTask> {
  overdue: T[];
  today: T[];
  later: T[];
  unscheduled: T[];
}

function dueTime(task: AgendaTask): number | null {
  if (!task.dueAt) return null;
  const t = new Date(task.dueAt).getTime();
  return Number.isFinite(t) ? t : null;
}

export function isOverdue(task: AgendaTask, now: Date): boolean {
  const t = dueTime(task);
  return t !== null && t <= now.getTime();
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Ordering: overdue first (earliest due first), then future-dated ascending,
 * then unscheduled by EV descending (ties by title, then id, for stability).
 */
export function compareAgendaTasks(
  left: AgendaTask,
  right: AgendaTask,
  now: Date,
): number {
  const leftDue = dueTime(left);
  const rightDue = dueTime(right);
  const leftOverdue = isOverdue(left, now);
  const rightOverdue = isOverdue(right, now);

  if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
  if (leftDue !== null && rightDue !== null && leftDue !== rightDue) {
    return leftDue - rightDue;
  }
  if ((leftDue !== null) !== (rightDue !== null)) {
    return leftDue !== null ? -1 : 1;
  }
  const leftEv = left.ev ?? Number.NEGATIVE_INFINITY;
  const rightEv = right.ev ?? Number.NEGATIVE_INFINITY;
  if (leftEv !== rightEv) return rightEv - leftEv;
  const byTitle = left.title.localeCompare(right.title);
  if (byTitle !== 0) return byTitle;
  return left.id.localeCompare(right.id);
}

export function sortAgendaTasks<T extends AgendaTask>(
  tasks: readonly T[],
  now: Date,
): T[] {
  return [...tasks].sort((a, b) => compareAgendaTasks(a, b, now));
}

export function selectNextAction<T extends AgendaTask>(
  tasks: readonly T[],
  now: Date,
): T | null {
  return sortAgendaTasks(tasks, now)[0] ?? null;
}

export function partitionAgenda<T extends AgendaTask>(
  tasks: readonly T[],
  now: Date,
): AgendaPartition<T> {
  const sorted = sortAgendaTasks(tasks, now);
  const partition: AgendaPartition<T> = {
    later: [],
    overdue: [],
    today: [],
    unscheduled: [],
  };
  for (const task of sorted) {
    const due = dueTime(task);
    if (due === null) {
      partition.unscheduled.push(task);
    } else if (isOverdue(task, now)) {
      partition.overdue.push(task);
    } else if (isSameLocalDay(new Date(due), now)) {
      partition.today.push(task);
    } else {
      partition.later.push(task);
    }
  }
  return partition;
}

// ---------------------------------------------------------------------------
// Snooze-time math
// ---------------------------------------------------------------------------

export type SnoozeOption = "10m" | "1h" | "tonight";

/** Local hour that counts as "tonight". */
export const TONIGHT_HOUR = 20;
/** When "tonight" already passed, snooze to this hour tomorrow morning. */
export const TOMORROW_MORNING_HOUR = 9;

/**
 * "10m" → now + 10 minutes. "1h" → now + 1 hour.
 * "tonight" → today 20:00 local; if it is already 20:00 or later,
 * tomorrow 09:00 local (tonight already happened).
 */
export function snoozeUntil(option: SnoozeOption, now: Date): Date {
  switch (option) {
    case "10m":
      return new Date(now.getTime() + 10 * 60_000);
    case "1h":
      return new Date(now.getTime() + 60 * 60_000);
    case "tonight": {
      const tonight = new Date(now);
      tonight.setHours(TONIGHT_HOUR, 0, 0, 0);
      if (now.getTime() < tonight.getTime()) return tonight;
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(TOMORROW_MORNING_HOUR, 0, 0, 0);
      return tomorrow;
    }
  }
}

// ---------------------------------------------------------------------------
// Display formatting (pure string helpers)
// ---------------------------------------------------------------------------

export function formatEv(ev: number | null): string | null {
  if (ev == null || !Number.isFinite(ev)) return null;
  const abs = Math.abs(ev);
  if (abs >= 1_000_000) return `$${(ev / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(ev / 1_000).toFixed(1)}k`;
  return `$${ev.toFixed(0)}`;
}

export function formatDueLabel(task: AgendaTask, now: Date): string {
  if (!task.dueAt) return "unscheduled";
  const due = new Date(task.dueAt);
  const time = due.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (isOverdue(task, now)) {
    return isSameLocalDay(due, now)
      ? `overdue ${time}`
      : `overdue ${due.toLocaleDateString([], { month: "short", day: "numeric" })}`;
  }
  if (isSameLocalDay(due, now)) return time;
  return `${due.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
}
