# Optimitron MCP Server

The Optimitron MCP server lets AI agents operate the live task graph instead of guessing from stale docs or chat history.

The goal is direct: help agents take the highest-value next action to increase median health-adjusted life expectancy and median after-tax inflation-adjusted income.

It does that by pointing labor and money at the highest-value bottlenecks, making the evidence easy to inspect, letting agents coordinate without collisions, and leaving an audit trail of what happened.

## What It Helps Agents Do

- Choose work: audit the queue, inspect task economics, and ask for the best next action.
- Understand context: search the manual, read task details, and inspect blockers before changing strategy.
- Inspect code and sites: search allowlisted GitHub repos, read repo files, list site pages, and fetch clean page text before proposing changes.
- Improve the queue: propose draft task bundles, set impact estimates, and add dependencies.
- Coordinate execution: acquire leases, heartbeat long-running work, release abandoned work, and log agent runs.
- Coordinate through comments: post task comments for status updates, questions, and agent notes. Comment posting handles comment notifications; low-level delivery envelopes are internal infrastructure.
- Report progress: complete claims, record actual effort/cost, and leave task comments.

## Example Uses

- "I can write TypeScript for two hours. What should I do next?"
- "Find every task and manual passage about Wefunder, then propose the missing tasks."
- "Before contacting this official, check whether communication is allowed and record what URL was opened."
- "Rank my feasible action options and explain why the selected one beats the next-best alternatives."
- "Create a private task for a user, add a probability-weighted value estimate, and ask for the next best action."
- "Look up the sourced parameter value behind this expected-value calculation once parameter tools are implemented."
- "Inventory every public page on `1percenttreaty.org`, then fetch the page copy before editing route metadata."
- "Search the Optimitron repo for the helper that owns a behavior before writing another one."

## Private Execution Protocol

For personal and organization planning, the MCP server is an expected-value task engine. The approved private-work loop is below; `FEATURES.md` and `/api/mcp/tools` remain authoritative about which tools have shipped:

1. `getMe` confirms OAuth identity, scopes, memberships, and stable private roots.
2. Create individual tasks or call `reviewPrivateTaskBundle` for an explicitly selected source batch.
3. Inspect every normalized action, duplicate, dependency, estimate, source anchor, and error. Apply the unchanged review with `applyPrivateTaskBundle`; private candidates become `ACTIVE`, never public proposals.
4. Audit with `getQueueAudit`, then ask `getNextAction` or `getExecutionPlan`.
5. Call `startTaskExecution`, coordinate through comments, and submit outputs with `submitTaskArtifact` and `submitTaskForVerification`.
6. An authorized human calls `verifyTaskExecution`. Acceptance alone sets the task to `VERIFIED`; rejection preserves history and requeues the task.
7. Repeat; dependents become available only after accepted verification.

`updateTask(status="VERIFIED")` is invalid. Claim and completion operations derive the actor from OAuth and never accept authority from a caller-supplied user ID.

The canonical score is `priority`:

```text
priority = (P(success) * value - cash_cost) / (hours + cash_cost / buybackRate)
```

The default `buybackRate` is `$1000/hr`. Dependencies decide what is available; `priority` ranks available tasks.

This is the canonical, live EV formula. The Notion prototype it replaced is
archived at [archive/EXPECTED_VALUE_DATABASE.md](./archive/EXPECTED_VALUE_DATABASE.md).

Use these fields when creating personal tasks:

- `hours`: expected user work hours, not calendar duration.
- `value`: gross conditional value if the task succeeds. For must-do tasks, include avoided downside.
- `p_success`: probability from `0` to `1`; the MCP layer computes expected value as `value * p_success`.
- `cash_cost`: dollars required to execute; defaults to `0`.
- `executor_type`: `Self` for normal user work, even if AI assists; `AI Agent` only for autonomous assistant work.
- `depends_on`: task IDs that must be `VERIFIED` before this task appears in queues.
- `available_at`: earliest ISO time the task should appear in active queues.
- `due_at`: due date or expiry date.
- `deadline_policy`: `NONE`, `SOFT`, `EXPIRES`, or `REQUIRED`.

