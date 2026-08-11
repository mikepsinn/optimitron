# Feature Registry

The single source of truth for **what exists today**. Every significant
capability has a stable ID, a maturity status, on-disk evidence, and an
acceptance criterion. The vision lives in [PRD.md](./PRD.md); sequencing lives
in [ROADMAP.md](./ROADMAP.md). This file is the only document allowed to
assert maturity status.

**Rules.** IDs (`OPT-<AREA>-<NN>`) are immutable — never renumbered, never
reused; dead features keep their IDs. Statuses (exactly six):

- `implemented` — works on production paths; evidence and tests exist
- `partial` — code exists, behavior incomplete; the gap is stated
- `planned` — decided, not started
- `vision` — aspirational; no code commitment yet
- `blocked` — waiting on a named external dependency or approval
- `dead` — code exists, unused; cleanup queued in ROADMAP.md Appendix A

No evidence on disk → no `implemented`. Update the entry in the same PR that
changes the behavior. Extract entries mechanically with `grep -A9 "^### OPT-"`.

Statuses verified against `feature/mcp-execution-plan-audit` @ `1dedf0be`
(2026-07-11); private-execution entries (OPT-TASK-08, OPT-EXT-02, OPT-INTG-03)
verified against `feature/private-execution-system` (2026-07-17).

---

## Task system

### OPT-TASK-01 — Task engine: CRUD, claims, comments, marketplace

- **Layer:** personal / org
- **Status:** implemented
- **Summary:** Full task lifecycle over MCP (~110 tools) and REST: create/update/delete, one-call completion for private owner-created `Self` tasks, claim → complete → verify for contributed work, threaded comments, applications and candidate matching, org ownership.
- **Evidence:** packages/web/src/lib/mcp-server.ts; packages/web/src/lib/tasks.server.ts (`createTask`); packages/web/src/lib/tasks/task-comments.server.ts; tests: packages/web/src/lib/**tests**/mcp-server.test.ts, **tests**/tasks.server.test.ts, **tests**/task-comments.server.test.ts
- **Acceptance:** An MCP client can create a task under an explicit parent, mark its own simple private `Self` task done in one call, or claim and submit contributed work for verification — all persisted.
- **Roadmap:** shipped — maintain

### OPT-TASK-02 — Dependency graph (TaskEdge) with blocker gating

- **Layer:** personal / org
- **Status:** implemented
- **Summary:** Directed edges (DEPENDS_ON / BLOCKS / INCREASES_PROBABILITY_OF / ACCELERATES) with probability/time-delta triples; blocked tasks are excluded from execution queues and their remaining plan priority flows to the executable blocker frontier.
- **Evidence:** packages/db/prisma/schema.prisma (`model TaskEdge`, `enum TaskEdgeType`); `getBlockers` tool in packages/web/src/lib/mcp-server.ts; `isTaskBlocked` in packages/web/src/lib/tasks/rank-tasks.ts; packages/web/src/lib/tasks/marginal-impact.ts + test
- **Acceptance:** A task with an unverified zero-delta BLOCKS edge does not appear in getMyQueue; its executable blocker carries the remaining plan priority, and verifying the blocker makes the target appear.
- **Roadmap:** shipped — maintain
- **Notes:** Managed/seed data contains zero edges; the graph is populated only at runtime by explicit MCP calls.

### OPT-TASK-03 — Trigger/spawn automation engine

- **Layer:** cross-cutting
- **Status:** implemented
- **Summary:** Data-driven triggers fire on named events (user signup, cron, task status changes), template-substitute into spawned tasks or outbound communications, with idempotency keys and completion gates. Backbone of treaty signer-reminder flows.
- **Evidence:** packages/web/src/lib/triggers/admin.ts; packages/web/src/lib/triggers/fire.ts; tests: triggers/**tests**/fire.integration.test.ts, triggers/**tests**/one-percent-treaty-blueprints.test.ts
- **Acceptance:** Firing a trigger for a matching event spawns the specified task exactly once (idempotent on re-fire).
- **Roadmap:** shipped — maintain
- **Notes:** "TaskTemplate" MCP tools are a facade over TaskTrigger rows (`metadata.taskTemplateFacade`), not a second engine.

### OPT-TASK-04 — Queue audit graph linter

- **Layer:** personal / org
- **Status:** implemented
- **Summary:** Validates personal execution queues for cycles, unrooted tasks, non-atomic queue entries, missing marginal estimates, invalid value edges, and nondeterministic ties. The admin-only `getTaskTreeAudit` adds a complete, stably paged Optimize Earth audit for missing parents, duplicate fingerprints, candidate coverage, provenance, acceptance criteria, and oversized agent work.
- **Evidence:** packages/web/src/lib/tasks/execution-planner-audit.ts; packages/web/src/lib/tasks/task-tree-steward.ts; packages/web/src/lib/tasks/task-tree-steward.server.ts; execution-planner-audit.test.ts; task-tree-steward.test.ts; wired into `getQueueAudit` and `getTaskTreeAudit` in packages/web/src/lib/mcp-server.ts
- **Acceptance:** Introducing a dependency cycle yields a DEPENDENCY_CYCLE finding from getQueueAudit; an admin can page every root-tree finding through getTaskTreeAudit without relying on the listTasks result cap.
- **Roadmap:** shipped — maintain

