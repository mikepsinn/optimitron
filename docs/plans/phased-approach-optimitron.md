# Phased Optimitron Private Execution System

Status: approved implementation plan  
Personas: Primary Operator for first-party dogfood; Independent Operator for tenant-isolation acceptance
Exit gate: each operator imports 25-50 real tasks and closes 10 verified task cycles

## Summary

Optimitron will become a practical execution system for private work by hardening and connecting its existing task graph, expected-value ranking, MCP tools, execution attempts, comments, content, organizations, and audit machinery. It will not reproduce Asana, Notion, Huly, Jira, ClickUp, Codex, or Claude Code.

Locked decisions:

- Delete `TaskKind` completely. There is no compatibility layer or dual read.
- Every work node is a `Task`. Objectives, projects, and workflows are represented by task ancestry, not separate types.
- Tasks with unresolved children are containers and cannot enter execution queues. Reserved mission, personal, and organization roots are always non-executable.
- Lazily create `Optimize <person>'s life` and `Optimize <organization>` roots directly beneath `optimize-earth`. Access derives from ownership and membership, never public ancestry.
- After an explicitly selected source batch is reviewed, every grounded, nonduplicate possible action becomes a private `ACTIVE` task. Ambiguity becomes a clarification task. `DRAFT` remains for public/governance proposals.
- Store all actions, but recommend only positive net-EV work except genuine obligations and safety guardrails.
- Codex and Claude Code remain the chat, reasoning, coding, connector, browser, and execution clients. Optimitron owns durable tasks, provenance, EV, permissions, approval, verification, and audit.
- The Chrome extension becomes the browser-facing Digital Twin Safe. Raw private content is captured by explicit user action and processed locally; it is not a second browser-control agent.
- Use GPT-5.6 Sol Ultra for architecture, authorization, schema, and adjudication. Use lower-cost capable models for bounded implementation. Use local `gpt-oss-20b` at high reasoning for raw private extraction, with a benchmarked smaller fallback.
- Success requires separate Primary Operator and Independent Operator passes: each imports 25-50 real tasks and closes 10 verified task cycles while recording every friction point.

## Implementation Checkpoint - July 16, 2026

Branch: `feature/private-execution-system`

This branch is a durable handoff, not a deployable release. `docs/FEATURES.md` owns the current maturity label.

Present in the branch:

- The approved architecture and agent context ladder are committed in `docs/SYSTEM_MAP.md`, this plan, `docs/TASK_MODEL.md`, and `docs/MCP_SERVER.md`.
- The Prisma schema and migration remove `TaskKind`, add organization roles and private source ownership, and add execution artifacts, typed verification, and immutable external-action requests.
- MCP OAuth includes personal, organization, and human approval scopes. New MCP definitions and service implementations cover reviewed private bundles, execution lifecycle, task audit, external-action requests, export, and private-source deletion.
- Task and source visibility code has been expanded, personal and organization planning roots have stable keys, and generic task updates can no longer set `VERIFIED`.
- Public Earth Optimization Services identity uses the filed name `Earth Optimization Services Inc.`, the public contact `wishonia@optimitron.com`, and the public mailing address. War on Disease remains attributed to Accelerated Medicine Foundation Inc.

Checks completed before this checkpoint:

- `pnpm --filter @optimitron/db build` passed.
- Forty-nine focused database and web tests passed across managed task triggers, site structured data, messaging, email signatures, and task-comment email.
- Focused linting reported no errors. Existing warnings remain.

Required continuation work, in order:

