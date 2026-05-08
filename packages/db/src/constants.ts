/**
 * Shared constants for @optimitron/db.
 *
 * Values here are consumed by the seed script and by web/app code
 * so that slugs and other magic strings stay in lockstep.
 */

export const TREATY_REFERENDUM_SLUG = "one-percent-treaty";
export const DECLARATION_REFERENDUM_SLUG = "declaration-of-optimization";
export const COURT_OF_HUMANITY_REFERENDUM_SLUG = "court-of-humanity";

// Task keys (taskKey prefixes, root IDs, builders) live in ./task-keys.ts
// and are re-exported from the package barrel so consumers can do
// `import { TREATY_PARENT_TASK_ID } from "@optimitron/db"`.