### OPT-TASK-05 — Brain-dump capture via MCP

- **Layer:** personal
- **Status:** implemented
- **Summary:** Free-form ideas become structured tasks: createTask with EV estimates, proposeTaskBundle for multi-task proposals, addDependency for prerequisites.
- **Evidence:** `createTask`, `proposeTaskBundle`, `addDependency` tools in packages/web/src/lib/mcp-server.ts
- **Acceptance:** An agent can turn a spoken idea into a persisted task with value/p_success/hours/cash_cost and at least one dependency edge in one conversation.
- **Roadmap:** shipped — maintain

### OPT-TASK-06 — Parent-task selection for new tasks

- **Layer:** personal / org
- **Status:** partial
- **Summary:** The MCP createTask tool requires an explicit parentTaskId and rejects direct attachment to the optimize-earth root; agents are instructed to searchTasks first. Parentless _private_ tasks on the lib path now land in the creator's (or the assigned org's) private planning branch instead of root, and feedback tasks parent under `optimitron:dev`. Parentless _public_ tasks (e.g. "ask for help") still root at optimize-earth because there is no public per-person branch to hold them — that case waits on the ranked parent-suggestion matcher.
- **Evidence:** `validateExplicitTaskParent` in packages/web/src/lib/mcp-server.ts (throws on root); packages/web/src/lib/tasks.server.ts `createTask` / `resolveDefaultPrivateParent` (private parentless → `ensureExecutionPlanningBranch`); packages/web/src/lib/feedback.server.ts (`parentTaskId: OPTIMITRON_DEV_TASK_ID`)
- **Acceptance (target):** No user-created task attaches to the root by default on any path, and new tasks receive a ranked parent suggestion from tree search. (Met for private tasks; public parentless tasks + ranked matching are the remaining gap — see Status: partial.)
- **Roadmap:** next — companion loop; remaining gap is public parentless tasks + the ranked parent suggestion (both need the matcher)
- **Notes:** Private root-default fixed on all paths (MCP + lib + feedback). Public parentless root-default and ranked best-parent matching remain open, coupled to the matcher.

### OPT-TASK-07 — AI decomposition into atomic subtasks

- **Layer:** personal
- **Status:** partial
- **Summary:** proposeTaskBundle accepts multi-task decompositions and the audit flags non-atomic tasks in queues (EXECUTABLE_PARENT), but decomposition is agent-prompted via tool descriptions — there is no automated splitter or confirm-flow.
- **Evidence:** `proposeTaskBundle` in packages/web/src/lib/mcp-server.ts; `EXECUTABLE_PARENT` finding in packages/web/src/lib/tasks/execution-planner-audit.ts + test
- **Acceptance:** Given "apply for an SFF grant," the system proposes atomic subtasks (draft, budget, reference, submit), the user confirms, and the children are created with edges.
- **Roadmap:** next — companion loop

### OPT-TASK-08 — Private execution kernel and tenant isolation

- **Layer:** personal / organization
- **Status:** partial
- **Summary:** The private-execution branch removes task kinds, adds stable private roots, expands task/source authorization, and implements the first MCP/service paths for reviewed imports, execution attempts, artifacts, typed verification, audit export, and exact external-action approval. It is a checkpoint, not a deployable release: the full TypeScript suite, adversarial isolation matrix, extension capture flow, migration preflight, and two-operator pilots remain incomplete.
- **Evidence:** `docs/plans/phased-approach-optimitron.md`; `packages/db/prisma/migrations/20260715180000_private_execution_system/`; `packages/web/src/lib/mcp-tools/private-execution.ts`; `packages/web/src/lib/tasks/private-task-bundle.server.ts`; `packages/web/src/lib/tasks/execution-lifecycle.server.ts`; `packages/web/src/lib/tasks/external-action.server.ts`; `packages/web/src/lib/tasks/private-work-portability.server.ts`; `packages/web/src/lib/tasks/task-visibility.server.ts`; `packages/web/src/lib/source-artifact-visibility.server.ts`
- **Acceptance:** The Primary Operator and Independent Operator each import 25-50 private active tasks and close 10 verified cycles; adversarial tests and manual probes reveal no cross-tenant existence, count, source, artifact, execution, verification, or audit data.
- **Roadmap:** now — private Daily Companion Loop dogfood

## Expected-value engine