1. Regenerate Prisma and all generated schema/type documentation, then make the web app and test TypeScript checks pass. The interrupted branch currently reports generated Prisma/OAuth organization-scope mismatches plus pre-existing React, chart, and icon errors; do not deploy around them.
2. Add adversarial owner/admin/member/viewer/outsider tests for every task child, aggregate, audit, export, and deletion path. Add state-machine and transaction tests for private bundles, attempts, artifacts, verification, and external-action replay/mutation/expiry.
3. Apply the migration to a disposable production-shaped database, verify data translation and constraints, and write the production backup/preflight report before any production schema change.
4. Finish the extension Capture, Review, and Approvals surfaces plus the local companion. The branch changes extension OAuth scopes but does not implement PA-06.
5. Capture and inspect screenshots for the OAuth organization consent and public legal-identity surfaces. This checkpoint was requested before that review; visual and copy acceptance is still required before merge.
6. Run the Primary Operator private alpha, record every friction item, then run the Independent Operator isolation acceptance. Neither pilot has started.
7. Check CI and automated review on the pull request, fix only valid failures, and keep the pull request unmerged for human review.

## Product Boundary

The durable object chain is:

```text
Organization -> Task ancestry -> Execution -> Artifact -> Verification -> Outcome evidence
```

The executor chain is:

```text
Person or Agent -> Capability -> Availability -> Cost -> Performance history
```

For the alpha, task ancestry carries objective, project, and workflow meaning. Existing people, users, organizations, agents, task tags, attempts, and actuals carry the executor contract. Do not add generalized ontology models until repeated use proves a database invariant.

Codex and Claude Code own conversational interaction, source connectors they already provide, reasoning, coding, and browser control. Optimitron owns the durable cross-client state and policy boundary. The extension owns explicit browser capture, local private extraction, review, and exact outbound approval. It does not compete with coding agents or become a general browser automation product.

## Architecture And Gaps

| Area | Reuse | Required work |
|---|---|---|
| Work graph | `Task`, `TaskEdge`, `TaskTrigger`, task roots | Remove `TaskKind`; enforce graph-derived atomicity and stable personal/organization roots. |
| EV and queue | Impact estimates, `rank-tasks`, planner, queue audit, next action | Exclude roots, containers, and pending-verification work; retain negative-EV tasks without recommending them. |
| MCP | OAuth/PKCE, `getMe`, CRUD, proposal bundles, comments, claims, queues | Harden actor identity; add private organization scopes, reviewed private imports, artifacts, verification, approvals, audit, and export. |
| Privacy | `isPublic`, organization membership, task visibility, content grants | Create one authorization policy for tasks and every child resource; prevent existence and count leaks. |
| Provenance | `SourceArtifact`, `TaskSourceArtifact`, Notion import patterns | Give private sources owners and visibility; store message hashes and anchors, not unrestricted transcripts. |
| Execution | `TaskExecutionAttempt`, claims, leases, actual costs and duration | Make attempts canonical; link artifacts and verification results. |
| Content | Documents, revisions, private attachments, comments | Reuse as deliverables; avoid building another document workspace. |
| Extension | Local health tracking, on-device causal analysis, OAuth agenda | Correct stale docs; add selected capture, local extraction, review, and human approval. |
| Documentation | `AGENTS.md`, docs map, PRD, feature registry, roadmap | Add a concise system map, remove contradictions, and make `CLAUDE.md` import `AGENTS.md`. |

Immediate security defects to close before private ingestion:

- `updateTask` must not set `VERIFIED`; only verification acceptance may do so.
- Claim and completion operations must derive the actor from OAuth, never trust an arbitrary `userId`.
- `getBlockers`, search, counts, comments, attachments, source artifacts, attempts, and audit events must apply the same task policy.
- Platform admins must not browse private work by default. Break-glass access must be explicit and audited.
- Private source payloads must never be accessible merely because their identifiers are known.

Canonical mapping:

| Target concept | Repository representation |
|---|---|
| Organization | Existing `Organization` and `OrganizationMember`. |
| Objective, project, workflow | Ordinary container tasks. |
| Task | Executable only when active, accessible, unblocked, eligible, and without unresolved children. |
| Execution | `TaskExecutionAttempt`. |
| Artifact | New execution-to-existing-content link. |
| Verification | New typed record. |
| Outcome | Existing measurements, actuals, comments, and impact observations until repeated use proves a separate model necessary. |
| Executor | Existing person, user, organization, and `AgentExecutor` records. |

