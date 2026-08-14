# Optimitron System Map

Use this page to orient before loading package-level details. It describes ownership and boundaries, not feature maturity. `FEATURES.md` is the only maturity registry.

## Context Ladder

1. Read root `AGENTS.md` for repository rules and current mission priority.
2. Read `docs/PRD.md` for the product contract and `docs/ROADMAP.md` for sequencing.
3. Read `docs/FEATURES.md` before assuming anything ships.
4. Read the relevant architecture document from `docs/README.md`.
5. Read the nearest package `AGENTS.md`, package README, tests, and surrounding code before editing.

For private execution work, also read `docs/plans/phased-approach-optimitron.md`, `docs/TASK_MODEL.md`, and `docs/MCP_SERVER.md`.

For active development work, inspect the production `optimitron:dev` task
tree through the production MCP server before creating or changing a task.

## Product Boundary

Optimitron is durable optimization and execution state. It owns:

- Tasks and ancestry.
- Dependencies, eligibility, expected value, and queues.
- Identity, organizations, membership, and authorization.
- Source provenance and reviewed imports.
- Execution attempts, actuals, artifacts, verification, and audit.
- Exact human approval for consequential external actions.

Codex and Claude Code remain the conversational, reasoning, coding, connector, and browser clients. Do not duplicate their chat, terminal, coding-agent, connector, or general browser-control capabilities inside Optimitron.

The Chrome extension is the browser-facing Digital Twin Safe. It may capture only explicitly selected content, process raw private content locally, review derived work, and present exact outbound approvals. It is not a persistent scraper or second browser agent.

## Work Model

```text
optimize-earth
|-- public mission and campaign tasks
|-- Optimize <person>'s life
|   `-- objective/project/workflow container tasks
|       `-- executable task
`-- Optimize <organization>
    `-- objective/project/workflow container tasks
        `-- executable task
