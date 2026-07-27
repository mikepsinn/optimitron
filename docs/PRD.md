# Optimitron Product Requirements Document

**What this document is.** The target-state specification for Optimitron — the
product we are building toward, deliberately not constrained by what exists
today. Current implementation status lives in [FEATURES.md](./FEATURES.md);
every capability below cites a feature ID (`OPT-*`) so you can check what is
real before believing anything. The path from here to there is
[ROADMAP.md](./ROADMAP.md).

**Audience.** Engineers and agents working on the codebase. Plain language,
no marketing. The public-facing pitch is the root [README.md](../README.md)
and the [manual](https://manual.warondisease.org).

---

## 1. What Optimitron is

Optimitron answers one question at every scale: **what is the highest
expected-value action available right now?**

A person asks it what to do with the next hour. An organization asks it what
to do with its people. A government asks it what to do with its budget.
Humanity asks it what to do with its 8 billion people and ~$110 trillion
economy. The math is the same at every layer: estimate value, probability of
success, cost, and time for each candidate action; rank; act; measure what
happened; re-estimate. The product is that loop, industrialized.

**North-star metrics.** Two numbers, defined in
`packages/data/src/parameters/earth-optimization-prize.ts` as
`earthOptimizationPrizeWinCondition` (never re-type the values — cite the
constants):

- **Median healthy life expectancy (HALE)** — baseline `GLOBAL_HALE_CURRENT`,
  target `TREATY_PROJECTED_HALE_YEAR_15`, by `EARTH_OPTIMIZATION_PRIZE_DEADLINE_YEAR` (2040).
- **Median real after-tax income** — baseline
  `CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15`, target
  `TREATY_TRAJECTORY_AVG_INCOME_YEAR_15`, same deadline.

Every task in the system is, directly or through its ancestors, a bet on
moving one of those two numbers. A task that is not such a bet should not
exist.

### 1.1 Acceptance stories

These stories are the product acceptance test. A model, field, tool, or UI
element must help satisfy at least one story below, enforce its privacy or
authorization boundary, or preserve the evidence needed to audit it.

| ID                | User story                                                                                                                                                                                              | Done when                                                                                                                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PERSONAL-NEXT     | As an individual, I want one ranked next action and a realistic plan for today so that I spend my time on what matters most without neglecting medication, food, sleep, exercise, or fixed commitments. | `getNextAction` and `getExecutionPlan` use the same eligibility and EV rules, exclude blocked work, and include due personal routines.                                                                                                                                     |
| PERSONAL-SCHEDULE | As an individual, I want Optimitron to continuously generate and revise my schedule so that I always know what to do and when, for as long as I use it.                                                 | Durable recurrence rules, time windows, deadlines, dependencies, and fixed commitments are projected into a bounded rolling calendar; completion, new information, or elapsed time triggers replanning instead of creating infinite future event rows.                     |
| PERSONAL-CAPTURE  | As an individual, I want to brain-dump obligations and ideas so that my agent turns them into private, atomic, estimated tasks in the right part of my objective tree.                                  | After explicit source and candidate review, every grounded nonduplicate action is created as a private active task with an explicit parent, dependencies, effort, cost, probability, value, deliverable, criteria, and provenance; ambiguity becomes a clarification task. |
| PERSONAL-TRACK    | As an individual, I want to tell my agent what I did, took, ate, and felt so that completed tasks and health measurements are actually recorded without a separate data-entry app.                      | The conversation persists task completion, Measurements, and InterventionExperience records; it never claims to have logged data that was not written.                                                                                                                     |
| PERSONAL-LEARN    | As an individual, I want Optimitron to learn what improves or worsens my outcomes so that future recommendations rely increasingly on observed effects instead of guesses.                              | Before/after and temporal analyses produce reviewable effect estimates that can update the relevant task-impact inputs.                                                                                                                                                    |
| PERSONAL-DELEGATE | As an individual, I want agents to perform suitable work in parallel so that I only do the parts requiring my judgment, identity, or body.                                                              | Agents lease non-blocked executable tasks; sending, spending, publishing, and other external effects require approval of the concrete action.                                                                                                                              |
| ORG-PLAN          | As an organization leader, I want one ranked queue for the organization so that people, money, and agents work on the highest-value feasible actions.                                                   | The organization plan respects ownership, capabilities, dependencies, deadlines, capacity, and human-versus-agent execution routes.                                                                                                                                        |
| WORKER-MATCH      | As a volunteer or agent, I want feasible tasks ranked by the expected value of my time so that each available hour goes to the most valuable work I can actually complete.                              | Discovery ranks open, unblocked tasks by marginal expected value per executor-hour after capability and access filtering, without placing containers or milestones in execution queues.                                                                                    |
| FUNDER-COMPARE    | As a donor or investor, I want fundable work ranked by the expected value of my next dollar so that I can allocate money to the highest-impact available use.                                           | Discovery ranks remaining fundable units by marginal expected value per dollar; each estimate shows uncertainty, a readable calculation, assumptions, and a trace from named inputs to primary sources.                                                                    |
| ANALYST-MODEL     | As an analyst, I want to propose sourced parameters and formulas so that task estimates are reproducible, reviewable, and updated when important assumptions change.                                    | Published calculations pin exact reviewed parameter revisions; changed inputs mark affected estimate sets stale until a replacement succeeds.                                                                                                                              |
| GOVERNMENT-PLAN   | As a citizen or government, I want preferences, evidence, policies, and budgets converted into ranked programs so that public resources maximize welfare rather than political intuition.               | Wishocracy, OPG, or OBG outputs can become sourced task bundles that compete under the same EV rules as other programs.                                                                                                                                                    |
| CAMPAIGN-ACT      | As a human or organization, I want to vote, recruit others, endorse, register a plaintiff, or remind a leader so that the current highest-EV campaign gains measurable support.                         | Each action has a direct completion path and its referral, endorsement, case, or reminder outcome is recorded.                                                                                                                                                             |
| OPERATOR-INGEST   | As a user leaving other productivity tools, I want existing tasks and calendar commitments deduplicated into Optimitron so that I can use one canonical ranked system.                                  | Explicitly selected imports use stable private source identities and atomic review/apply; every grounded action becomes active, duplicates gain source links, meetings constrain capacity, and raw private transcripts are not retained.                                   |
| KNOWLEDGE-REUSE   | As a person or organization owner, I want verified information about us reused across forms and tasks so that we answer once without losing context, ownership, or control.                             | Reusable questions are tasks; approved answers are versioned artifacts or assertions with provenance, sensitivity, validity, approval, and supersession; every application pins the exact version it used.                                                                 |
| COLLECTIVE-VERIFY | As a decision-maker, I want evidence evaluated by the right authorities so that popularity, confidence, and truth are not confused.                                                                     | Helpful comment votes affect discussion ordering only; operational acceptance depends on authorization, provenance, freshness, corroboration, conflicts, and task-specific verification.                                                                                   |
| SYSTEM-IMPROVE    | As an operator, I want outcomes to generate ranked, testable improvements so that Optimitron becomes more useful rather than merely accumulating plans.                                                 | Telemetry produces a proposed improvement, a ranked task, execution evidence, a verified outcome, and recalibration under one auditable loop.                                                                                                                              |
| BUSINESS-SUSTAIN  | As an operator, I want bounded paid workflows to fund the optimization machine so that it can keep operating without compromising mission ranking or nonprofit funds.                                   | Verified-work pilots demonstrate gross margin sufficient to cover EOS operating costs, while commercial revenue and nonprofit campaign donations remain legally and operationally separate.                                                                                |

---

## 2. The objective chain — four layers, one tree

All work lives in a single task tree rooted at `optimize-earth`
(`OPTIMIZE_EARTH_ROOT_TASK_ID` in `@optimitron/db`). Value rolls up the tree:
a child's contribution to its parent is `child.delta / parent.delta`
(`computeParentContributionShare`). The four layers are views into that one
tree, not separate systems:

| Layer        | Actor                        | Question                                    | Primary surface                                          |
| ------------ | ---------------------------- | ------------------------------------------- | -------------------------------------------------------- |
| Personal     | A human + their AI agent     | What should I do right now?                 | MCP server via any AI chat (OPT-API-01)                  |
| Organization | Teams, companies, nonprofits | What should our people work on?             | Org tasks, membership, task marketplace (OPT-TASK-01)    |
| Government   | Jurisdictions                | What policies and budgets maximize welfare? | OPG / OBG / Wishocracy (OPT-GOV-01..05)                  |
| Earth        | Humanity                     | Which programs move the two medians most?   | EV-ranked programs under `optimize-earth` (OPT-EARTH-\*) |

Personal subtrees graft under reserved `planner:person:<id>` branches named
`Optimize <person>'s life`; organizational subtrees use
`planner:organization:<id>` branches named `Optimize <organization>`. Both
sit directly beneath `optimize-earth`, but public ancestry never grants access
to private descendants. Every work node is a `Task`; objectives, projects,
and workflows are container tasks whose meaning comes from ancestry.

---

## 3. Layer 1: Personal — the Daily Companion Loop

This is the anchor use case. The promise to the user:

> **You never have to think about what to do with your day.** Connect your AI
> to the Optimitron MCP server. It knows your tasks, your medications, your
> meals, your goals. It tells you the single next action — "brush your teeth,"
> "eat an apple," "apply for the Survival and Flourishing Fund grant" — in EV
> order, and it learns from what actually happens to you.

Anyone can connect today: the MCP server is open — OAuth signup, no
gatekeeping (OPT-API-01). The loop has six stages. Each stage lists what the
system SHALL do at target state; FEATURES.md says how much of it exists.

### 3.1 Morning brief / next action (OPT-EV-01, OPT-EV-02, OPT-EV-04)

- The agent calls `getNextAction` / `getExecutionPlan` and receives a
  capacity-bounded plan for the day: ranked atomic tasks, fixed commitments
  respected, blocked work excluded, items needing estimates flagged.
- The queue SHALL interleave health actions (medication times, meals,
  exercise, hygiene) with work tasks in one stream (OPT-EV-04). One queue,
  not two apps.
- The signed-in calendar SHALL render that same execution plan as a day
  timeline. It is a view of Optimitron tasks and commitments, not a second
  scheduler or a copy of the plan.
- Ranking is expected value per hour:
  `priority = (P(success) × value − cash_cost) / (hours + cash_cost / buybackRate)`.
  The canonical formula and its inputs are documented in
  [MCP_SERVER.md](./MCP_SERVER.md). Deadline-required tasks override rank
  when their latest start time arrives, and the override is auditable
  (`selectionReason`).
- Graph invariants are enforced by the queue audit (OPT-TASK-04): no cycles,
  no unrooted tasks, no non-atomic tasks in an execution queue, no missing
  estimates without a finding.

### 3.2 Conversational check-in (OPT-HEALTH-01..03, OPT-TASK-01)

- The agent asks what the user did: tasks finished, food and drink, exercise,
  medications taken, symptom and mood ratings.
- Task answers become `completeTaskClaim` calls; health answers become
  `Measurement` rows and `InterventionExperience` records. Conversation IS
  the data-entry UI; there is no form the user must find.
- Every parsed statement the agent claims to have "logged" SHALL actually be
  persisted (OPT-HEALTH-02). A "Logged:" reply without a database write is a
  defect, not a feature.

### 3.3 Brain dump → tasks (OPT-TASK-05, OPT-TASK-06, OPT-TASK-07)

- The user talks or explicitly selects a bounded source batch. The client
  extracts candidates locally where the source is private, then shows the
  exact source and normalized actions for review.
- Every grounded, nonduplicate action selected in that review becomes a
  private `ACTIVE` task with explicit parent selection, deliverable,
  acceptance criteria, provenance, EV estimates (value, P(success), hours,
  cash cost), and dependency edges (OPT-TASK-02). Ambiguity becomes a
  clarification task; private work does not use the public proposal queue.
- Parent selection SHALL search the existing tree and attach to the closest
  existing objective (OPT-TASK-06). Attaching directly to the
  `optimize-earth` root is an error for user tasks; silently defaulting to
  root is a defect (see cleanup backlog in ROADMAP.md).
- Non-atomic ideas SHALL be decomposed into child tasks during review
  (OPT-TASK-07). A task with unresolved children is a container and never
  enters an execution queue. Reserved mission, personal, and organization
  roots are also permanently non-executable.

### 3.4 Recurring tracking (OPT-HEALTH-06)

- Scheduled ratings (mood, energy, symptoms) and medication reminders appear
  IN the task queue as recurring atomic tasks — not in a separate reminder
  app. Completing one writes a `Measurement`.
- Implementation decision (recorded in ROADMAP.md): revive the currently
  unused `TrackingReminder` model with a scheduler, or spawn recurring tasks
  from the existing `TaskTrigger` cron engine (OPT-TASK-03). Either way, the
  requirement is the same: routine health actions are tasks with cached EV,
  not re-estimated each morning.

### 3.5 Change-from-baseline outcomes (OPT-HEALTH-07)

- When the user starts an intervention (a new antidepressant, a diet change),
  the system SHALL compare regularly-rated variables before and after, and
  surface statistically significant changes: "your mood ratings are up 1.2
  points since you started sertraline; your sleep is unchanged."
- The statistics exist in `@optimitron/optimizer` (change-from-baseline,
  temporal alignment, evidence grading); the requirement is wiring them to
  server-side personal Measurements and reporting through the agent
  conversation.

### 3.6 Agent execution with approval (OPT-AGENT-02)

- AI agents claim and complete every non-blocked task marked agent-executable
  (`AGENT_ONLY` / `HUMAN_OR_AGENT`), in parallel, subject to lease-based
  coordination so two agents never duplicate work.
- Any action with external effect (sending an email, spending money,
  publishing) SHALL pass a propose → user-approve → execute gate. The user
  reviews a concrete proposed action, not a vague intention.

### 3.7 External sources (OPT-INTG-01, OPT-INTG-02)

- Notion pages and databases import through lossless normalized bundles with
  workspace-scoped source keys, hash-based change detection, source artifacts,
  private-file copying, and duplicate collapsing. Documents, bounded table
  collections, and migration tooling exist; the live Notion API connection
  does not. Imported formulas and rollups retain their definitions and current
  values but do not execute in Optimitron.
- Google Calendar events import as fixed commitments for the execution
  planner. The normalization seam exists; the live API connection does not.
  These systems are migration and invitation sources. Optimitron owns the
  resulting planning state and projects it into its own task and calendar
  views.
- WhatsApp, Discord, Telegram, email, Slack, meeting notes, Notion comments,
  and GitHub discussions share one conversation-to-work pattern: explicit
  selection, local raw-text extraction by default, exact human review, safe
  source hashes/anchors, then atomic active-task creation. There is no ambient
  account scraping or unreviewed whole-history import.

---

## 4. Layer 2: Organizations

- Organizations own tasks, members, and owner/admin/member/viewer roles
  (OPT-TASK-01). Org task queues
  rank the same way personal queues do, rooted at
  `planner:organization:<id>`.
- Listings, compensation, applications, and candidate matching describe how
  ordinary tasks may be staffed (OPT-TASK-01). They do not create task types.
  Container status is derived only from unresolved child tasks and reserved
  root identity.
- Organizations endorse referendums (`signReferendumAsOrganization`,
  OPT-EARTH-03), embed vote/referral surfaces, and recruit their own people —
  the org layer is how the earth layer scales.

## 5. Layer 3: Governments

Alignment software for governments, deployable per jurisdiction (every DB
model carries `jurisdictionId`; the web layer is multi-tenant):

- **Preference aggregation** (OPT-GOV-04): RAPPA pairwise comparisons turn
  citizen trade-offs into stable budget weights — eigenvector weighting,
  consistency checks, manipulation resistance (`@optimitron/wishocracy`).
- **Optimal Budget Generator** (OPT-GOV-03): reallocation targets,
  minimum-effective-spending floors, overspend diagnostics, efficient
  frontiers (`@optimitron/obg`).
- **Optimal Policy Generator** (OPT-GOV-02): Bradford-Hill-style causal
  confidence scoring of policies (`@optimitron/opg`).
- **Causal core** (OPT-GOV-01): domain-agnostic observational statistics —
  n-of-1 and cross-sectional — shared by the government layer and the
  personal health layer (`@optimitron/optimizer`).
- Model runs convert into task bundles: an OPG/OBG conclusion becomes an
  EV-estimated program task under `optimize-earth`, so "pass this policy"
  competes in the same queue as everything else.

## 6. Layer 4: Earth

Programs — treaties, prizes, lawsuits, campaigns — are EV-ranked children of
`optimize-earth`. **The 1% Treaty is the current highest-EV program, not an
axiom.** If the analysis finds something better for the two medians, the
queue reorders and the product follows the queue. That is the point of the
product.

Current earth-layer surfaces:

- **Treaty referendum** (OPT-EARTH-01): proof-of-personhood-verified voting.
  The full screen-by-screen UX spec is [questions.md](./questions.md).
- **Referral propagation** (OPT-EARTH-02): each voter recruits two more;
  invitations and share attempts are tracked models, not vibes.
- **Organization endorsement** (OPT-EARTH-03).
- **Court of Humanity** (OPT-EARTH-04): structured cases — parties, claims,
  harms, evidence, remedies, jury votes — as an accountability surface.
- **Signer reminders** (OPT-EARTH-05): the `TaskTrigger` automation engine
  (OPT-TASK-03) spawns and routes reminder tasks to overdue treaty signers.

## 7. The learning loop (decentralized FDA)

The system stops guessing as data accumulates:

1. Personal measurements and intervention experiences accrue per user
   (OPT-HEALTH-01..03, OPT-HEALTH-06).
2. `@optimitron/optimizer` computes per-person effects (OPT-HEALTH-07) and,
   across consenting users, aggregate outcome labels for foods, drugs, and
   behaviors — effect sizes with evidence grades, not testimonials.
3. Those effect estimates flow back into task EV: "take medication X" gets
   its value term from observed outcomes, not from a guess. Completed tasks
   with recorded actuals (`actualEffortSeconds`, `actualCashCostUsd`)
   recalibrate effort and cost estimates the same way.
4. The same pipeline powers public evidence surfaces: intervention approval
   timelines, efficacy-lag analysis ("died before the treatment was
   approved"), and variable-relationship estimates.

This is one pipeline, not two products: the companion loop is the data
collection instrument for the decentralized FDA, and the decentralized FDA is
what makes the companion loop's recommendations true.

## 8. Health-data privacy and consent (multi-user model)

Personal health data shares a database with public campaign tasks. The rules:

- **Private by default.** Measurements, intervention experiences, and
  personal tasks are visible only to their owner and the agents the owner has
  authorized. Personal-ness is derived from ownership, enforced at every
  query boundary.
- **Consent is explicit, tiered, and revocable.** Tier 0: private, n-of-1
  analysis only. Tier 1: anonymized contribution to aggregate outcome labels.
  Tier 2: named participation (e.g., public N-of-1 case studies). Nothing
  moves up a tier without an affirmative act; revocation stops future use.
- **Aggregate outputs only in public surfaces.** Public dFDA pages publish
  effect estimates, cohort sizes, and evidence grades — never individual
  rows. Minimum cohort sizes prevent re-identification by small-n.
- **Anonymization is mechanical, not editorial.** The masking machinery in
  [PREVIEW_DATA_PRIVACY.md](./PREVIEW_DATA_PRIVACY.md) (column-level rules,
  applied by script) extends to research exports: direct identifiers stripped,
  quasi-identifiers generalized, linkage keys rotated.
- **Jurisdiction isolation.** Health data respects `jurisdictionId`
  boundaries; multi-tenant deployments do not co-mingle cohorts.
- **The agent is bound too.** MCP scopes gate which tools an agent may call;
  a chat agent authorized to read your queue is not thereby authorized to
  read your measurements.

## 9. Cross-cutting systems

### 9.1 Identity

`Person` owns every public-facing identity field (displayName, handle, image,
bio); `User` is the auth record. Display reads go through Person, no
fallbacks. One human = one Person, across personal, org, government, and
earth layers.

### 9.2 Treasury — three independent mechanisms

Never mixed, never sharing components, ABIs, or copy (full table below;
contract status in FEATURES.md OPT-TREAS-01..03):

| Mechanism                               | Page        | Purpose                                                 | Contracts                                            | Flow                                                                                                                                                                                                              |
| --------------------------------------- | ----------- | ------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Earth Optimization Prize** (Phase 1)  | `/prize`    | Fund referendum proving demand for the 1% Treaty        | `VoteToken`, `VoterPrizeTreasury`                    | Deposit USDC → Aave yield → share referral → World ID voters → referrer earns VOTE 1:1. Success: VOTE holders claim prize share. Failure (15yr): depositors claim principal + yield. Dominant assurance contract. |
| **Incentive Alignment Bonds** (Phase 2) | IAB pages   | Raise ~$1B to lobby the 1% Treaty once demand is proven | `IABVault`, `IABSplitter`, `PublicGoodsPool`         | Investors buy bonds → capital funds lobbying → treaty passes → $27B/yr splits 80% trials / 10% investors / 10% aligned-politician super PACs. If treaty fails, bonds lose everything. Not an assurance contract.  |
| **$WISH Token / UBI**                   | `/treasury` | Replace welfare + IRS + inflationary monetary policy    | `WishToken`, `WishocraticTreasury`, `UBIDistributor` | Flat 0.5% tx tax, UBI at poverty line, algorithmic 0% inflation, allocation via Wishocracy RAPPA.                                                                                                                 |

### 9.3 MCP and API surface

The MCP server (`packages/web/src/lib/mcp-server.ts`) is the primary product
interface for the personal layer. Codex and Claude Code remain the chat,
reasoning, connector, coding, and browser clients; Optimitron owns durable
tasks, provenance, EV, permissions, approvals, verification, and audit.
Tools are OAuth-authenticated and scope-gated (OPT-API-01). REST/OpenAPI
exists for the narrow web and partner operations that need it, not as a
second richer write contract. Tool reference:
[MCP_SERVER.md](./MCP_SERVER.md).

### 9.4 Data provenance

External datasets (OECD, World Bank, WHO, FRED, SIPRI, Congress) and the
vendored economic-data snapshot are cataloged in
[DATA_SOURCES.md](./DATA_SOURCES.md) (OPT-DATA-01). User-facing numbers cite
parameter constants from
`packages/data/src/parameters/parameters-calculations-citations.ts` via
`<ParameterValue>`; docs cite constants by name. Numbers without provenance
do not ship.

### 9.5 Reusable person and organization knowledge (OPT-KNOW-01)

Reusable knowledge belongs to a stable `Person`, `User`, or `Organization`,
not to one application or program. The target contract is:

- A question, missing-fact request, or requested review is a `Task`, so it can
  block one or more application or execution tasks and receive comments,
  assignment, deadlines, and verification.
- A `KnowledgeAnswer` gives each reusable subject-owned answer a stable
  identity. Its execution task supplies the immutable `DocumentRevision` and
  accepted `TaskVerification` for the exact answer. When an independent formal
  document review is requested, the verification accepts delivery of that
  review; the review artifact carries the substantive verdict and a separate
  manager decision adopts or waives it.
- One answer may serve many tasks. Each use records the exact question,
  answer revision, form revision, actor, approval, destination, and resulting
  receipt or outcome; forms do not copy an answer into a second canonical
  knowledge row.
- `Form` and immutable `FormRevision` rows represent surveys, applications,
  intake forms, assessments, and questionnaires. The schema preserves typed
  fields, sections, options, validation, anonymous responses, and exact
  submissions without creating a second answer store. The current service
  implements the reviewed narrative-answer loop; a generic form builder and
  create/publish/respond API remain future consumers of this foundation.
- Collections may provide bounded import, review, and table views, but they
  are not a parallel truth store. A `program` column is not ownership or
  lineage; task and artifact relations carry reuse.
- Agents retrieve only knowledge the current actor may access. Ambiguous,
  stale, conflicting, or missing answers create small human tasks instead of
  confident guesses.

### 9.6 Authority-aware collective verification (OPT-EPI-01)

Optimitron separates attention from truth. Likes or votes on a `TaskComment`
may rank helpfulness, relevance, or review priority; they never make the
comment true. Operational acceptance combines the subject owner's authority,
the verifier's authority for the claim type, primary-source provenance,
freshness, independent corroboration, disclosed conflicts, and the consuming
task's acceptance criteria. Verification and supersession are append-only
evidence. Private owner-authorized verification must work before public
reputation or consensus weighting is designed.

The reusable document path makes the separation concrete:

- A private assigned review task exposes one exact immutable revision and no
  sibling-review or document-history access.
- `TaskVerification` records whether the reviewer delivered the requested
  work correctly. The `optimitron.review-response.v1` artifact separately records
  `APPROVE`, `CHANGES_REQUESTED`, `REJECT`, or `ABSTAIN` with an explanation.
- A reviewer rewrite is a separate private proposal document. Applying it
  creates a new canonical revision and makes reviews of the old revision
  stale.
- The authorized manager adopts the current revision in an immutable decision
  artifact. Each unresolved required review needs a permanent reasoned waiver;
  there is no automatic vote threshold and a self-review cannot supply the
  independent approval.
- Review authority, assignee, access policy, instructions, checklist, and exact
  revision are hash-bound. Generic task editing or execution cannot rewrite or
  complete a formal review.
- Publication creates a new locked referendum snapshot. Referendum votes are a
  public decision signal, not a substitute for expert review, manager
  authority, or delivery verification.

Task pages remain the collaboration and audit hub, while substantial text
lives in versioned Documents. This is the generic governance surface for
policies, research protocols, specifications, contracts, and founding records;
it is not a separate wiki or legal-review product.

### 9.7 Auditable self-improvement loop (OPT-LOOP-01)

The product improvement loop is:

```text
telemetry -> proposed improvement -> ranked task -> execution
-> verified outcome -> recalibration
```

This is the general form of campaign, personal, organization, and platform
learning. A proposal cannot approve its own external action or outcome. The
former campaign-specific reasoning subsystem was removed rather than preserved
as a second planning or truth system. Future reasoning products must emit
evidence and tasks into this loop.

### 9.8 Financial sustainability (OPT-BIZ-01)

Optimitron may sell bounded organization workflows and verified-work pilots
whose measured gross margin can cover Earth Optimization Services operating
costs. Customers may buy execution capacity and workflow outcomes, but not
truth, verification results, public queue priority, or mission ranking.
Commercial EOS revenue, contracts, expenses, and liabilities remain legally
and operationally separate from Accelerated Medicine Foundation and its DBA
campaign donations. A pilot advances only with a named payer, deliverable,
cost, receipt, verification method, and margin calculation.

For task-funded work, the manager explicitly marks an adopted revision as the
funding terms. That freezes the issuer, terms, and adopted governing-document
revisions on the task; the first checkout or pledge copies the same immutable
binding onto the funding target. Every successful payment then creates one
deterministic private receipt in the same transaction. Missing provenance fails
closed, and receipt failure rolls back the local paid transition. The receipt
freezes the payment, intended task, and impact-estimate version. It always says
that work is incomplete, impact is unrealized, and no Earth Optimization Points
were minted. Completion, measured outcomes, refunds, and corrections are
append-only addenda; they never rewrite the payment-time record.

---

## 10. Non-goals

- **Not cloning Notion feature-for-feature.** Optimitron replaces the used
  workflows with canonical tasks, documents, bounded table collections, and
  its own calendar. Generic formula execution, real-time block collaboration,
  and generic automation are added only when a migrated workflow cannot be
  represented by typed task/planner/TaskTrigger behavior.
- **Not a social network.** People and organization pages exist for trust and
  coordination, not engagement farming.
- **Not another chat, coding agent, connector suite, terminal, or browser
  controller.** Codex and Claude Code already own those client capabilities;
  the Chrome extension is limited to explicit local capture, review, and
  exact approval.
- **Not mixing treasury mechanisms** (§9.2) — separation is enforced at
  contract, ABI, route, copy, and voice-config layers.
- **Not shipping unverifiable claims.** A capability without evidence in
  FEATURES.md is labeled partial/planned/vision/blocked. This document
  describes the target; it never asserts the present.
