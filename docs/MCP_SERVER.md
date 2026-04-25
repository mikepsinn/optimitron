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
- "Rank tasks by USD/hour once optimization-rate sorting is implemented."
- "Look up the sourced parameter value behind this expected-value calculation once parameter tools are implemented."

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