### OPT-EV-01 — EV task ranking

- **Layer:** personal / org
- **Status:** implemented
- **Summary:** `priority = (realEv − cashCost) / (hours + cashCost / buybackRate)` with default buybackRate $1000/hr; expectedEconomicValueUsd is probability-weighted upstream. Execution-mode capability gating (human vs agent) is wired into scoring. The former decorative `difficulty` field is removed.
- **Evidence:** packages/web/src/lib/tasks/rank-tasks.ts (`computeTaskPriority`, `assessTaskForUserCapability`); packages/agent/src/task-capability.ts; migration packages/db/prisma/migrations/20260711190000_remove_task_difficulty/; rank-tasks.test.ts
- **Acceptance:** Given two available tasks with known estimates, getNextAction returns the higher-priority task and evaluateTaskEconomics reproduces the formula to the dollar.
- **Roadmap:** shipped — maintain

### OPT-EV-02 — Execution planner (capacity-bounded day plan)

- **Layer:** personal
- **Status:** implemented
- **Summary:** "frontier-replanning-v1": repeatedly picks the highest-priority feasible atomic task, simulates completion to unlock dependents, respects caller-supplied fixed commitments, returns checklist / AI-assisted work / blocked work / items needing estimates.
- **Evidence:** packages/web/src/lib/tasks/execution-planner.ts (`buildExecutionPlan`) wired to the `getExecutionPlan` MCP tool in packages/web/src/lib/mcp-server.ts; execution-planner.test.ts; execution-planner-pilot.test.ts
- **Acceptance:** With N available tasks and a capacity of H hours, the plan fits within H, schedules dependents only after their blockers, and never schedules a non-atomic task.
- **Roadmap:** shipped — maintain

### OPT-EV-03 — Impact estimate sets (uncertainty-aware value model)

- **Layer:** cross-cutting
- **Status:** implemented
- **Summary:** Per-task impact frames with low/base/high triples for probability, economic value, DALYs, HALE effect, income-growth effect, cost, effort, and delay losses; Monte Carlo summary stats; feeds ranking via impact.ts.
- **Evidence:** packages/db/prisma/schema.prisma (`TaskImpactEstimateSet`, `TaskImpactFrameEstimate`); packages/web/src/lib/tasks/impact.ts (`deriveImpactRatios`, `getNormalizedImpactComponents`); impact.test.ts
- **Acceptance:** setTaskImpact writes a frame estimate whose base values change the task's computed priority.
- **Roadmap:** shipped — maintain
- **Notes:** Known unit issue: `medianIncomeGrowthEffectPpPerYearBase` (a rate) sits in ADDITIVE_FRAME_KEYS and is aggregated like an absolute quantity — cleanup item #6 in ROADMAP.md Appendix A. EV inputs are also duplicated into `contextJson` for display — cleanup item #5.

### OPT-EV-04 — Health/work interleaved next action

- **Layer:** personal
- **Status:** planned
- **Summary:** getNextAction/getMyQueue output interleaves health actions (medication times, meals, exercise, hygiene) with work tasks in one EV-ranked stream. No interleaving logic exists today.
- **Evidence:** absence verified in `getMyQueue` / `getAIQueue` / `getNextAction` handlers in packages/web/src/lib/mcp-server.ts (no measurement/health/medication logic)
- **Acceptance:** A user with a due medication reminder and a due work task sees both, correctly ordered, in one getNextAction/getMyQueue stream.
- **Roadmap:** now — companion loop stage 2

## Health / dFDA

### OPT-HEALTH-01 — Daily measurement check-in

- **Layer:** personal
- **Status:** implemented
- **Summary:** Daily 1–5 health/happiness ratings persisted as Measurement rows via the /check-in page; unique per subject/variable/startTime.
- **Evidence:** packages/web/src/lib/profile.server.ts (`upsertDailyMeasurement`, `saveDailyCheckIn`); packages/web/src/app/api/profile/check-in/route.ts; packages/web/src/app/check-in/page.tsx
- **Acceptance:** Submitting a check-in writes a Measurement row retrievable on the next load; re-submitting the same day updates rather than duplicates.
- **Roadmap:** shipped — extend in companion loop stage 1
- **Notes:** Narrow scope: one page, 1–5 scales. The conversational path is OPT-HEALTH-02.

### OPT-HEALTH-02 — Conversational health logging

