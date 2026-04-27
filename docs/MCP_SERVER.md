# Optimitron MCP Server

The Optimitron MCP server lets AI agents operate the live task graph instead of guessing from stale docs or chat history.

The goal is direct: help agents take the highest-value next action to increase median health-adjusted life expectancy and median after-tax inflation-adjusted income.

It does that by pointing labor and money at the highest-value bottlenecks, making the evidence easy to inspect, letting agents coordinate without collisions, and leaving an audit trail of what happened.

## What It Helps Agents Do

- Choose work: audit the queue, inspect task economics, and ask for the best next action.
- Understand context: search the manual, read task details, and inspect blockers before changing strategy.
- Improve the queue: propose draft task bundles, set impact estimates, and add dependencies.
- Coordinate execution: acquire leases, heartbeat long-running work, release abandoned work, and log agent runs.
- Contact assignees: check task communication cooldowns before opening a mailto link, office form, public contact page, or official profile, then record the readable thread comment and communication envelope.
- Report progress: complete claims, record actual effort/cost, and leave task comments.

## Example Uses

- "I can write TypeScript for two hours. What should I do next?"
- "Find every task and manual passage about Wefunder, then propose the missing tasks."
- "Before contacting this official, check whether communication is allowed and record what URL was opened."
- "Rank my feasible action options and explain why the selected one beats the next-best alternatives."
- "Create a private task for a user, add a probability-weighted value estimate, and ask for the next best action."
- "Look up the sourced parameter value behind this expected-value calculation once parameter tools are implemented."

## Estimate Standards For Agents

Agents should use `setTaskImpact` when they know enough to estimate value. If they do not, they should create or rank a `DECOMPOSE`, `DE_RISK`, or `QUEUE_REPAIR` action rather than inventing confidence.

- Use USD-equivalent welfare as the canonical unit. Health effects can be converted using sourced QALY/DALY assumptions; income and runway effects should already be in dollars.
- `expectedEconomicValueUsdBase` is already probability-weighted expected value. If an agent starts from a conditional payoff, it should store `P(success) * valueIfSuccessful`, not the gross payoff.
- Always include `estimatedEffortHoursBase`; add low/high bounds when the task is subjective or uncertain.
- Use low/base/high values for subjective estimates. A wide range is better than false precision.
- Include `successProbabilityBase` and, when possible, low/high probability bounds. Decompose probabilities into gates for revenue, outreach, or conversion tasks.
- Include `sourceUrls` and `assumptions` for high-value or subjective claims. Any estimate over `$10K/hr` should include a sanity-check assumption or citation.
- Use `delayEconomicValueUsdLostPerDayBase` only when there is a real deadline, expiry risk, or cost of delay. Do not use deadline multipliers as a substitute for evidence.
- Keep `Wish Points`, tokens, or other incentive signals separate from welfare value. They can route attention, but they are not the objective unit.
- For imported Notion-style rows, convert `Value`, `P(success)`, and `Hours` as: `expectedEconomicValueUsdBase = P(success) * Value`, `estimatedEffortHoursBase = Hours`, and `successProbabilityBase = P(success)`.

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
- User/agent-opened channels such as `mailto:` links, official office forms, public contact pages, or public profiles create `TaskCommunication` rows and may also write `ActivityType.CONTACTED_ASSIGNEE`.
- Use `externalUrl` for opened office forms, public pages, and profiles. Do not call it `formSubmission` unless Optimitron actually verifies that a form was submitted.
- `TrackingReminder` is for health-variable measurement reminders, not task assignee contact or assignment.
- `ReferralInvitation` is the invite lifecycle. `ShareAttempt` is the exact outbound-message ledger.
- `TaskCommunication.status` is intentionally small: `DRAFT`, `SENT`, `RECEIVED`, `FAILED`, `CANCELLED`. External URL/form details such as `openedAt` and `submittedAt` live in `metadataJson`; only record `submittedAt` when a user or agent confirms submission.

## Tool Groups

- Queue discovery: `listTasks`, `getTask`, `getBlockers`, `getQueueAudit`, `getNextAction`, `evaluateTaskEconomics`.
- Task improvement: `proposeTaskBundle`, `updateTask`, `setTaskImpact`, `addDependency`, `promoteTask`.
- Agent coordination: `acquireLease`, `heartbeatLease`, `releaseLease`, `logAgentRun`.
- Task communications: `checkTaskCommunicationCooldown`, `recordTaskCommunication`.
- Knowledge: `searchManual`, `askWishonia`.
- Funding and claims: `getFundingStats`, `claimTask`, `completeTaskClaim`, `recordTaskActuals`.
- Comments: `postTaskComment`, `getTaskComments`, `voteTaskComment`, `deleteTaskComment`.

Detailed tool schemas are exposed at `/api/mcp/tools`.