## Phases And Exit Gates

| Phase | Deliverable and exit gate |
|---|---|
| 0: Preparation | Update agent documentation; baseline tests; export relevant production rows; remove `TaskKind`; centralize access control; close impersonation and verification bypasses. |
| 1A: Primary Operator private alpha | Create the operator's personal root and applicable organization roots; review selected recent sources; import 25-50 active tasks; close 10 cycles including two agent tasks, two dependency chains, one rejection/resubmission, and one approved outbound action. |
| 1B: Independent Operator acceptance | A separate user connects independently through production MCP; creates three real work-domain containers; imports 25-50 tasks; closes 10 cycles; and proves the two operators cannot infer each other's private data. |
| 2: Commercial kernel | Finish organization roles, private source ownership, export/deletion, assignee notifications, audit retrieval, and provider-neutral MCP onboarding. |
| 3: Verification | Expand reviewer verification to deterministic, rule-based, and outcome-based checks; add criterion snapshots, artifact hashes, and robust rejection history. |
| 4: Design partner | Give Triangle Direct Media one bounded project slice without migrating its company; test membership, selected import, queue, artifact, approval, and export. |
| 5: Paid pilot | Use existing compensation, listing, and application fields for a small paid verified-work pilot. Do not create an open marketplace. |

## Dogfood Runbook

1. OAuth sign-in creates or repairs the user's `Person` before any planning root.
2. `getMe` returns identity, granted scopes, memberships, personal root, organization roots, and setup gaps.
3. Connect the production MCP server with `tasks:personal`; add `tasks:organization` only for organization work.
4. Represent Viral Vitalism, Optimitron productization, and Vaultanium as container tasks under the appropriate personal or organization root.
5. Review a bounded source batch. Apply all valid candidates atomically as private `ACTIVE` tasks with source links, estimates, criteria, dependencies, and idempotent keys.
6. Run `getQueueAudit`, repair invalid estimates or cycles, then use `getExecutionPlan` and `getNextAction`.
7. Start an execution attempt, coordinate through comments, submit artifacts and actuals, verify or reject, and repeat.
8. Record friction in a private fixed-schema collection: stage, severity, expected behavior, actual behavior, evidence, workaround, and linked resolution task.

The Primary Operator's ten cycles must include two agent-executable tasks, two dependency chains, one rejection and resubmission, and one approved outbound action. The Independent Operator repeats the import and ten-cycle test without admin scope. Automated and manual probes must prove that neither operator can infer the other's private task existence, counts, comments, sources, artifacts, attempts, verification, or audit records.

Pilot telemetry:

- Import review duration and apply result.
- Time from connection to first valid next action.
- Task cycle time, actual cost, and actual duration.
- Verification method, rejection rate, and resubmission count.
- Missing estimates, dependency cycles, duplicate candidates, and authorization denials.
- Every friction event's stage, severity, expected and actual behavior, evidence, workaround, and linked resolution task.

## Conversation To Work

### Existing foundation

`SourceArtifact` and `TaskSourceArtifact` provide stable provenance. The Notion importer and proposal-bundle code provide normalization, validation, dry run, idempotency, and apply patterns. There is no safe channel-neutral private-source ownership policy yet, and no direct WhatsApp, Discord, Telegram, or email ingestion abstraction that should be trusted with ambient access.

### Smallest useful path