- **Layer:** personal
- **Status:** partial
- **Summary:** chat-ui parses "took 200mg ibuprofen" into structured measurements (LLM + regex fallback) — but ChatPage only renders a "Logged:" bubble and local state; nothing is persisted. The MCP write paths (Measurement, InterventionExperience) exist for agents that call them explicitly.
- **Evidence:** packages/chat-ui/src/nlp/text-to-measurements.ts; packages/web/src/components/chat/ChatPage.tsx (parse without persistence — no call to upsertDailyMeasurement or any Measurement API)
- **Acceptance:** Telling the chat "I took 200mg ibuprofen at 9am" produces a Measurement/InterventionExperience row queryable afterward — no silent drops.
- **Roadmap:** now — companion loop stage 1
- **Notes:** A stash (`preserve-dfda-tracking-mcp-tools-found-uncommitted-2026-07-07`) contains draft dFDA tracking MCP tools (regimen → tasks → logging) worth reviewing before building fresh.

### OPT-HEALTH-03 — Intervention experience recording

- **Layer:** personal / earth
- **Status:** implemented
- **Summary:** Structured "what treatment, what dose, what outcome, what side effect" records tied to before/after measurements; Zod-validated transactional MCP write.
- **Evidence:** `recordInterventionExperience` in packages/web/src/lib/earth-data.server.ts, exposed in packages/web/src/lib/mcp-server.ts
- **Acceptance:** recordInterventionExperience persists an experience with outcomes/side-effects retrievable by subject.
- **Roadmap:** shipped — maintain

### OPT-HEALTH-04 — TrackingReminder model

- **Layer:** personal
- **Status:** implemented
- **Summary:** Personal health-variable reminders can be created, edited in place, listed, queried by due date, and answered as tracked or snoozed through MCP. A not-taken day is recorded as value 0, not skipped, so the off periods stay in the series as baseline. Answering a tracked reminder writes a `Measurement`; `listMeasurements` reads those measurements back for one variable or all of them. Reminders are queried on demand rather than delivered by a scheduler or UI.
- **Evidence:** `upsertTrackingReminder`, `listTrackingReminders`, `listDueTrackingReminders`, `respondToTrackingReminder`, and `listMeasurements` in packages/web/src/lib/mcp-server.ts
- **Acceptance:** An authenticated caller can preserve a reminder's ID and response history while changing its schedule, a tracked response writes a measurement, and `listMeasurements` returns that measurement scoped to the caller's own subject.
- **Roadmap:** shipped MCP workflow — task-queue or push delivery remains in OPT-HEALTH-06.

### OPT-HEALTH-05 — Wearable/app health importers

- **Layer:** personal
- **Status:** implemented
- **Summary:** Nine importers normalize external health exports into measurement time series: Apple Health, Fitbit, Oura, MyFitnessPal, Withings, Google Fit, Cronometer, Strava, generic CSV.
- **Evidence:** packages/data/src/importers/ (apple-health.ts, fitbit.ts, oura.ts, myfitnesspal.ts, withings.ts, google-fit.ts, cronometer.ts, strava.ts, csv-generic.ts; re-exported from importers/index.ts)
- **Acceptance:** Each importer converts a representative export file into valid measurement series (covered by package tests).
- **Roadmap:** shipped — maintain

### OPT-HEALTH-06 — Recurring tracking tasks in the queue

- **Layer:** personal
- **Status:** planned
- **Summary:** Scheduled mood/energy/symptom ratings and medication reminders appear IN the task queue as recurring atomic tasks; completing one writes a Measurement. No cron trigger spawns check-in tasks today.
- **Evidence:** absence verified in packages/web/src/lib/triggers/ and app/api/cron/run-due-triggers/route.ts (no cron.\* trigger spawning measurement tasks)
- **Acceptance:** A daily mood-rating task appears in getMyQueue each morning; completing it writes a Measurement and the next occurrence schedules itself.
- **Roadmap:** now — companion loop stage 1 (decide whether TaskTrigger or the live TrackingReminder schedule owns task-queue delivery)

### OPT-HEALTH-07 — Change-from-baseline outcome reports

- **Layer:** personal
- **Status:** planned
- **Summary:** After starting an intervention, surface significant changes in regularly-rated variables. The statistics exist in the optimizer package; only the Chrome extension uses them on-device — nothing wires them to server-side Measurements.
- **Evidence:** packages/optimizer/src/change-from-baseline.ts + test; sole consumer packages/extension/src/workers/analysis.worker.ts; zero references in packages/web/src
- **Acceptance:** A user with ≥N daily mood ratings who starts a medication gets a report: effect estimate, confidence, evidence grade — via agent conversation.
- **Roadmap:** now — companion loop stage 3

## Government / causal inference

### OPT-GOV-01 — Causal inference core (optimizer)

- **Layer:** government / personal
- **Status:** implemented
- **Summary:** Domain-agnostic observational statistics: n-of-1 pair studies, adaptive binning, temporal alignment, response curves, hypothesis testing, evidence grading.
- **Evidence:** packages/optimizer/src/ (pipeline.ts, statistics.ts, response-curve.ts, change-from-baseline.ts, …); consumed by packages/web/src/app/api/health-analysis/submit/route.ts and lib/aggregate-relationships.server.ts
- **Acceptance:** runFullAnalysis on a synthetic treatment/outcome series recovers the planted effect with correct evidence grade (package tests).
- **Roadmap:** shipped — maintain

