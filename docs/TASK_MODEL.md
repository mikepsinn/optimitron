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

Claims coordinate public or multi-claimant work. `TaskExecutionAttempt` is the canonical record for each real execution. The execution workflow is:

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

## Documents, Review, And Decisions

- A task is the knowledge and coordination hub: brief, assignment, comments, funding, artifacts, verification, and audit. Put substantial authoritative text in a `Document`; ordinary task descriptions are concise briefs and are not versioned.
- A formal review is one private `ASSIGNED_ONLY` child task for one reviewer. Its Zod-validated `optimitron.review-request.v1` context pins the exact document ID, revision ID, version, and content hash plus instructions, checklist, and required/advisory status. A service-issued binding hash also freezes the requester, assignee, authority task, access policy, and request; generic task editing and execution cannot mutate or complete the review.
- The assigned reviewer can read the pinned revision through the review-task authorization path. That grant does not reveal sibling reviews, the private parent tree, the canonical document history, or later revisions.
- A Zod-validated `optimitron.review-response.v1` artifact records `APPROVE`, `CHANGES_REQUESTED`, `REJECT`, or `ABSTAIN`, an explanation, checklist answers, and an optional proposal. A proposal is a separate private document; it is not a child document. Applying it creates a new canonical revision and makes exact-revision reviews of the prior version stale.
- A review's `TaskVerification` records whether the assigned review was delivered and accepted as work. It never changes the substantive verdict or converts `REJECT`, `CHANGES_REQUESTED`, or `ABSTAIN` into approval.
- The authorized task manager adopts an exact current revision through an immutable `optimitron.document-decision.v1` artifact. Required reviews need accepted delivery verification and an independent `APPROVE`; every unresolved required review needs a permanent reasoned waiver. Advisory reviews need no waiver, self-review does not satisfy independent approval, and there is no automatic approval threshold.
- Comment votes rank useful discussion only. They do not establish truth, accept work, adopt text, allocate funding, or decide a referendum.
- Publishing an adopted revision creates a new immutable referendum snapshot and an `optimitron.document-publication.v1` provenance artifact. Expert review verdicts and public referendum votes are separate signals. A failed referendum remains unchanged; changed text requires a new revision, adoption, and referendum.
- These contracts reuse `Task.contextJson`, `TaskExecutionArtifact`, and existing document and referendum rows. There is no parallel wiki, review table, decision table, board model, or legal-review subsystem.

## External Candidates And Review Outreach

- A candidate may be a saved external `Person` without a `User`. External-person matches require validated `candidate-evidence.v1` in `TaskCandidateMatch.reasonJson`: sources, sourced qualifications, confidence, conflicts, contact provenance, and uncertainties. Existing user and agent matches retain legacy compatibility.
- A same-email first sign-in links the new `User` to the existing `Person`, so the reviewer receives access to the already-assigned private review task instead of creating a duplicate identity.
- Each exact invitation or reminder is one hash-sealed `ExternalActionRequest`. A review batch is approved only if every request ID and payload hash matches and no unlisted draft shares the batch key; approval is atomic, while dispatch records a result per message.
- The approval record binds the task and revision; the invitation email contains a sign-in link but no confidential document text. One invitation and at most one separately approved reminder after seven days are allowed. Completion, reply, decline, opt-out, bounce, complaint, or rate-limit failure suppresses further outreach, including for external `Person` recipients without accounts.

## Contribution Receipts

- During adoption, a manager may explicitly bind that revision as the task's funding terms. The resulting `optimitron.contribution-receipt-binding.v1` freezes the issuer, terms revision, and adopted governing revisions in task context before a target exists; the first checkout or pledge copies it onto the target, where a different binding cannot replace it. Every successful payment then creates one deterministic private receipt task and immutable `optimitron.contribution-receipt.v1` artifact in the same transaction. Missing or invalid adoption provenance fails closed, and receipt failure rolls back the local paid transition.
- The receipt freezes the payment, terms revision, governing document hashes, intended funded task, and current impact-estimate version.
- The original receipt states that work is incomplete, impact is unrealized, and no Earth Optimization Points were minted. It is never rewritten.
- Completion, measured impact, refund, and correction records are append-only `optimitron.outcome-addendum.v1` artifacts. An addendum may report later facts but still does not mint Earth Optimization Points.

## Court Boundary

- Keep `CourtCase`, `CourtCaseParty`, plaintiff identity, consent, privacy, and memorial records as the Court of Humanity's durable case and human-safety boundary.
- Do not expand `CourtCaseClaim`, `CourtCaseHarm`, `CourtCaseEvidence`, or `CourtCaseRemedy` while the generic workflow is piloted. New narratives use versioned documents, evidence uses `SourceArtifact`, and investigation and review work uses tasks.
- Do not migrate or delete existing Court data. Reassess the specific Court schema only after the EOS financing-packet workflow succeeds and production Court data is audited.

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