1. The user explicitly selects visible messages or a bounded export. No account-wide watcher or ambient history permission is allowed.
2. The extension or local companion parses the selection in memory and sends it only to a configured localhost OpenAI-compatible endpoint.
3. Local extraction returns candidate actions, decisions, blockers, commitments, follow-ups, source anchors, confidence, and unresolved fields.
4. The review screen shows the exact selected source and every derived candidate. All grounded action candidates are selected by default; the user may reject or correct them before apply.
5. Only actions become tasks. Decisions remain source context. Actionable blockers become tasks or dependency edges. Ambiguity creates a clarification task.
6. The server receives channel, stable anchors, timestamps, participant aliases, content hashes, approved excerpts, derived candidates, and model metadata. It does not receive the unrestricted transcript.
7. Duplicate candidates link the new source to the existing task. Invalid candidates block the atomic apply instead of silently disappearing.
8. Source deletion removes approved excerpts and retained local staging while preserving a non-sensitive tombstone hash for already-created task provenance.

This channel-neutral envelope later supports Slack, email, meeting notes, Notion comments, and GitHub discussions. First-party Codex or Claude connectors may be used only for sources the user explicitly marks cloud-allowed. Never use Discord self-bots, consumer credential resale, or unreviewed whole-account ingestion.

## Approved Data Model Changes

Approval of this plan is explicit approval for exactly these Prisma and exported-type changes. Any additional schema concept requires separate human approval.

- Drop `Task.kind` and `TaskKind`. Translate only unambiguous existing bounty and volunteer compensation defaults before dropping; do not retain legacy APIs.
- Convert `OrganizationMember.role` to `OWNER | ADMIN | MEMBER | VIEWER`.
- Extend `Task.contextJson` validation with `expectedDeliverable`; retain structured `acceptanceCriteria`.
- Extend `SourceArtifact` with `ownerUserId`, `ownerOrganizationId`, and `isPublic`. Private artifacts require exactly one owner and contain only safe metadata, hashes, anchors, and approved excerpts.
- Add `TaskExecutionArtifact`: execution attempt, existing document revision, attachment, comment attachment or external URL, hash, submitter, metadata, timestamps.
- Add `TaskVerification`: attempt, method (`DETERMINISTIC | RULE_BASED | REVIEWER | OUTCOME`), result, criterion results, evidence, reviewer, timestamps.
- Add `ExternalActionRequest`: task or attempt, operation, destination, immutable payload and hash, requester, status, expiry, human approver, execution receipt, and idempotency key.
- Do not add Objective, Project, Workflow, Outcome, IngestionCandidate, Capability, or FrictionEvent models.

Migration strategy:

1. Back up and audit production rows before deploy.
2. Translate unambiguous task compensation defaults and organization roles in SQL.
3. Add private-source ownership constraints, new execution models, indexes, and foreign keys in the same migration.
4. Regenerate Prisma and Zod exports; remove all `kind` inputs, outputs, filters, fixtures, and generated references.
5. Deploy schema and compatible code atomically. There is no compatibility shim or dual read.
6. Preserve task IDs, URLs, ancestry, public campaign behavior, and managed-data keys.

## MCP And API Contract

Reuse `getMe`, `createTask`, `proposeTaskBundle` for public drafts, `getMyQueue`, `getNextAction`, `getExecutionPlan`, `getQueueAudit`, comments, dependencies, claims, leases, triggers, documents, and collections.

Add or change:

| Tool | Contract | Permission |
|---|---|---|
| `getMe` | Return identity, granted scopes, memberships, stable personal root, organization roots, and setup gaps. | Authenticated user. |
| `reviewPrivateTaskBundle` | Input selected safe source metadata and candidates. Return `reviewHash`, root, normalized create/update/duplicate sets, hierarchy, dependency validation, and errors. No writes. | `tasks:personal` or `tasks:organization` plus target access. |
| `applyPrivateTaskBundle` | Recompute and verify `reviewHash`; atomically create valid private `ACTIVE` tasks, update allowed existing tasks, link source provenance, and return one audit event. | Same actor and target as review; idempotency key required. |
| `startTaskExecution` | Create the canonical attempt from an accessible, executable task and authenticated executor. | Eligible assignee, member, or authorized agent. |
| `submitTaskArtifact` | Link an existing private document revision, content attachment, comment attachment, external URL, or structured result to an attempt with a hash. | Attempt executor or task manager. |
| `submitTaskForVerification` | Snapshot criteria and artifacts, record actuals, and place the attempt in review. | Attempt executor or task manager. |
| `verifyTaskExecution` | Append typed criterion results and evidence; acceptance alone verifies the task; rejection retains history and requeues it. | Authorized human reviewer; agent tokens cannot self-approve. |
| `getTaskAuditTrail` | Return policy-filtered lifecycle events, attempts, artifacts, verification, source links, comments, and approvals. | Any actor who can read the task. |
| `proposeExternalAction` | Hash and store exact operation, destination, and immutable payload for review. | Authorized task actor. |
| `recordExternalActionResult` | Execute only a non-expired human-approved hash once and retain the receipt or failure. | Executing client; separate human approval required. |
| `exportPrivateWork` | Return a scoped export of accessible tasks and children. | Personal owner or organization owner/admin. |
| `deletePrivateSourceSelection` | Delete approved excerpts/staging under the retention policy while retaining safe tombstone provenance. | Source owner or organization owner/admin. |

Remove `kind` from every task tool, filter, DTO, generated validator, managed-data record, and UI component. `updateTask(status=VERIFIED)` is invalid. Claim and completion tools derive the actor from OAuth. Add `tasks:organization`; reserve `actions:approve` for the authenticated human UI or extension. MCP, REST, background jobs, and UI loaders must call the same authorization policy before filtering, counting, pagination, or child-resource lookup.

## Minimal User Surfaces

- Keep chat, connector access, coding, and browser control in Codex or Claude Code.
- Extend task detail only with provenance, attempts, artifacts, verification, approvals, and audit.
- Keep one dense queue and next-action surface with root, owner, executor, blocker, due date, and verification filters.
- Add reviewed private task import and a private fixed-schema friction collection.
- Extension tabs are Agenda, Capture, Review, and Approvals.
- Approval shows the exact immutable payload and destination. Editing creates a new request and hash.
- Reuse existing organization membership administration.
- Do not build kanban, Gantt, sprint, generic document, agent-chat, terminal, connector, or browser-automation products.

## Verification Model

Reviewer verification is the Phase 1 default. Each submission snapshots criteria and artifact hashes so later edits cannot change the basis of a verdict.

- `DETERMINISTIC`: a command, test, checksum, exact field, or machine predicate proves completion.
- `RULE_BASED`: a versioned set of explicit predicates combines deterministic and metadata checks.
- `REVIEWER`: an authorized human accepts or rejects criterion-level evidence and artifacts.
- `OUTCOME`: a later observed result records whether the work produced its intended effect without delaying normal deliverable acceptance.

Acceptance verifies the task and releases dependents. Rejection preserves the attempt, verification, evidence, and criteria snapshot, then makes the task actionable for a new attempt. Self-review is permitted for low-risk Primary Operator alpha tasks and marked `selfReviewed`; Independent Operator and design-partner work uses an independent reviewer when another member is available. Payments, external claims, security/privacy changes, and partner deliverables always require a different human reviewer.

## Engineering Work Packages