### OPT-GOV-02 — Optimal Policy Generator (opg)

- **Layer:** government
- **Status:** implemented
- **Summary:** Policy evaluation with Bradford-Hill-style causal confidence scoring, welfare framing, jurisdiction handling.
- **Evidence:** packages/opg/src/ (bradford-hill.ts, policy-impact-score.ts, …); packages/web/src/app/opg/page.tsx; packages/web/src/lib/tasks/opg-obg-adapters.ts
- **Acceptance:** OPG scores a policy dataset into ranked recommendations rendered at /opg.
- **Roadmap:** shipped — maintain

### OPT-GOV-03 — Optimal Budget Generator (obg)

- **Layer:** government
- **Status:** implemented
- **Summary:** Budget reallocation targets: cost-effectiveness, diminishing returns, efficient frontier, minimum effective spending, overspend ratios.
- **Evidence:** packages/obg/src/ (efficient-frontier.ts, budget-impact-score.ts, …); packages/web/src/app/obg/page.tsx; packages/web/src/lib/tasks/opg-obg-adapters.ts
- **Acceptance:** OBG produces a constrained reallocation report rendered at /obg and /budget.
- **Roadmap:** shipped — maintain

### OPT-GOV-04 — Wishocracy / RAPPA preference aggregation

- **Layer:** government
- **Status:** implemented
- **Summary:** Randomized Aggregated Pairwise Preference Allocation: pairwise comparisons → stable budget weights with eigenvector weighting, consistency checks, bootstrap CIs, manipulation resistance.
- **Evidence:** packages/wishocracy/src/; packages/web/src/lib/wishocracy-bridge.ts; packages/web/src/app/agencies/dcongress/wishocracy/page.tsx
- **Acceptance:** A session of pairwise answers yields budget weights that pass the consistency-ratio check.
- **Roadmap:** shipped — maintain

## Earth-layer campaign

### OPT-EARTH-01 — Treaty referendum voting

- **Layer:** earth
- **Status:** implemented
- **Summary:** Personhood-verified referendum voting on the 1% Treaty; UX spec in questions.md.
- **Evidence:** packages/web/src/app/vote/page.tsx; `castReferendumVote` in packages/web/src/lib/earth-data.server.ts and mcp-server.ts
- **Acceptance:** A verified human casts exactly one countable vote; duplicates rejected.
- **Roadmap:** now — campaign track

### OPT-EARTH-02 — Referral propagation

- **Layer:** earth
- **Status:** implemented
- **Summary:** Invite lifecycle (ReferralInvitation) and exact outbound-message ledger (ShareAttempt) with share surfaces across dashboard, post-vote flow, and task rows.
- **Evidence:** schema.prisma (`ReferralInvitation`, `ShareAttempt`); packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx; components/dashboard/ReferralInvitationStatusCard.tsx
- **Acceptance:** A voter's share produces a trackable invitation whose conversion attributes to the referrer.
- **Roadmap:** now — campaign track

### OPT-EARTH-03 — Organization endorsement

- **Layer:** earth / org
- **Status:** implemented
- **Summary:** Organizations sign the referendum and recruit members.
- **Evidence:** `signReferendumAsOrganization` in packages/web/src/lib/earth-data.server.ts and mcp-server.ts
- **Acceptance:** An org admin endorsement appears on the org's public page and in referendum tallies.
- **Roadmap:** now — campaign track

### OPT-EARTH-04 — Court of Humanity

- **Layer:** earth
- **Status:** implemented
- **Summary:** Structured accountability cases: parties, claims, harms, evidence, remedies, jury votes.
- **Evidence:** `upsertCourtCase`, `addCourtCaseClaim`, `getCourtCase`, `openCourtCaseJuryVote` in packages/web/src/lib/mcp-server.ts; packages/web/src/app/court/page.tsx
- **Acceptance:** A case built via MCP renders complete on /court with its parties, claims, and evidence.
- **Roadmap:** now — campaign track (operational-surface rework is production task `optimitron:dev:court-operational-surface`)

### OPT-EARTH-05 — Leader/signer reminders

- **Layer:** earth
- **Status:** implemented
- **Summary:** Overdue treaty-signer detection and claimable reminder tasks, spawned and routed by the trigger engine.
- **Evidence:** `claimSignerReminder` in packages/web/src/lib/mcp-server.ts; packages/web/src/lib/tasks/overdue-signers.server.ts + test; treaty-signer-network.ts
- **Acceptance:** An overdue signer yields a claimable reminder task; claiming it records the outreach.
- **Roadmap:** now — campaign track

## Treasury

### OPT-TREAS-01 — Earth Optimization Prize contracts

