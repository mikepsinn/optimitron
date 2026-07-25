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
5. Call `getQueueAudit`, then select a task from the **agent** queue:
   - Use `getAIQueue` (signed-in agent) or `getNextTask` (anonymous agent).
   - Do **not** use `getNextAction`. That tool is documented as "the best next **self-work** action from
     available **private** tasks" — it ranks the human owner's personal queue and will hand an agent
     things like "Talk with <person> about the grant" (`executor_type: "Self"`, category `COMMUNICATION`).
     An agent cannot execute those, and attempting them violates the outreach rules below.
6. Before working, verify the selected task is actually agent-executable:
   - Require `executor_type: "AI Agent"` and `executionMode` of `HUMAN_OR_AGENT` or `AGENT_ONLY`.
   - Skip and log anything `HUMAN_ONLY` or `executor_type: "Self"`, even if the queue ranked it first.
   - Do not trust `capabilityStatus: "eligible"` on its own. When no skills are recorded for the target
     executor, the capability check has no data and returns "All recorded capability requirements are
     satisfied" for every task, including human-only ones. Treat an empty capability record as UNKNOWN,
     not as approval.
7. If no executable task exists:
   - call `proposeTaskBundle` only for high-value missing tasks or unblockers
   - do not create `ACTIVE` tasks directly
   - stop after logging the skipped run
8. If a task exists, call `acquireLease`.
9. Work only on the leased task.
10. If the work outlives the lease TTL, call `heartbeatLease`.
11. If the work involves outreach:
   - do not perform automated live outreach unless the task explicitly authorizes it
   - post a source-backed `postTaskComment` with the proposed message, target, and rationale
   - let comment notifications/delivery infrastructure handle recipients where configured
12. Log the run with `logAgentRun`.
13. Release the lease when the step is complete or skipped.

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

### Precedence: system blockers outrank EV

Steps 1–2 outrank this section. A broken build or deploy is a blocker on every other task, and the EV
score does not know that. Observed 2026-07-25: `Deploy smoke` was failing on `main` while the queue
ranked "Fix the current Optimitron deployment-smoke failure" at priority 175 and a one-hour phone call
at priority 20000 — a 114x inversion against the thing actually blocking the repo. Fix the blocker
first regardless of its computed rank.

### Known limitation: EV units are not comparable across branches

Estimates in the tree are currently denominated in **dollars of fundraising or developer velocity**
(e.g. $8,000 for a pitch slide, $350 for a CI fix), not in the north-star units from `AGENTS.md`
(median healthy life expectancy, median real after-tax income). Dollar-denominated personal and
organization tasks therefore outrank campaign work in the same ordering, and a global "highest value"
comparison across branches is not currently meaningful. Until estimates are recalibrated, rank within
a branch and treat cross-branch comparisons as unreliable. The open dev tasks on estimate calibration,
auto-estimation, semantic duplicate detection, and the anti-queue are the fix for this; the calibration
guard is the stated prerequisite for the other three.

## Outreach Rules

- No mass messaging
- No repeated form submissions inside cooldown windows
- No automated live outreach without the relevant planner and safeguards
- Personalized, source-backed drafts first

## If MCP Is Unavailable

Stop and report blocked.

Do not invent a second source of truth. Do not create canonical plan state outside the task database.
