import type { TaskCardTask } from "@/components/tasks/task-card";

export function getTaskDueMs(task: TaskCardTask): number | null {
  if (!task.dueAt) return null;
  return task.dueAt instanceof Date
    ? task.dueAt.getTime()
    : new Date(task.dueAt).getTime();
}

export function countOverdueTasks(
  tasks: TaskCardTask[],
  now: Date,
): number {
  const nowMs = now.getTime();
  return tasks.filter((task) => {
    const dueMs = getTaskDueMs(task);
    return dueMs != null && dueMs < nowMs;
  }).length;
}
