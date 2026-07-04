/**
 * Assignee labels for task rows and reminder/share text.
 *
 * Lives in lib (not components/tasks/task-row.tsx) because it's pure logic:
 * the component module graph executes JSX at import time, which node-env
 * tests can't load.
 */

/** Structural slice of a task the labels depend on (TaskCardTask fits). */
export interface TaskAssigneeSource {
  assigneeOrganization?: { name: string; slug: string | null } | null;
  assigneePerson?: { displayName: string | null } | null;
}

/** Tasks assigned to the humanity organization are addressed to the reader. */
export function isAssignedToHumanity(task: TaskAssigneeSource): boolean {
  return task.assigneeOrganization?.slug === "humanity";
}

/**
 * `display` is what the assignee column and avatar show; `share` is what
 * reminder/share text calls the responsible party ("<share> is overdue on
 * <task>").
 *
 * An unassigned task is open to any president — never echo the task title as
 * if it were a person's name. In share text "You" and "Anyone" don't parse,
 * so humanity owns those rows.
 */
export function getTaskAssigneeLabels(task: TaskAssigneeSource): {
  display: string;
  share: string;
} {
  const assignedToYou = isAssignedToHumanity(task);
  const assigneeName =
    task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? null;
  return {
    display: assignedToYou ? "You" : assigneeName ?? "Anyone",
    share: !assignedToYou && assigneeName ? assigneeName : "Humanity",
  };
}
