import type { TaskCardTask } from "@/components/tasks/task-card";

/**
 * Pure helper that splits the user's created 1% Treaty subtasks into the two
 * lists the TreatyTaskDashboardClient renders: actionable next tasks (what
 * the user clicks through), and the completed ribbon (what they've already
 * verified).
 *
 * The `:completeTraining` child is intentionally excluded from BOTH lists.
 * That subtask exists as a meta gate that auto-VERIFIEs once the five
 * actionable subtasks are done; it has no user action and surfacing it on
 * the dashboard makes the "Your next task" panel land on the literal
 * description "You don't action this one directly" — the worst possible
 * first-impression for a new user. The HMT gate is internal accounting,
 * not a queue entry.
 */
export function selectActionableTreatyTasks(input: {
  createdPrivateTasks: ReadonlyArray<{
    id: string;
    parentTaskId?: string | null;
    status?: string | null;
    sortOrder?: number | null;
    taskKey?: string | null;
  }>;
  treatyTaskId: string;
}): { nextTasks: TaskCardTask[]; completedTasks: TaskCardTask[] } {
  const sortBySortOrder = (a: TaskCardTask, b: TaskCardTask) =>
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

  const userTreatySubtasks = input.createdPrivateTasks.filter(
    (task) =>
      task.id !== input.treatyTaskId &&
      task.parentTaskId === input.treatyTaskId &&
      task.status !== "STALE",
  ) as TaskCardTask[];

  const actionableSubtasks = userTreatySubtasks.filter(
    (task) => !task.taskKey?.endsWith(":completeTraining"),
  );

  return {
    nextTasks: actionableSubtasks
      .filter((task) => task.status !== "VERIFIED")
      .sort(sortBySortOrder),
    completedTasks: actionableSubtasks
      .filter((task) => task.status === "VERIFIED")
      .sort(sortBySortOrder),
  };
}
