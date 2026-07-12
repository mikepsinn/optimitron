# optimitron-tasks MCP — API improvements plan

**Branch:** `feature/dating-safety-layer` (PR #87)
**Owner:** Mike P. Sinn
**Date:** 2026-05-24
**Source:** Punch list surfaced by a Codex/Claude agent that hit MCP server limitations while restructuring a task hierarchy.

## Problem

The optimitron-tasks MCP server is missing capabilities that another agent needed mid-conversation. Of the 12 items below, the agent estimated the top 3 alone would have saved ~30 minutes and made the task hierarchy correct on the first pass.

## Top 3 (must ship in this PR)

### 1. `updateTask` accepts `parentTaskId`

Currently `parentTaskId` is settable at creation but cannot be changed afterward. If an agent creates a task and later realizes it belongs under a different parent, it is stuck.

**Required semantics:**

- Accept `parentTaskId: string | null` in the `updateTask` Zod schema (`null` = move to top-level / unparent).
- Cycle detection: a task cannot become its own ancestor. If proposed parent is the task itself OR any descendant of the task, reject with a clear 400 error naming the cycle.
- Permission check: same authorization rules as creating a task under that parent.
- Idempotent: re-setting the same `parentTaskId` is a no-op success.

### 2. `updateTask` accepts `isPublic` / `visibility`

Currently all API-created tasks default to `PRIVATE` with no way to flip them public via the API. Mike wants anyone to be able to see and claim seeded tasks.

**Required semantics:**

- Accept `isPublic: boolean` in `updateTask` Zod schema. If `Task.visibility` enum exists separately, accept both `isPublic` and `visibility` and reconcile them (probably: `isPublic = visibility === "PUBLIC"`, so accept either form for API convenience).
- Permission check: only task creator, assignee, or org admin can flip visibility. Public-to-private flip might need additional confirmation if there are existing public-claim records (TBD in design).

### 3. `bulkCreateTasks`

Currently agents make N API calls to create N tasks. For typical workflows (creating 10 grant-request tasks for 10 foundations) this is 10 calls plus another 10 to set dependencies.

**Required semantics:**

- Accept an array of task definitions. Each definition has the same shape as `createTask` input PLUS optional `clientRef: string` (caller-supplied stable handle for cross-references within the batch).
- Parent-child relationships specified inline using `clientRef` for forward references (a child can reference a parent that appears later in the array; resolve in topological order).
- Dependency relationships (`blockerTaskIds`, `blockedTaskIds`) specified inline, also via `clientRef` if pointing to a task in the same batch.
- Atomic transaction semantics: ALL-OR-NOTHING. If task #47 fails validation, the whole batch rolls back. No partial creation.
- Returns the array of created tasks (in same order as input), each with the resolved `taskId`.
- Reasonable batch size cap (e.g. 100 tasks per call) with a clear error if exceeded.

## Nice-to-have (defer or include based on autoplan judgment)

4. **`moveTask` / `reparentTask` dedicated tool** — sugar for `updateTask({ parentTaskId })`. Could defer if (1) lands cleanly.
5. **`bulkUpdateTasks`** — array of `{ taskId, patch }`. Useful for "set all 10 tasks public at once."
6. **`getTaskTree`** — given parent ID, return full descendant tree with dependency relationships. Saves N searches for hierarchy understanding.
7. **`cloneTask`** — duplicate task with new assignee. Useful for templating (10 demand letters for 10 contractors).
8. **`createTask` accepts `blockerTaskIds` at creation time** — currently requires create-then-update. Two calls → one.
9. **`searchTasks` filters by `parentTaskId`** — find all children of a parent without text search.
10. **`updateTask` approval flow clarification** — the "no approval received" error was unclear to the calling agent. Either auto-approve for the task creator, or make the approval mechanism explicit in the error message.
11. **Task templates** — define a template once ("demand letter for defense contractor"), instantiate with variables (company name, CEO name, amount). Probably its own design effort.
12. **Webhooks / notifications on status change** — when a claimed task is completed, notify dependent-task owners + auto-unblock. Substantial new infra; almost certainly its own PR.

## Implementation notes (rough)

- MCP server source location: needs survey (probably `packages/web/src/lib/mcp/` or `packages/web/src/app/api/mcp/`).
- Current `updateTask` / `createTask` / `searchTasks` Zod schemas and handlers: need survey to map current shapes.
- `Task` model is in `packages/db/prisma/schema.prisma` — relevant fields include `parentTaskId`, `isPublic`, `visibility`, `claims`, etc.
- Cycle detection algorithm: BFS/DFS from candidate parent upward (toward root) checking if the task itself appears. Depth-cap at a reasonable number (e.g. 100) with cycle-detection guard. The existing `getTaskAncestors` helper in `packages/web/src/lib/tasks/impact.ts` is the natural starting point.
- Transaction semantics for `bulkCreateTasks`: wrap in `prisma.$transaction(async (tx) => ...)` with serializable isolation if cross-row consistency matters; otherwise the default isolation is fine.

## Target branch + commit semantics

- All work lands on `feature/dating-safety-layer` (PR #87) per the one-PR-at-a-time rule. PR #87 is currently dating-safety + joke-page work; this adds an MCP-improvements category to it.
- Top 3 ship as one focused commit, snapshot if any MCP descriptor docs need updating.

## Test requirements

- For each of the top 3: unit test the happy path + error paths (cycle attempt, permission denial, batch with one invalid task → full rollback).
- Cycle detection test: explicitly try to make a task its own grandparent.
- Idempotency test: call `updateTask({ parentTaskId: X })` twice; second call is a no-op success.
- `bulkCreateTasks` with `clientRef` forward references: child task in position 3 referencing parent in position 7 should resolve correctly.

## Quality gates

1. `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @optimitron/web exec tsc --noEmit`
2. `pnpm --filter @optimitron/web test -- mcp` (or whichever pattern catches the MCP server tests)
3. `pnpm --filter @optimitron/db prisma:validate` (if any schema impact)

## Open questions for autoplan to surface

- Should the 9 nice-to-haves ship in this PR (boil the lake) or defer to follow-ups (boil-the-lake-locally)?
- Is the `visibility` enum a thing on `Task`, or just `isPublic` boolean? Affects API surface.
- Should `bulkCreateTasks` use `clientRef` for forward references, or require client to pre-sort topologically?
- For cycle detection on reparenting: does the existing `getTaskAncestors` helper exist and work, or does this need a new BFS?