Deadline policy rules:

- `NONE`: no deadline semantics.
- `SOFT`: useful scheduling metadata; does not change `priority`.
- `EXPIRES`: opportunity disappears after `due_at`, such as a grant or application.
- `REQUIRED`: must-do obligation, such as taxes, legal filings, medicine refills, or safety/health maintenance.

Do not use difficulty or urgency words as substitutes for estimates. If something is mandatory, encode the avoided downside in `value`, put the real due date in `due_at`, and use `deadline_policy: "REQUIRED"`. If something unlocks other work, use `depends_on`.

Recommended OAuth scope for a personal life-planning AI:

```text
tasks:personal
```

Do not request `tasks:admin` for personal planning. `tasks:admin` is reserved for admin users managing public Earth-level tasks. Public manual search and public task reads do not require OAuth permissions.

Add `tasks:organization` only for work in organizations where the user is an explicit member. Human approval clients may receive `actions:approve`; agent tokens may not.

Example private task:

```json
{
  "title": "File federal taxes",
  "hours": 3,
  "value": 20000,
  "p_success": 0.99,
  "cash_cost": 150,
  "expected_deliverable": "Accepted federal and state returns with filing receipts",
  "acceptance_criteria": [
    "Return totals match reviewed source documents",
    "Filing receipt is attached"
  ],
  "executor_type": "Self",
  "due_at": "2026-04-15T17:00:00-05:00",
  "deadline_policy": "REQUIRED",
  "deadline_rationale": "Avoid legal penalties, interest, and account disruption."
}
```

## Estimate Standards For Agents

For public Earth-level tasks, agents should use `setTaskImpact` when they know enough to estimate value. For private personal tasks, prefer `createTask` / `updateTask` with `hours`, `value`, `p_success`, and `cash_cost`. If an agent does not know enough to estimate value, it should create a clarification/decomposition task rather than inventing confidence.

- Use USD-equivalent welfare as the canonical unit. Health effects can be converted using sourced QALY/DALY assumptions; income and runway effects should already be in dollars.
- `expectedEconomicValueUsdBase` is already probability-weighted expected value. If an agent starts from a conditional payoff, it should store `P(success) * valueIfSuccessful`, not the gross payoff.
- Always include `estimatedEffortHoursBase`; add low/high bounds when the task is subjective or uncertain.
- Use low/base/high values for subjective estimates. A wide range is better than false precision.
- Include `successProbabilityBase` and, when possible, low/high probability bounds. Decompose probabilities into gates for revenue, outreach, or conversion tasks.
- Include `sourceUrls` and `assumptions` for high-value or subjective claims. Any estimate over `$10K/hr` should include a sanity-check assumption or citation.
- Use `delayEconomicValueUsdLostPerDayBase` only when there is a real deadline, expiry risk, or cost of delay. Do not use deadline multipliers as a substitute for evidence.
- Keep `Wish Points`, tokens, or other incentive signals separate from welfare value. They can route attention, but they are not the objective unit.
- For imported Notion-style rows, convert `Value`, `P(success)`, and `Hours` as: `value = Value`, `p_success = P(success)`, and `hours = Hours` for private personal tasks, or `expectedEconomicValueUsdBase = P(success) * Value`, `estimatedEffortHoursBase = Hours`, and `successProbabilityBase = P(success)` for public impact frames.

Example impact frame for a subjective but useful outreach task:

```json
{
  "taskId": "task_123",
  "frameKey": "ONE_YEAR",
  "frame": {
    "successProbabilityLow": 0.05,
    "successProbabilityBase": 0.2,
    "successProbabilityHigh": 0.4,
    "expectedEconomicValueUsdLow": 5000,
    "expectedEconomicValueUsdBase": 25000,
    "expectedEconomicValueUsdHigh": 80000,
    "estimatedEffortHoursLow": 0.5,
    "estimatedEffortHoursBase": 1,
    "estimatedEffortHoursHigh": 2
  },
  "sourceUrls": ["https://example.org/source"],
  "assumptions": [
    "Expected value is already probability-weighted.",
    "Conversion probability is based on a small audience and should be revisited after first responses."
  ],
  "calculationVersion": "agent-ev-v1"
}
```

