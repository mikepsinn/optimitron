import { isReservedPlanningRootTask } from "@optimitron/db/task-keys";

export const MAX_AGENT_TASK_EFFORT_HOURS = 8;

export function isBoundedAgentTaskEffort(
  estimatedEffortHours: number | null | undefined,
) {
  return (
    typeof estimatedEffortHours === "number" &&
    Number.isFinite(estimatedEffortHours) &&
    estimatedEffortHours > 0 &&
    estimatedEffortHours <= MAX_AGENT_TASK_EFFORT_HOURS
  );
}

export function isExecutableWorkItem(task: {
  activeChildTaskCount?: number | null;
  activeExecutionAttemptCount?: number | null;
  childTasks?: readonly unknown[] | null;
  id?: string | null;
  taskKey?: string | null;
}) {
  return (
    !isReservedPlanningRootTask(task) &&
    (task.activeChildTaskCount ?? task.childTasks?.length ?? 0) === 0 &&
    (task.activeExecutionAttemptCount ?? 0) === 0
  );
}