| ID | Work and modules | Dependencies | Acceptance, tests, and risk |
|---|---|---|---|
| PA-00 | Rewrite agent docs and plan: `AGENTS.md`, `CLAUDE.md`, `docs/SYSTEM_MAP.md`, docs map, PRD, FEATURES, ROADMAP, TASK_MODEL, MCP_SERVER, extension README. | None. | New agents receive one accurate context ladder; docs distinguish shipped state from target state; links and stale-contract checks pass. Low. |
| PA-01 | Remove `TaskKind`: Prisma, Zod exports, managed sync, MCP schemas, planner/ranker, eligibility, source normalization, components. | PA-00. | `rg TaskKind` finds no runtime/type references; migration, DB generation, package tests, and typecheck pass. Medium. |
| PA-02 | Central task authorization policy covering every task child and aggregate. | PA-01. | Full owner/admin/member/viewer/outsider matrix across MCP and REST; private missing and forbidden are indistinguishable. Adversarial integration tests. High. |
| PA-03 | Stable personal/organization roots and graph-derived atomicity in MCP/planner services. | PA-02. | Concurrent onboarding creates one correctly named private root; roots and unresolved containers never enter queues. Concurrency and ranking tests. Medium. |
| PA-04 | Private bundle review/apply and scoped source artifacts using existing proposal/import helpers. | PA-02, PA-03. | Hash-sealed review, idempotent atomic apply, source linking, cycle rejection, active task creation, no raw transcript persistence. Transaction tests. High. |
| PA-05 | EV and queue corrections in ranker, execution planner, and audits. | PA-01, PA-04. | All tasks retained; only positive net-EV or explicitly required obligations are recommended; low/base/high assumptions visible. Pure and integration tests. High. |
| PA-06 | Digital Twin capture and local companion in the extension. | PA-04. | Selected-content/file import, local-only extraction, review, zero unapproved network egress, approved bundle upload. Unit and Chrome integration tests. High. |
| PA-07 | Canonical attempts, execution artifacts, and typed verification. | PA-02. | Completion awaits verification; acceptance verifies task; rejection retains attempt and requeues task; criteria and artifacts are immutable snapshots. State-machine tests. High. |
| PA-08 | Exact external-action approval and extension approval UI. | PA-02, PA-07. | Agent cannot approve; payload mutation invalidates approval; one execution per idempotency key; receipt retained. Security and state tests. High. |
| PA-09 | Organization scope, roles, notifications, export/deletion, and audit. | PA-02, PA-03. | The Independent Operator works without admin scope; tenant isolation, assignment/verification notices, complete export, and deletion policy pass. Integration tests. High. |
| PA-10 | Primary and Independent Operator pilots plus friction conversion. | PA-04 through PA-09. | Both pilot gates pass; every friction item links to a backlog task or documented rejection; metrics and residual failures are published privately. End-to-end manual and automated checks. Medium. |

## Rollout And Required Tests

- Deploy schema and code atomically after a backup and preflight report. Regenerate Prisma/Zod exports and run `pnpm check`; no compatibility shim remains.
- Test tenant isolation across task details, search, counts, blockers, comments, attachments, sources, artifacts, attempts, verification, audit, export, and deletion.
- Test import idempotency, source-hash changes, duplicate linking, malformed candidates, parent/dependency cycles, batch rollback, and negative-EV retention.
- Test outbound approval expiry, payload mutation, replay, rejection, failed execution, and receipt recording.
- Run extension typecheck/tests and a browser test proving raw selected text is sent only to the local companion.
- Capture screenshots for changed UI and obtain the human owner's approval before committing UI changes.

## Risks And Non-Goals

- Do not build an open marketplace, full project-management suite, custom model gateway, custom coding agent, general browser controller, credential-sharing system, or mandatory migration from external tools.
- Do not make Vaultanium the strategic center or ingest private conversations without explicit selection and review.
- Do not enable Discord self-bots or resale/share consumer AI credentials.
- Subscription inference stays inside first-party Codex and Claude clients. Background Optimitron processing uses local inference or separately authorized APIs.
- Platform admin access is not a privacy shortcut. Break-glass access is explicit, time-bounded, reasoned, and audited.
- Extraction may hallucinate. Preserve source anchors and confidence, validate every candidate, and require review before task creation.
- Priority estimates are uncertain. Preserve ranges and assumptions; use clarification tasks instead of fabricated precision.
- Both operator pilots require distinct real identities and explicitly selected private source batches. Implementation is not complete until those operational exit gates run.
