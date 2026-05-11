# Optimize Earth Protocol

This is the canonical protocol for any AI agent started with the instruction:

`optimize earth`

In this mode, the task database is the source of truth. Agents coordinate through the task/MCP layer, not through static package ownership.

## Goal

Make many agents safe to run in parallel without:

- duplicate work
- conflicting edits
- outreach spam
- junk tasks entering the canonical queue

## Required Loop

Every agent must follow this order:

1. Check the current branch or PR for broken GitHub Actions if that information is available.
2. If GitHub Actions are broken because of repo code, treat fixing them as the immediate system-blocker task before trusting the queue.
3. Audit whether the current queue is sane enough to trust.
4. If the queue is clearly missing canonical campaign tasks, run `pnpm db:sync:managed-data -- --apply` first. If the queue is still broken after managed data sync, propose the smallest system-improvement task that would fix the specific gap.
5. Call `getQueueAudit`, then call `getNextAction` with its capabilities.
6. If no executable task exists:
   - call `proposeTaskBundle` only for high-value missing tasks or unblockers
   - do not create `ACTIVE` tasks directly
   - stop after logging the skipped run
7. If a task exists, call `acquireLease`.
8. Work only on the leased task.
9. If the work outlives the lease TTL, call `heartbeatLease`.
10. If the work involves outreach:
   - do not perform automated live outreach unless the task explicitly authorizes it
   - post a source-backed `postTaskComment` with the proposed message, target, and rationale
   - let comment notifications/delivery infrastructure handle recipients where configured
11. Log the run with `logAgentRun`.
12. Release the lease when the step is complete or skipped.

## Ownership Model

- The leased task is the ownership boundary.
- Agents may edit any files required by the leased task.
- Agents must not make unrelated repo-wide changes from a vague prompt.
- Agents must hold only one active lease at a time.

## Task Creation Rules

- For public Earth-level work, agent-created tasks start as `DRAFT`.
- Public canonical tasks should normally be proposed with `proposeTaskBundle`.
- Public canonical work enters the queue only after review and promotion.
- Private personal tasks are different: MCP `createTask` defaults to private `ACTIVE` tasks so a user's AI can maintain a live personal queue.
- If a task is blocked, prefer proposing the smallest high-value unblocker.

## Ranking Rules

Agents should prefer:

1. the highest-value executable unleased task
2. if none is executable, the highest-value unblocker

Agents should not:

- grab blocked tasks that cannot move
- generate broad speculative backlogs
- create duplicate tasks for the same objective
- trust a stupid queue without first trying to fix it

## Outreach Rules

- No mass messaging
- No repeated form submissions inside cooldown windows
- No automated live outreach without the relevant planner and safeguards
- Personalized, source-backed drafts first

## If MCP Is Unavailable

Stop and report blocked.

Do not invent a second source of truth. Do not create canonical plan state outside the task database.