- **Layer:** earth
- **Status:** partial
- **Summary:** VoterPrizeTreasury + EarthOptimizationPoint compiled and unit-tested under Hardhat; deployed to no live chain — every prize contract address is zero on Sepolia and Base Sepolia; the web UI falls back to demo data.
- **Evidence:** packages/treasury-prize/contracts/; packages/treasury-shared/src/addresses.ts (zero addresses); packages/web/src/hooks/useTreasuryData.ts (`isDeployed` check + DEMO_DATA fallback)
- **Acceptance:** Deposit → yield → referral → claim flow executes against a live testnet deployment reachable from /prize.
- **Roadmap:** later — deploy when campaign scale warrants

### OPT-TREAS-02 — Incentive Alignment Bonds contracts

- **Layer:** earth
- **Status:** partial
- **Summary:** IABVault, IABSplitter, PublicGoodsPool, PoliticalIncentiveAllocator, AlignmentScoreOracle compiled and unit-tested; zero-address on all live chains.
- **Evidence:** packages/treasury-iab/contracts/; packages/treasury-shared/src/addresses.ts
- **Acceptance:** Bond purchase → lobbying escrow → conditional split executes on a live testnet.
- **Roadmap:** later — gated on demonstrated treaty demand (Phase 2)

### OPT-TREAS-03 — $WISH / UBI contracts

- **Layer:** earth
- **Status:** partial
- **Summary:** WishToken, WishocraticTreasury, UBIDistributor compiled and unit-tested; zero-address on all live chains.
- **Evidence:** packages/treasury-wish/contracts/; packages/treasury-shared/src/addresses.ts; packages/web/src/components/treasury/DistributeUBICard.tsx (demo fallback)
- **Acceptance:** UBI distribution executes from a live testnet deployment reachable from /treasury.
- **Roadmap:** later

## Extension, agents, integrations, platform

### OPT-EXT-01 — Chrome extension (Digital Twin Safe)

- **Layer:** personal
- **Status:** implemented
- **Summary:** MV3 health tracker with local treatment reminders, symptom/mood/food logging, JSON/CSV export, and on-device causal analysis. It also has OAuth and a server-backed Optimitron agenda for the signed-in user's queued tasks. Health records remain local; agenda actions use scoped web APIs.
- **Evidence:** packages/extension/src/workers/analysis.worker.ts; src/background/service-worker.ts; src/lib/storage.ts; src/lib/auth.ts; src/lib/api.ts; src/popup/agenda.ts; Vitest files under src/lib
- **Acceptance:** Logging treatments and symptoms yields an on-device analysis/export; OAuth agenda load and task actions use only the granted personal task scope.
- **Roadmap:** shipped foundation; selected capture/approval is OPT-EXT-02
- **Notes:** It is not currently a private-message capture tool or browser-control agent.

### OPT-EXT-02 — Selected browser capture, local review, and approvals

- **Layer:** personal / organization
- **Status:** planned
- **Summary:** The extension becomes the browser-facing Digital Twin Safe: explicit selected-content or file capture, local OpenAI-compatible extraction, human-reviewed task candidates, and exact immutable outbound-action approvals. No ambient history permission, persistent scraping, or general browser automation.
- **Evidence:** approved contract in docs/plans/phased-approach-optimitron.md; current manifest lacks `activeTab` and `scripting`, and no capture/review/approval modules exist
- **Acceptance:** A Chrome integration test proves raw selected text goes only to the configured localhost companion, and only reviewed safe candidates reach Optimitron; payload changes invalidate outbound approval.
- **Roadmap:** now — after the private import and approval APIs

### OPT-AGENT-01 — Autonomous policy analyst (agent package)

- **Layer:** cross-cutting
- **Status:** partial
- **Summary:** Discovery→plan→execute→interpret→verify orchestration with guardrails (rate/spend/time limits), legislation drafting, CI triage — runnable as CLI, unit-tested, but not invoked by CI and its on-chain identity (ERC-8004) was never registered.
- **Evidence:** packages/agent/src/orchestrator.ts; ci-triage-cli.ts; guardrails.ts; absence from .github/workflows verified
- **Acceptance:** The orchestrator runs a scheduled analysis end-to-end in CI (or cron) and publishes a verifiable receipt.
- **Roadmap:** later

### OPT-AGENT-02 — Approval-gated agent task execution

- **Layer:** personal / org
- **Status:** partial
- **Summary:** Agents pull from getAIQueue under lease-based coordination (acquire/heartbeat/release), and task applications have a review flow — but no generalized propose → user-approve → execute gate exists for externally-effectful actions.
- **Evidence:** packages/web/src/lib/tasks/agent-lease.server.ts; `getAIQueue`, `reviewTaskApplication` in packages/web/src/lib/mcp-server.ts; absence of a propose/approve/execute gate verified
- **Acceptance:** An agent proposing an externally-visible action (send email, spend money) blocks until the owner approves the concrete action; approval and execution are auditable.
- **Roadmap:** now — companion loop stage 4

