import Link from "next/link";
import type { ReactNode } from "react";
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

function getShareText(
  task: TaskCardTask,
  ownerName: string,
  mode: "assigned" | "assignedBy" | "requested",
) {
  const delayStats = getTaskDelayStats(task);
  const targetLabel =
    mode === "requested"
      ? "This open task"
      : (task.assigneePerson?.displayName ??
        task.assigneeOrganization?.name ??
        ownerName);
  return buildTaskShareText({
    currentDelayDays: delayStats.currentDelayDays,
    currentEconomicValueUsdLost: delayStats.currentEconomicValueUsdLost,
    currentHumanLivesLost: delayStats.currentHumanLivesLost,
    currentSufferingHoursLost: delayStats.currentSufferingHoursLost,
    targetLabel,
    taskTitle: task.title,
  });
}

function TaskList({
  emptyText,
  isCompleted = false,
  mode = "assigned",
  ownerName,
  tasks,
}: {
  emptyText: string;
  isCompleted?: boolean;
  mode?: "assigned" | "assignedBy" | "requested";
  ownerName: string;
  tasks: TaskCardTask[];
}) {
  if (tasks.length === 0) {
    return (
      <p className="border border-foreground px-4 py-5 text-sm font-bold text-muted-foreground">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-foreground border border-foreground">
      {tasks.map((task) => (
        <li className="space-y-3 p-4" key={task.id}>
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
            {mode === "assignedBy" &&
            (task.assigneePerson || task.assigneeOrganization) ? (
              <p className="text-sm font-bold text-muted-foreground">
                Assigned to{" "}
                {task.assigneePerson?.displayName ??
                  task.assigneeOrganization?.name}
              </p>
            ) : mode === "requested" ? (
              <p className="text-sm font-bold text-muted-foreground">
                Open to anyone who can help.
              </p>
            ) : task.roleTitle || task.assigneeAffiliationSnapshot ? (
              <p className="text-sm font-bold text-muted-foreground">
                {[task.roleTitle, task.assigneeAffiliationSnapshot]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="text-sm font-black uppercase underline underline-offset-4"
              href={getTaskPath(task.id)}
            >
              Details
            </Link>
            {!isCompleted ? (
              <TaskShareButtons
                shareText={getShareText(task, ownerName, mode)}
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

function TaskGroup({
  action,
  emptyText,
  isCompleted = false,
  mode = "assigned",
  ownerName,
  tasks,
  title,
}: {
  action?: ReactNode;
  emptyText: string;
  isCompleted?: boolean;
  mode?: "assigned" | "assignedBy" | "requested";
  ownerName: string;
  tasks: TaskCardTask[];
  title: string;
}) {
  if (tasks.length === 0 && !action) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">
          {title} ({tasks.length.toLocaleString("en-US")})
        </h3>
        {action ? <div className="flex sm:justify-end">{action}</div> : null}
      </div>
      <TaskList
        emptyText={emptyText}
        isCompleted={isCompleted}
        mode={mode}
        ownerName={ownerName}
        tasks={tasks}
      />
    </div>
  );
}

export function PublicProfileTaskSection({
  assignedByTasks = [],
  completedTasks = [],
  heading = "Public Tasks",
  headingAction,
  intro,
  openTasks = [],
  ownerName,
  profileHref,
  requestAction,
  requestedTasks = [],
}: {
  assignedByTasks?: TaskCardTask[];
  completedTasks: TaskCardTask[];
  heading?: string;
  headingAction?: ReactNode;
  intro?: string;
  openTasks: TaskCardTask[];
  ownerName: string;
  profileHref?: string | null;
  requestAction?: ReactNode;
  requestedTasks?: TaskCardTask[];
}) {
  const totalCount =
    openTasks.length +
    requestedTasks.length +
    assignedByTasks.length +
    completedTasks.length;
  const summary =
    intro ??
    (totalCount > 0
      ? `This is how humans help ${ownerName} find and complete the highest-value actions to end war and disease.`
      : `No one has suggested ${ownerName}'s next action yet.`);

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
        {headingAction ? (
          <div className="flex sm:justify-end">{headingAction}</div>
        ) : profileHref ? (
          <Link
            className="text-sm font-black uppercase underline underline-offset-4"
            href={profileHref}
          >
            View public profile
          </Link>
        ) : null}
      </div>

      <div className="mt-5 grid gap-6">
        <TaskGroup
          emptyText={`No one has suggested ${ownerName}'s next action yet. If you know something useful ${ownerName} should do, add it.`}
          ownerName={ownerName}
          tasks={openTasks}
          title={`For ${ownerName}`}
        />

        <TaskGroup
          action={requestAction}
          emptyText={`${ownerName} has not asked the public for help yet.`}
          mode="requested"
          ownerName={ownerName}
          tasks={requestedTasks}
          title={`Requests from ${ownerName}`}
        />

        <TaskGroup
          emptyText={`${ownerName} has not asked a specific person to do anything public yet.`}
          mode="assignedBy"
          ownerName={ownerName}
          tasks={assignedByTasks}
          title={`Assigned by ${ownerName}`}
        />

        <TaskGroup
          emptyText="No completed public tasks yet."
          isCompleted
          ownerName={ownerName}
          tasks={completedTasks}
          title="Completed work"
        />
      </div>
    </section>
  );
}