```

Every node is a `Task`. Meaning comes from ancestry, stable keys, ownership, and context. There is no `TaskKind` and no Objective, Project, or Workflow table.

A task is executable only when it is active, accessible to the actor, unblocked, executor-eligible, and has no unresolved child tasks. Reserved roots never execute. Public ancestry never grants access to private descendants.

The durable lifecycle is:

```text
reviewed source -> ACTIVE task -> execution attempt -> artifact submission
-> typed verification -> accepted outcome evidence and actuals
```

`DRAFT` is for public/governance proposals. Reviewed private actions become private `ACTIVE` tasks. Negative-EV actions remain stored but are not recommended unless they are genuine obligations or safety guardrails.

## Planning Source Of Truth

| Surface | Owns |
|---|---|
| `docs/PRD.md` | Target-state product contracts and acceptance stories. |
| `docs/FEATURES.md` | Current capability maturity and implementation evidence. |
| `docs/ROADMAP.md` | Strategic sequence, gates, and deliberately parked work. |
| Production [`optimitron:dev`](https://optimitron.com/tasks/cmrh79s7h000604jtqfckws4t) Task rows | Operational work, status, assignees, estimates, dependencies, and human decisions. |
| Task comments, documents, artifacts, commits, pull requests, and issues | Dated context, plans, execution evidence, review, and receipts linked to the owning task. |

Managed synchronization retains stable system roots and fixtures that must be
reproducible from code. Ordinary development children are runtime-created;
their status, comments, estimates, and edges are database-owned and must not
be reset by synchronization. Search by stable task key and title before
creating work, merge duplicates into the best existing task, and represent
dependencies with `TaskEdge`. Markdown files do not duplicate the tactical
queue.

## Runtime Ownership

| Surface | Primary location | Owns |
|---|---|---|
| Database contract | `packages/db/prisma/schema.prisma` | Canonical models, enums, relations, indexes. |
| Generated DB types | `packages/db/src/generated` and `@optimitron/db` exports | Prisma client for web only; pure types and validators for consumers. |
| Optimitron Web/API/MCP | `packages/web` | `optimitron.com` UI, REST, OAuth, MCP, authorization, server workflows, and temporary legacy host variants during cutover. |
| War on Disease campaign | `apps/warondisease` | Canonical rich campaign home and neobrutalist authenticated dashboard. |
| Satellite sites | `apps/dfda`, `apps/wishocracy`, `apps/trialabundancesurvey`, `apps/curedao`, `apps/acceleratedmedicine` | Brand-specific deployable entrypoints over shared packages. |
| Tracking engine | `packages/tracking` | Personal measurements, reminders, and notification tools. One implementation served by `optimitron.com/api/mcp` and `dfda.earth/api/mcp` (resource server; optimitron.com stays the OAuth issuer). Hosts inject the Prisma client. |
| Optimizer | `packages/optimizer` | Domain-agnostic causal and expected-value algorithms. No database runtime. |
| Data | `packages/data` | Parameters, datasets, and importers. No database runtime. |
| OPG/OBG/Wishocracy | `packages/opg`, `packages/obg`, `packages/wishocracy` | Domain engines above optimizer. |
| Agent | `packages/agent` | Background analysis/execution orchestration, not the user chat product. |
| Extension | `packages/extension` | Local health data, agenda, selected browser capture, review, approvals. |
| Storage | `packages/storage` | Storage abstractions used by authorized server workflows. |

Dependency direction is defined in root `AGENTS.md`. Library packages may import only type-only exports from `@optimitron/db`; they never import Prisma or server connections.

## Identity And Authorization

- `User` authenticates; `Person` is the durable human identity displayed and assigned to work.
- OAuth creates or repairs the `Person` before planning roots are created.
- Personal access derives from the authenticated user/person ownership relation.
- Organization access derives from explicit `OrganizationMember` role: owner, admin, member, or viewer.
- A single task policy must protect the task and all descendants: comments, attachments, source links, attempts, artifacts, verification, audit, search, counts, export, and deletion.
- Missing and forbidden private resources must be indistinguishable to outsiders.
- Platform admin status does not imply routine private access. Break-glass access must be explicit and audited.

## Source And Privacy Boundary

`SourceArtifact` stores provenance metadata. `TaskSourceArtifact` links a task to the source that grounded it. Private source records have exactly one user or organization owner.

For private conversations, retain channel, anchors, timestamps, aliases, hashes, approved excerpts, and extraction metadata. Raw selected text is handled in memory by the extension/local companion and sent only to a configured localhost model endpoint. No whole-account ingestion, ambient browser history, or identifier-only access to private payloads.

## Execution And Approval Boundary

`TaskExecutionAttempt` is the canonical execution record. Artifacts link attempts to existing private documents, revisions, attachments, external URLs, or structured results. Verification is append-only evidence against a snapshot of acceptance criteria and artifact hashes.

Only accepted verification may set a task to `VERIFIED`. Rejection preserves history and requeues the task. OAuth identity, never a caller-supplied `userId`, determines the human actor.

External actions use an immutable payload hash. Agents may propose and execute an already approved request but cannot approve it. Editing destination or payload creates a new request. Execution is idempotent and retains a receipt or failure.

## Change Checklist

Before changing behavior:

1. Find or create the canonical production development task and search for duplicates.
2. Find the canonical model/service and relevant tests.
3. Confirm feature maturity in `FEATURES.md`.
4. Check authorization before query, count, pagination, and child lookup.
5. Keep task and source provenance intact.
6. Add tests at the real policy or state-machine boundary.
7. Link the implementation and evidence from the production task.
8. Update `FEATURES.md` only after behavior ships; update the roadmap when sequencing changes.
9. For UI changes, follow the screenshot review gate in `AGENTS.md`.

## Canonical Documents

| Question | Owner |
|---|---|
| What is the product? | `docs/PRD.md` |
| What ships? | `docs/FEATURES.md` |
| What happens next? | `docs/ROADMAP.md` |
| What operational work is active now? | Production `optimitron:dev` task tree through the MCP server |
| How is private execution being built? | `docs/plans/phased-approach-optimitron.md` |
| What is the task lifecycle? | `docs/TASK_MODEL.md` |
| How do agents use the task server? | `docs/MCP_SERVER.md` |
| How do types flow? | `docs/TYPE_SYSTEM.md` |
| How do agents work in this repo? | `AGENTS.md` plus the nearest package `AGENTS.md` |
