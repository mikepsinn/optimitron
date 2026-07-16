import { isReservedPlanningRootTask } from "@optimitron/db/task-keys";

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
