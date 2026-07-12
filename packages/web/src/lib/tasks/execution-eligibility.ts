import { TaskKind } from "@optimitron/db";

const NON_EXECUTABLE_LISTING_KINDS = new Set<string>([
  TaskKind.BOUNTY,
  TaskKind.ROLE_OPENING,
  TaskKind.VOLUNTEER_ROLE,
]);

export function isExecutableWorkItem(task: {
  kind?: TaskKind | string | null;
}) {
  return !task.kind || !NON_EXECUTABLE_LISTING_KINDS.has(task.kind);
}