## Naming Boundaries

Model ownership (Task / TaskCommunicationEndpoint / TaskComment /
TaskCommunication / EmailLog / Activity), lifecycle statuses, and write rules
are specified in [TASK_COMMUNICATION_MODEL.md](./TASK_COMMUNICATION_MODEL.md)
— the single owner of that contract. MCP-specific notes:

- User/agent comments are the normal MCP-facing coordination path. `TaskCommunication` rows are internal delivery/audit envelopes, not tools agents should call directly.
- Use `externalUrl` for opened office forms, public pages, and profiles. Do not call it `formSubmission` unless Optimitron actually verifies that a form was submitted.
- `TrackingReminder` is for health-variable measurement reminders, not task assignee contact or assignment.
- `ReferralInvitation` is the invite lifecycle. `ShareAttempt` is the exact outbound-message ledger.

## Private Resource Policy

- One task policy protects task rows, blockers, search and counts, comments, attachments, source artifacts, attempts, artifacts, verification, audit, export, and deletion.
- Authorization happens before lookup-derived disclosure, filtering, counting, and pagination. Outsiders receive the same response for missing and forbidden private resources.
- Public ancestry never grants private access. Personal ownership and explicit organization membership do.
- Platform admin status is not routine private access. Break-glass access is explicit and audited.
- Private conversation sources retain safe hashes, anchors, aliases, timestamps, approved excerpts, and model metadata; never unrestricted transcripts.

## Tool Groups

- Queue discovery: `listTasks`, `getTask`, `getBlockers`, `getQueueAudit`, `getNextAction`, `getMyQueue`, `getAIQueue`, `evaluateTaskEconomics`.
- Personal task management: `createTask`, `updateTask`, `deleteTask`.
- Reviewed private import: `reviewPrivateTaskBundle`, `applyPrivateTaskBundle`, `deletePrivateSourceSelection` (target contract; see OPT-INTG-03 status).
- Private execution: `startTaskExecution`, `submitTaskArtifact`, `submitTaskForVerification`, `verifyTaskExecution`, `getTaskAuditTrail` (target contract; see OPT-TASK-08 status).
- External approval: `proposeExternalAction`, `recordExternalActionResult`; human approval is performed only by an `actions:approve` client (target contract; see OPT-AGENT-02 status).
- Portability: `exportPrivateWork` (target contract; see OPT-TASK-08 status).
- Public Earth task management, admin-only: `proposeTaskBundle`, `setTaskImpact`, `addDependency`, `promoteTask`, `updateMilestone`, `recordTaskActuals`.
- Referendums: `listReferendums` for public active referendum inventory; `createReferendum` for admin-created draft referendum rows.
- Agent coordination: `acquireLease`, `heartbeatLease`, `releaseLease`, `logAgentRun`.
- Comments and comment notifications: `postTaskComment`, `getTaskComments`, `voteTaskComment`, `deleteTaskComment`.
- Knowledge: `searchManual`, `askWishonia`, `searchRepo`, `getFileContent`, `listRepoFiles`, `listSitePages`, `getPageContent`.
- Claims and actuals: `claimTask`, `completeTaskClaim`, `recordTaskActuals`.
- Task triggers (data-driven blueprints): `createTaskTrigger`, `updateTaskTrigger`, `disableTaskTrigger`, `listTaskTriggers`, `getTaskTrigger`, `fireTaskTrigger`. See "Task Trigger Framework" below.

Detailed tool schemas are exposed at `/api/mcp/tools`.

## Task Trigger Framework

`TaskTrigger` is a data-driven blueprint that fires on a named event and either spawns tasks, verifies a task on a completion gate, or spawns a communication. AI agents author triggers over MCP — no source-code commit, no deploy.