### OPT-INTG-01 — Notion import

- **Layer:** personal
- **Status:** partial
- **Summary:** Lossless normalized Notion bundles dry-run and idempotently import pages, databases, records, views, private files, people, organizations, and draft tasks with workspace-scoped source keys and source artifacts. Formula and rollup definitions plus current outputs are preserved but not executed. A live Notion API client/OAuth connection is still absent.
- **Evidence:** packages/web/src/lib/notion-import.schema.ts; packages/web/src/lib/notion-import.server.ts; packages/web/scripts/import-notion-bundle.ts; packages/web/src/lib/**tests**/fixtures/notion-operational-workspaces.ts; @notionhq/client absent from every package.json
- **Acceptance:** Connecting a Notion workspace yields deduplicated task-import proposals that update on source edits.
- **Roadmap:** foundation implemented; live connector later

### OPT-INTG-03 — Reviewed private conversation-to-work ingestion

- **Layer:** personal / organization
- **Status:** planned
- **Summary:** A channel-neutral reviewed import path for explicitly selected Discord, Telegram, WhatsApp, email, Slack, meeting-note, Notion-comment, and GitHub-discussion context. Raw private text is local by default; the server retains safe hashes, anchors, approved excerpts, candidates, and provenance.
- **Evidence:** reusable `SourceArtifact`/`TaskSourceArtifact`, proposal-bundle, and Notion-import foundations; approved contract in docs/plans/phased-approach-optimitron.md; no safe private-source ownership or channel importer currently ships
- **Acceptance:** Review/apply is hash-sealed, idempotent, atomic, private, source-linked, and creates every grounded nonduplicate action as `ACTIVE`; duplicates gain links, ambiguity gains clarification tasks, and unreviewed text never leaves the device.
- **Roadmap:** now — after OPT-TASK-08 authorization and roots

### OPT-CONTENT-01 — Documents and bounded collections

- **Layer:** personal / org
- **Status:** implemented
- **Summary:** Stable Markdown documents with immutable revisions and Notion-style table collections support typed fields, canonical entity links, inline editing, sorting, filtering, search, column visibility, saved views, optimistic concurrency, transactional batch writes, scoped sharing, audit events, and private attachments. Formula/rollup fields are preserved snapshots; generic formula execution, collaborative block editing, and generic automations are deliberately excluded.
- **Evidence:** packages/db/prisma/schema.prisma (`Document`, `DocumentRevision`, `Collection*`, `ContentAccessGrant`, `ContentAttachment`); packages/web/src/lib/documents.server.ts; packages/web/src/lib/collections.server.ts; packages/web/src/components/collections/collection-records-grid.tsx; packages/web/src/lib/content-access.server.ts; packages/web/src/lib/content-search.server.ts; REST/OpenAPI/MCP tests
- **Acceptance:** A user can create and share a document or collection, edit and query table records without conflicts or authorization leaks, and retrieve a private file only through an authorized short-lived URL.
- **Roadmap:** shipped foundation — expand only for migrated workflows

## Knowledge, verification, improvement, and sustainability

### OPT-KNOW-01 — Reusable entity knowledge

- **Layer:** personal / organization
- **Status:** partial
- **Summary:** Reviewed text and narrative answers belong to a person or organization and are reusable across applications, surveys, RFPs, intake forms, and questionnaires. Stable knowledge keys safely bridge differently worded prompts; exact prompt matching remains the fallback. The generic versioned form schema preserves free-form surveys, typed fields, sections, options, validation, anonymous responses, and exact submissions without duplicating reviewed answers. The current service prepares reviewed narrative answers; a generic form builder and create/publish/respond API do not yet ship. Signatures, uploads, conditional behavior, and scoring remain outside it.
- **Evidence:** packages/db/prisma/schema.prisma (`Form*`, `KnowledgeAnswer`); packages/web/src/lib/form-responses.server.ts; packages/web/src/lib/mcp-tools/form-responses.ts; packages/web/src/lib/form-responses.server.test.ts; Task, DocumentRevision, TaskExecutionArtifact, TaskVerification, and ExternalActionRequest models
- **Acceptance:** A longevity-fellowship application reuses an accepted answer, records its exact revision, approval, form hash, execution attempt, and destination, creates a small blocking review task for an unknown answer, and later reuses the same answer in another application without duplication.
- **Roadmap:** pilot the MCP loop with real EOS applications and another form type; add richer validity, supersession, provenance, and receipt-driven completion only where a pilot exposes a concrete gap

### OPT-EPI-01 — Authority-aware collective verification

