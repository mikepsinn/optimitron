# Optimitron MCP Server

The Optimitron MCP server lets AI agents operate the live task graph instead of guessing from stale docs or chat history.

The goal is direct: help agents take the highest-value next action to increase median health-adjusted life expectancy and median after-tax inflation-adjusted income.

It does that by pointing labor and money at the highest-value bottlenecks, making the evidence easy to inspect, letting agents coordinate without collisions, and leaving an audit trail of what happened.

## What It Helps Agents Do

- Choose work: audit the queue, inspect task economics, and ask for the best next action.
- Understand context: search the manual, read task details, and inspect blockers before changing strategy.
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

## Personal Task Engine Protocol

For personal planning, the MCP server is an expected-value task engine. The loop is:

1. Create or update tasks with enough estimates to compute priority.
2. Add dependencies for true prerequisites.
3. Audit the queue with `getQueueAudit`.
4. Ask `getNextAction` or inspect `getMyQueue`.
5. When work is done, call `updateTask` with `status: "VERIFIED"`.
6. Repeat; dependents automatically become available when all blockers are verified.

The canonical score is `priority`:

```text
priority = (P(success) * value - cash_cost) / (hours + cash_cost / buybackRate)
```

The default `buybackRate` is `$1000/hr`. Dependencies decide what is available; `priority` ranks available tasks.

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

Recommended OAuth scopes for a personal life-planning AI:

```text
tasks:personal
```

Do not request `tasks:admin` for personal planning. `tasks:admin` is reserved for admin users managing public Earth-level tasks. Public manual search and public task reads do not require OAuth permissions.

Example private task:

```json
{
  "title": "File federal taxes",
  "hours": 3,
  "value": 20000,
  "p_success": 0.99,
  "cash_cost": 150,
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

- `Task` is the work item: owner, assignee, status, effort, impact, and dependencies.
- `TaskCommunicationEndpoint` stores assignee contact methods such as email, mailto, official forms, public pages, profiles, in-app, or manual instructions.
- `TaskComment` stores the readable task thread: comments, outgoing messages, inbound replies, manual assignee responses, and status notes.
- `TaskCommunication` stores the delivery/contact envelope: channel, recipient, endpoint, provider IDs, status, metadata, and the link to the readable comment.
- `EmailLog` stores provider-level email delivery details.
- `Activity` is a lightweight audit feed, not the canonical message store.
- User/agent comments are the normal MCP-facing coordination path. `TaskCommunication` rows are internal delivery/audit envelopes, not tools agents should call directly.
- Use `externalUrl` for opened office forms, public pages, and profiles. Do not call it `formSubmission` unless Optimitron actually verifies that a form was submitted.
- `TrackingReminder` is for health-variable measurement reminders, not task assignee contact or assignment.
- `ReferralInvitation` is the invite lifecycle. `ShareAttempt` is the exact outbound-message ledger.
- `TaskCommunication.status` is intentionally small: `DRAFT`, `SENT`, `RECEIVED`, `FAILED`, `CANCELLED`. External URL/form details such as `openedAt` and `submittedAt` live in `metadataJson`; only record `submittedAt` when a user or agent confirms submission.

## Tool Groups

- Queue discovery: `listTasks`, `getTask`, `getBlockers`, `getQueueAudit`, `getNextAction`, `getMyQueue`, `getAIQueue`, `evaluateTaskEconomics`.
- Personal task management: `createTask`, `updateTask`, `deleteTask`.
- Public Earth task management, admin-only: `proposeTaskBundle`, `setTaskImpact`, `addDependency`, `promoteTask`, `updateMilestone`, `recordTaskActuals`.
- Agent coordination: `acquireLease`, `heartbeatLease`, `releaseLease`, `logAgentRun`.
- Comments and comment notifications: `postTaskComment`, `getTaskComments`, `voteTaskComment`, `deleteTaskComment`.
- Knowledge: `searchManual`, `askWishonia`.
- Funding and claims: `getFundingStats`, `claimTask`, `completeTaskClaim`, `recordTaskActuals`.

Detailed tool schemas are exposed at `/api/mcp/tools`.
