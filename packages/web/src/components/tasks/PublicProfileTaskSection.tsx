import Link from "next/link";
import { TaskStatus } from "@optimitron/db";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { TaskShareButtons } from "@/components/tasks/TaskShareButtons";
import { getTaskPath } from "@/lib/routes";
import {
  buildTaskShareText,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";

function formatTaskDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

function getTaskStatusLabel(task: TaskCardTask) {
  if (task.status === TaskStatus.VERIFIED) {
    return `Completed ${formatTaskDate(task.verifiedAt ?? task.completedAt) ?? ""}`.trim();
  }

  if (task.status === TaskStatus.STALE) return "Stale";
  if (task.status === TaskStatus.DRAFT) return "Draft";

  const due = formatTaskDate(task.dueAt);
  return due ? `Due ${due}` : "Open";
}

function getShareText(task: TaskCardTask, ownerName: string) {
  const delayStats = getTaskDelayStats(task);
  return buildTaskShareText({
    currentDelayDays: delayStats.currentDelayDays,
    currentEconomicValueUsdLost: delayStats.currentEconomicValueUsdLost,
    currentHumanLivesLost: delayStats.currentHumanLivesLost,
    currentSufferingHoursLost: delayStats.currentSufferingHoursLost,
    targetLabel:
      task.assigneePerson?.displayName ??
      task.assigneeOrganization?.name ??
      ownerName,
    taskTitle: task.title,
  });
}

function TaskList({
  isCompleted = false,
  ownerName,
  tasks,
}: {
  isCompleted?: boolean;
  ownerName: string;
  tasks: TaskCardTask[];
}) {
  if (tasks.length === 0) {
    return (
      <p className="border border-foreground px-4 py-5 text-sm font-bold text-muted-foreground">
        {isCompleted
          ? "No completed public tasks yet."
          : "No open public tasks yet."}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-foreground border border-foreground">
      {tasks.map((task) => (
        <li className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto]" key={task.id}>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="border border-foreground px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                {getTaskStatusLabel(task)}
              </span>
              {task.category ? (
                <span className="border border-foreground px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                  {String(task.category).toLowerCase()}
                </span>
              ) : null}
            </div>
            <Link
              className="block text-lg font-black uppercase leading-tight underline-offset-4 hover:underline"
              href={getTaskPath(task.id)}
            >
              {task.title}
            </Link>
            {task.roleTitle || task.assigneeAffiliationSnapshot ? (
              <p className="text-sm font-bold text-muted-foreground">
                {[task.roleTitle, task.assigneeAffiliationSnapshot]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <Link
              className="text-sm font-black uppercase underline underline-offset-4"
              href={getTaskPath(task.id)}
            >
              Details
            </Link>
            {!isCompleted ? (
              <TaskShareButtons
                shareText={getShareText(task, ownerName)}
                taskId={task.id}
                taskTitle={task.title}
                variant="text"
              />
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PublicProfileTaskSection({
  completedTasks,
  heading = "Public Tasks",
  intro,
  openTasks,
  ownerName,
  profileHref,
}: {
  completedTasks: TaskCardTask[];
  heading?: string;
  intro?: string;
  openTasks: TaskCardTask[];
  ownerName: string;
  profileHref?: string | null;
}) {
  const totalCount = openTasks.length + completedTasks.length;
  const summary =
    intro ??
    (totalCount > 0
      ? `Public tasks assigned to ${ownerName}. Open tasks need pressure. Completed tasks show receipts.`
      : `No public tasks are assigned to ${ownerName} yet.`);

  return (
    <section className="border-t-2 border-foreground py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-[0.08em] [font-family:var(--v0-font-libre-baskerville)]">
            {heading}
          </h2>
          <p className="max-w-2xl text-sm font-bold leading-6 text-muted-foreground">
            {summary}
          </p>
        </div>
        {profileHref ? (
          <Link
            className="text-sm font-black uppercase underline underline-offset-4"
            href={profileHref}
          >
            View public profile
          </Link>
        ) : null}
      </div>

      <div className="mt-5 grid gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">
            Open Tasks ({openTasks.length.toLocaleString("en-US")})
          </h3>
          <TaskList ownerName={ownerName} tasks={openTasks} />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">
            Completed Tasks ({completedTasks.length.toLocaleString("en-US")})
          </h3>
          <TaskList isCompleted ownerName={ownerName} tasks={completedTasks} />
        </div>
      </div>
    </section>
  );
}