- **Layer:** cross-cutting
- **Status:** planned
- **Summary:** Comment reactions may rank helpfulness or attention, while operational truth and acceptance remain a separate authority-, provenance-, freshness-, conflict-, and evidence-aware verification decision.
- **Evidence:** target contract in PRD §9.6; TaskComment and typed TaskVerification foundations; production task `optimitron:dev:product-constitution:approve-schema-work`; no public reputation or consensus weighting ships
- **Acceptance:** A popular but unauthorized or stale comment cannot verify an answer or task; an authorized verifier can accept or supersede a sourced answer with an auditable reason.
- **Roadmap:** next — private owner-authorized verification first; public consensus later

### OPT-LOOP-01 — Auditable product self-improvement loop

- **Layer:** cross-cutting
- **Status:** planned
- **Summary:** Telemetry produces a proposed improvement, a ranked task, execution evidence, a verified outcome, and recalibration through the ordinary task lifecycle instead of a campaign-specific parallel reasoning system.
- **Evidence:** target contract in PRD §9.7; task, impact, attempt, artifact, and verification foundations; the legacy campaign-specific reasoning subsystem and its schema were removed; the end-to-end recalibration loop does not ship
- **Acceptance:** A measured workflow failure creates a sourced improvement task, the implementation records an artifact and outcome, and the verified result updates the relevant estimate without self-approval.
- **Roadmap:** next — close one measured loop through the ordinary task lifecycle

### OPT-BIZ-01 — Financially sustainable verified-work pilots

- **Layer:** organization
- **Status:** planned
- **Summary:** Bounded paid organization workflows fund EOS operations through measured verified-work gross margin without selling truth, public priority, or nonprofit campaign influence.
- **Evidence:** target contract in PRD §9.8; existing task listings, compensation, applications, artifacts, and verification foundations; no qualifying paid pilot or operating-margin proof ships
- **Acceptance:** A named customer pays for a bounded workflow whose costs, receipts, verified deliverable, and gross margin are recorded, with commercial funds kept separate from Accelerated Medicine Foundation campaign donations.
- **Roadmap:** later — one design-partner workflow, then a small paid pilot

### OPT-INTG-02 — Google Calendar import

- **Layer:** personal
- **Status:** vision
- **Summary:** Calendar events become fixed commitments for the execution planner. The planner accepts calendar-shaped data today (`fixedCommitments`); no Google API client, OAuth scope, or sync exists.
- **Evidence:** `normalizeCalendarForPlanning` in packages/web/src/lib/tasks/execution-source-normalization.ts + tests; googleapis absent from every package.json
- **Acceptance:** A connected calendar's events appear as fixed commitments in getExecutionPlan without manual entry.
- **Roadmap:** later — after companion loop stages 1–2

### OPT-API-01 — Developer OAuth/OpenAPI surface

- **Layer:** cross-cutting
- **Status:** implemented
- **Summary:** Open signup: OAuth authorization-code + PKCE, dynamic client registration, token rotation/revocation; /openapi.json and /developers; MCP and REST share one scope catalog. Anyone can connect an MCP client today.
- **Evidence:** packages/web/src/app/openapi.json/route.ts (+ test); packages/web/src/app/developers/page.tsx; packages/web/src/lib/mcp-oauth.ts; packages/web/src/lib/mcp-scopes.ts
- **Acceptance:** A third-party client completes OAuth, calls a scoped MCP tool, and is rejected on out-of-scope tools.
- **Roadmap:** shipped — maintain (further items in DEVELOPER_API_PLAN.md)

### OPT-DATA-01 — Dataset layer

- **Layer:** cross-cutting
- **Status:** implemented
- **Summary:** Vendored economic-data snapshot (65 CSVs) with catalog, plus fetchers and parameter corpus with citations; docs in DATA_SOURCES.md.
- **Evidence:** packages/data/economic-data/data/ (65 CSVs); packages/data/src/catalog.ts; packages/data/src/parameters/parameters-calculations-citations.ts
- **Acceptance:** Catalog entries resolve to on-disk data; parameter constants carry citations.
- **Roadmap:** shipped — maintain

### OPT-PLAT-01 — Task dossier block components

- **Layer:** platform
- **Status:** dead
- **Summary:** Twelve components under components/tasks/blocks/ (TaskUnlocks, TaskCostOfDelay, TaskPerformanceReview, …) map 1:1 to contextJson slots that seed data and MCP docs populate — but no page imports any of them; the task detail page never renders the dossier.
- **Evidence:** packages/web/src/components/tasks/blocks/ (12 files); zero real imports verified repo-wide (only doc-string mentions in mcp-server.ts / task-context.ts)
- **Acceptance:** n/a (dead) — either the task page renders the dossier or the components and their contextJson slots are removed.
- **Roadmap:** cleanup item #2 in ROADMAP.md Appendix A — decide render-or-remove
