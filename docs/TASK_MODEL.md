# Task Model

This document defines the approved invariants for the task system. `FEATURES.md` states which parts currently ship. A change that violates these rules is a schema or architecture change, not a routine feature edit.

## Core Identity

- `Person` is the canonical human record.
- `User` is an authenticated account that may link to a `Person` through `User.personId`.
- A `Person` may exist without any `User`. This is how public figures and non-signed-up assignees are represented.
- `Person.sourceRef` is the stable import key for non-email identities. It must be unique when present.

## Task Ownership

- `Task` is the only work-graph node. There is no task-kind discriminator and no separate objective, project, workflow, mission, or policy-task table.
- Objectives, projects, and workflows are ordinary container tasks identified by ancestry and context.
- `Task.assigneePersonId` points to the human the task is addressed to, if any.
- `Task.assigneeOrganizationId` points to the institution the task is addressed to, if any.
- A task may point to neither, one, or both. This covers pure public work, institution-addressed work, and person-in-institution accountability work.
- `Task.assigneeAffiliationSnapshot` is task-local snapshot data. It is not the live source of truth for a person’s current affiliation.
- `Person.currentAffiliation` is actor metadata. It may change over time.
- `Task.roleTitle` is task-facing display context, not a durable office-seat model.
- `Organization.sourceRef` is the stable import key for institution identities when present.

## Roots And Executability

- The single mission root is `optimize-earth` (`program:optimize-earth`).
- Each authenticated person lazily receives one private `planner:person:<personId>` root named `Optimize <person>'s life` directly beneath it.
- Each organization lazily receives one private `planner:organization:<organizationId>` root named `Optimize <organization>` directly beneath it.
- Public ancestry never grants access to a private task. Personal ownership and explicit organization membership are the access boundary.
- Reserved mission, personal, and organization roots never execute.
- Any task with unresolved child tasks is a container and never executes.
- An executable task is `ACTIVE`, accessible, unblocked, executor-eligible, and childless with respect to unresolved work.

## Claimability

- `ASSIGNED_ONLY`: public accountability item, not claimable by other users.
- `OPEN_SINGLE`: claimable, but only one active claimant at a time.
- `OPEN_MANY`: claimable by multiple users at once, optionally capped by `maxClaims`.

## Task Lifecycle

Task status is intentionally narrow:

- `DRAFT`: a public/governance proposal not yet live
- `ACTIVE`: available or pending
- `VERIFIED`: accepted as complete
- `STALE`: superseded by source or no longer current

Reviewed private source actions are created directly as private `ACTIVE` tasks. There is no separate long-lived `COMPLETED` task state. Only accepted verification may move a task to `VERIFIED`; generic update paths may not set it.

### Personal Self-Completion

The authenticated creator may self-attest a private, uncompensated `Self` task with `completeTask`. The shortcut is limited to a childless, unblocked personal task that is unassigned or assigned only to the creator, has no claim, application, payout, manager, or execution history, and has no active agent lease. It records evidence and moves the task directly to `VERIFIED`, which is the resolved task state.

Delegated, shared, paid, public, organization, and agent work stays on the artifact-and-verification lifecycle. `completeTaskClaim` completes only one worker's claim; it does not resolve the task.

## Deadlines

- `Task.dueAt` is the first-class accountability deadline / target date field.
- Ranking logic may use `dueAt`, but the schema does not force any particular overdue formula.
- If a task needs a soft, explanatory date without query semantics, keep it in `contextJson` instead.

## Claim Lifecycle

Claim status is more expressive than task status because claims represent user workflow:

- `CLAIMED`
- `IN_PROGRESS`
- `COMPLETED`
- `VERIFIED`
- `REJECTED`
- `ABANDONED`

Claims coordinate public or multi-claimant work. `TaskExecutionAttempt` is the canonical record for formal execution; the narrow personal `completeTask` shortcut records evidence directly on the task. The formal execution workflow is:

- `ACTIVE task -> RUNNING attempt -> submitted attempt -> accepted or rejected verification`

Acceptance verifies the task and releases dependents. Rejection preserves the attempt, artifacts, criteria snapshot, and verdict, then requeues the task for a new attempt. `ABANDONED` and `REJECTED` claim states remain useful for claim coordination without deleting history.

For `OPEN_SINGLE`, accepting the completed claim also verifies the task in the same transaction and releases its dependents. `OPEN_MANY` represents independent contributions, so accepting one claim does not close the shared task. `maxClaims` limits simultaneous claims; it is not a completion target. Use `ASSIGNED_ONLY` for work addressed to a named person or organization, `OPEN_SINGLE` for ordinary one-off claimable work, and `OPEN_MANY` only when more accepted contributions should remain possible.

## Provenance

- `TaskSourceArtifact` describes where the task came from.
- `TaskImpactSourceArtifact` describes where the impact estimate came from.
- These are intentionally separate. Do not collapse them.
- `SourceArtifact.sourceKey` is the canonical upstream artifact identity.
- A private source artifact has exactly one user or organization owner. Identifier knowledge never grants payload access.
- Private conversation provenance stores safe metadata, anchors, hashes, and explicitly approved excerpts, not unrestricted transcripts.

## Artifacts And Verification

- `TaskExecutionArtifact` links one attempt to existing private content, an attachment, an external URL, or a structured result and stores an immutable content hash.
- `TaskVerification` appends deterministic, rule-based, reviewer, or outcome evidence against snapshotted acceptance criteria and artifact hashes.
- Agents may submit work but cannot grant their own human approval. OAuth identity, not caller-supplied user IDs, determines the human actor.
- Later outcome observations do not rewrite the original deliverable verdict.

## Impact Estimates

- `Task.currentImpactEstimateSetId` is the canonical pointer to the estimate currently used by APIs and ranking.
- `TaskImpactEstimateSet.isCurrent` is denormalized query state and must stay in sync with the task pointer.
- `TaskImpactFrameEstimate` stores frame-specific rolled-up values.
- `TaskImpactMetric` stores extensible per-frame metrics that should not force schema churn.

## Ranking Semantics

- The schema stores impact channels and fit inputs.
- The schema does not freeze ranking formulas.
- DALY-vs-USD weighting belongs in application logic, not schema.

## When To Add New Fields

Add a first-class column only if one of these is true:

- the value is part of a stable invariant
- the value is used for filtering, joining, or uniqueness
- the value must be queried often enough that hiding it in JSON is a mistake

Otherwise prefer:

- `contextJson` for task-local structured details
- `TaskImpactMetric` for new impact outputs
- `SourceArtifact.payloadJson` for access-controlled safe upstream metadata, never unrestricted private transcripts
