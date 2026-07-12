/**
 * Pure agenda shaping for the Chrome extension popup: slim DTO mapping plus
 * the ordering that picks the next action. Kept free of Prisma/auth so it is
 * unit-testable; the route handler does the I/O.
 */

export interface ExtensionAgendaTask {
  dueAt: string | null;
  estimatedEffortHours: number | null;
  /** Expected economic value in USD from the marginal impact frame. */
  ev: number | null;
  id: string;
  title: string;
}

/** Structural subset of a decorated task row from `listTasks`. */
export interface ExtensionAgendaSourceTask {
  dueAt?: Date | string | null;
  estimatedEffortHours?: number | null;
  id: string;
  marginalImpactFrame?: {
    expectedEconomicValueUsdBase: number | null;
  } | null;
  selectedImpactFrame?: {
    expectedEconomicValueUsdBase: number | null;
  } | null;
  title: string;
}

export interface ExtensionAgenda {
  nextAction: ExtensionAgendaTask | null;
  reminders: ExtensionAgendaTask[];
  tasks: ExtensionAgendaTask[];
}

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function toExtensionAgendaTask(
  task: ExtensionAgendaSourceTask,
): ExtensionAgendaTask {
  return {
    dueAt: toIso(task.dueAt),
    estimatedEffortHours: task.estimatedEffortHours ?? null,
    ev:
      task.marginalImpactFrame?.expectedEconomicValueUsdBase ??
      task.selectedImpactFrame?.expectedEconomicValueUsdBase ??
      null,
    id: task.id,
    title: task.title,
  };
}

function dueTime(task: ExtensionAgendaTask): number | null {
  return task.dueAt === null ? null : new Date(task.dueAt).getTime();
}

function isOverdue(task: ExtensionAgendaTask, now: Date): boolean {
  const t = dueTime(task);
  return t !== null && t <= now.getTime();
}

/**
 * Overdue first (earliest due first), then future-dated ascending, then
 * unscheduled by EV descending. Ties break on title then id for stability.
 */
export function compareExtensionAgendaTasks(
  left: ExtensionAgendaTask,
  right: ExtensionAgendaTask,
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

export function buildExtensionAgenda(
  source: readonly ExtensionAgendaSourceTask[],
  now: Date,
): ExtensionAgenda {
  const tasks = source
    .map(toExtensionAgendaTask)
    .sort((a, b) => compareExtensionAgendaTasks(a, b, now));
  return {
    nextAction: tasks[0] ?? null,
    reminders: tasks.filter((task) => isOverdue(task, now)),
    tasks,
  };
}