The schema is designed to absorb new patterns without migrations: `eventName`, `triggerKind`, and resolver keys are strings; `eventFilter`, `completionGate`, and `metadata` are JSON; templates use `{{path.to.field}}` substitution against the event context. Adding a new resolver kind or gate operator is a code change in `packages/web/src/lib/triggers/`, not a schema change.

**Worked example — talking to Claude to add a new onboarding subtask.**

> Primary Operator: "Add a subtask under the Humanity Management Training that asks the user to write a one-paragraph elevator pitch."

Claude:

```json
{
  "tool": "updateTaskTrigger",
  "args": {
    "triggerKey": "user-onboarding:treaty",
    "spawnSpecs": [
      /* ... existing specs ... */,
      {
        "kind": "elevatorPitch",
        "sortOrder": 25,
        "titleTemplate": "Write your 1% Treaty elevator pitch",
        "descriptionTemplate": "One paragraph. Why does the treaty matter? Who is harmed by inaction? Plain words.",
        "category": "OTHER",
        "estimatedEffortHours": 0.25,
        "ownerResolver": "actor",
        "assigneePersonResolver": "actor",
        "parentResolver": "trigger.parentSpec"
      }
    ]
  }
}
```

Then `fireTaskTrigger` with `dryRun: true` to verify the rendered preview before any commit. Re-run without `dryRun` to actually update the user's onboarding tree on the next signup.

**Triggers ship today:** `user-onboarding:treaty`, `referral:vote-invitation`, `treaty:signer-reminder`, `treaty:ratify`, `user-onboarding:treaty:hmt-gate`, `treaty:signer`, `task:overdue-reminder`. Run `listTaskTriggers` to see the live set in any deployment.

**Implementation:** `packages/web/src/lib/triggers/{template,resolvers,event-filter,completion-gate,fire,admin,context}.ts`. The schema lives in `packages/db/prisma/schema.prisma` (`TaskTrigger`, `TaskSpawnSpec`, `TaskCommunicationSpawnSpec`, `TaskTriggerFire`).

**Deploy requirement:** every production deploy MUST run `pnpm db:sync:managed-data -- --apply` AFTER `pnpm db:deploy` and BEFORE the new code goes live. The sync is idempotent (upsert on stable managed keys) and is wired into `db:setup` for local development. CI runs it automatically (see `.github/workflows/ci.yml`). If you add a new wired event source to the application code, ensure its corresponding trigger blueprint is managed — otherwise `fireTaskTriggersForEvent` will return `filteredOut` (trigger not found) and the layered behavior won't run.

**Parameter tokens:** every fired trigger context is augmented with `params.<slug>` values pre-resolved from `@optimitron/data/parameters`. The current set is in `packages/web/src/lib/triggers/context.ts` — extend that map when you need a new parameter in a template.

## Claude Code Task Handoff

Local Claude Code runs can use the stdio MCP server with a real Optimitron user identity:

```json
{
  "mcpServers": {
    "optimitron-tasks": {
      "command": "pnpm",
      "args": ["--filter", "@optimitron/web", "exec", "tsx", "scripts/mcp-task-server.ts"],
      "cwd": "E:/eos/optimitron",
      "env": {
        "MCP_USER_EMAIL": "you@example.com"
      }
    }
  }
}
```

For one-command AI-agent task pickup, run:

```bash
pnpm --filter @optimitron/web mcp:claude-task
```

That command reads `getAIQueue`, claims the top task, writes `.optimitron/claude-code-task-prompt.md`, and prints the finish command. Add `--execute` to launch the configured Claude CLI directly. `CLAUDE_CODE_COMMAND` defaults to `claude`; `CLAUDE_CODE_ARGS` defaults to `-p`.

When work is complete:

```bash
pnpm --filter @optimitron/web mcp:claude-task -- finish --task-id <task-id> --summary "Implemented and tested." --pr-url <url>
```

The finish command posts a task comment and completes the task claim. Use `--create-pr` if the local `gh` CLI should open the pull request; the PR title includes the task ID.
