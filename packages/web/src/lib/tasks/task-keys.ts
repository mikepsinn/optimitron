/**
 * Task-key registry — web facade.
 *
 * The canonical task-key registry lives in `@optimitron/db` (see
 * `packages/db/src/task-keys.ts`) so the prisma seed and any backend script
 * can use the same literals. This file re-exports everything for the web
 * import path (`@/lib/tasks/task-keys`) and adds the one helper that needs
 * Next.js routing (`getTreatyParentTaskHref`).
 *
 * When adding a new task key:
 *   1. Add the constant or builder to `packages/db/src/task-keys.ts`.
 *   2. It becomes available here automatically through the re-export.
 *   3. Never inline a raw string like "program:one-percent-treaty:..." or
 *      define a second copy of a prefix in a per-feature file.
 */

import { getTaskPath } from "@/lib/routes";
import { TREATY_PARENT_TASK_ID } from "@optimitron/db/task-keys";

export * from "@optimitron/db/task-keys";

export function getTreatyParentTaskHref() {
  return getTaskPath(TREATY_PARENT_TASK_ID);
}
