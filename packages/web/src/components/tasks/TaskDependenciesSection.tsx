import React from "react";
import Link from "next/link";
import { TaskClaimStatus, TaskEdgeType, TaskStatus } from "@optimitron/db";
import { getTaskPath } from "@/lib/routes";

const TASK_DATE_TIME_ZONE = "UTC";

const RELATED_TASK_ACCESS_CLAIM_STATUSES = new Set<TaskClaimStatus>([
  TaskClaimStatus.CLAIMED,
  TaskClaimStatus.IN_PROGRESS,
  TaskClaimStatus.COMPLETED,
  TaskClaimStatus.VERIFIED,
]);

export type RelatedTaskLink = {
  assigneePersonId: string | null;
  claims?: Array<{
    status: TaskClaimStatus;
    userId: string;
  }>;
  createdByUserId: string;
  dueAt?: Date | string | null;
  estimatedEffortHours?: number | null;
  id: string;
  isPublic: boolean;
  status: TaskStatus;
  taskKey?: string | null;
  title: string;
};

export type TaskDependencyEdge = {
  edgeType: TaskEdgeType;
  probabilityDeltaBase?: number | null;
  timeDeltaDaysBase?: number | null;
};

export type TaskDependenciesSectionTask = {
  incomingEdges: Array<
    TaskDependencyEdge & {
      fromTask: RelatedTaskLink;
    }
  >;
  outgoingEdges: Array<
    TaskDependencyEdge & {
      toTask: RelatedTaskLink;
    }
  >;
};

export type TaskDependenciesViewer = {
  id: string;
  isAdmin: boolean;
  personId: string | null;
} | null;

function getDisplayDate(value: Date | string | null | undefined): Date | null {
  if (value == null) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatDueDate(value: Date | string | null | undefined) {
  const date = getDisplayDate(value);
  if (date == null) {
    return null;
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    timeZone: TASK_DATE_TIME_ZONE,
    year: "numeric",
  });
}

function formatEffortHours(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }
  if (value === 0) {
    return "0 minutes";
  }
  if (value < 1) {
    const minutes = Math.max(1, Math.round(value * 60));
    return `${minutes.toLocaleString("en-US")} ${minutes === 1 ? "minute" : "minutes"}`;
  }
  const rounded = Number(value.toFixed(value >= 10 ? 0 : 1));
  return `${rounded.toLocaleString("en-US")} ${rounded === 1 ? "hour" : "hours"}`;
}

export function canSeeRelatedTask(
  task: RelatedTaskLink,
  viewer: TaskDependenciesViewer,
) {
  if (task.isPublic) {
    return true;
  }
  if (!viewer) {
    return false;
  }
  if (viewer.isAdmin || task.createdByUserId === viewer.id) {
    return true;
  }
  if (viewer.personId && task.assigneePersonId === viewer.personId) {
    return true;
  }
  return (
    task.claims?.some(
      (claim) =>
        claim.userId === viewer.id &&
        RELATED_TASK_ACCESS_CLAIM_STATUSES.has(claim.status),
    ) ?? false
  );
}

function formatTaskStatus(status: TaskStatus) {
  switch (status) {
    case TaskStatus.DRAFT:
      return "Draft";
    case TaskStatus.ACTIVE:
      return "Active";
    case TaskStatus.VERIFIED:
      return "Verified";
    case TaskStatus.STALE:
      return "Stale";
    default:
      return String(status).toLowerCase();
  }
}

function getDependencyEdgeLabel(
  edgeType: TaskEdgeType,
  direction: "incoming" | "outgoing",
) {
  if (edgeType === TaskEdgeType.DEPENDS_ON) {
    return direction === "incoming" ? "depends on" : "needed by";
  }
  return direction === "incoming" ? "blocks this" : "unlocks";
}

function formatProbabilityDelta(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  const percentagePoints = value * 100;
  const rounded = Number(
    percentagePoints.toFixed(percentagePoints >= 10 ? 0 : 1),
  );
  return `+${rounded.toLocaleString("en-US")}pp success`;
}

function formatTimeDeltaDays(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  const rounded = Number(value.toFixed(value >= 10 ? 0 : 1));
  return `${rounded.toLocaleString("en-US")} ${rounded === 1 ? "day" : "days"} faster`;
}

function RelatedTaskCard({
  direction,
  edge,
  task,
}: {
  direction: "incoming" | "outgoing";
  edge: TaskDependencyEdge;
  task: RelatedTaskLink;
}) {
  const dueLabel = formatDueDate(task.dueAt);
  const effortLabel = formatEffortHours(task.estimatedEffortHours);
  const probabilityLabel = formatProbabilityDelta(edge.probabilityDeltaBase);
  const timeLabel = formatTimeDeltaDays(edge.timeDeltaDaysBase);

  return (
    <li className="border border-foreground p-4">
      <Link
        className="text-base font-black underline underline-offset-4 hover:no-underline"
        href={getTaskPath(task.id)}
      >
        {task.title}
      </Link>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase text-muted-foreground">
        <span className="border border-foreground px-2 py-1 text-foreground">
          {getDependencyEdgeLabel(edge.edgeType, direction)}
        </span>
        <span className="border border-foreground px-2 py-1">
          {formatTaskStatus(task.status)}
        </span>
        {task.taskKey ? (
          <span className="border border-foreground px-2 py-1">
            {task.taskKey}
          </span>
        ) : null}
        {dueLabel ? (
          <span className="border border-foreground px-2 py-1">
            Due {dueLabel}
          </span>
        ) : null}
        {effortLabel ? (
          <span className="border border-foreground px-2 py-1">
            ~{effortLabel}
          </span>
        ) : null}
        {probabilityLabel ? (
          <span className="border border-foreground px-2 py-1">
            {probabilityLabel}
          </span>
        ) : null}
        {timeLabel ? (
          <span className="border border-foreground px-2 py-1">
            {timeLabel}
          </span>
        ) : null}
      </div>
    </li>
  );
}

export function TaskDependenciesSection({
  task,
  viewer,
}: {
  task: TaskDependenciesSectionTask;
  viewer: TaskDependenciesViewer;
}) {
  const blockers = task.incomingEdges.filter((edge) =>
    canSeeRelatedTask(edge.fromTask, viewer),
  );
  const unlockedTasks = task.outgoingEdges.filter((edge) =>
    canSeeRelatedTask(edge.toTask, viewer),
  );

  if (blockers.length === 0 && unlockedTasks.length === 0) {
    return null;
  }

  return (
    <section id="dependencies" className="border-b border-foreground py-6">
      <h2 className="text-xl font-black">Dependencies</h2>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        {blockers.length > 0 ? (
          <div>
            <h3 className="text-sm font-black uppercase text-muted-foreground">
              Blocking this task
            </h3>
            <ul className="mt-3 space-y-3">
              {blockers.map((edge) => (
                <RelatedTaskCard
                  key={`${edge.fromTask.id}-${edge.edgeType}`}
                  direction="incoming"
                  edge={edge}
                  task={edge.fromTask}
                />
              ))}
            </ul>
          </div>
        ) : null}

        {unlockedTasks.length > 0 ? (
          <div>
            <h3 className="text-sm font-black uppercase text-muted-foreground">
              Tasks this unlocks
            </h3>
            <ul className="mt-3 space-y-3">
              {unlockedTasks.map((edge) => (
                <RelatedTaskCard
                  key={`${edge.toTask.id}-${edge.edgeType}`}
                  direction="outgoing"
                  edge={edge}
                  task={edge.toTask}
                />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
