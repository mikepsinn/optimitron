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
(2026-07-11).

---

## Task system

### OPT-TASK-01 — Task engine: CRUD, claims, comments, marketplace
- **Layer:** personal / org
- **Status:** implemented
- **Summary:** Full task lifecycle over MCP (~110 tools) and REST: create/update/delete, claim → complete → verify, threaded comments, applications and candidate matching, org ownership.
- **Evidence:** packages/web/src/lib/mcp-server.ts; packages/web/src/lib/tasks.server.ts (`createTask`); packages/web/src/lib/tasks/task-comments.server.ts; tests: packages/web/src/lib/__tests__/mcp-server.test.ts, __tests__/tasks.server.test.ts, __tests__/task-comments.server.test.ts
- **Acceptance:** An MCP client can create a task under an explicit parent, claim it, complete the claim, and read the comment thread — all persisted.
- **Roadmap:** shipped — maintain

### OPT-TASK-02 — Dependency graph (TaskEdge) with blocker gating
- **Layer:** personal / org
- **Status:** implemented
- **Summary:** Directed edges (DEPENDS_ON / BLOCKS / INCREASES_PROBABILITY_OF / ACCELERATES) with probability/time-delta triples; blocked tasks are excluded from execution queues.
- **Evidence:** packages/db/prisma/schema.prisma (`model TaskEdge`, `enum TaskEdgeType`); `getBlockers` tool in packages/web/src/lib/mcp-server.ts; `isTaskBlocked` in packages/web/src/lib/tasks/rank-tasks.ts; packages/web/src/lib/tasks/marginal-impact.ts + test
- **Acceptance:** A task with an unverified DEPENDS_ON blocker does not appear in getMyQueue; verifying the blocker makes it appear.
- **Roadmap:** shipped — maintain
- **Notes:** Managed/seed data contains zero edges; the graph is populated only at runtime by explicit MCP calls.

### OPT-TASK-03 — Trigger/spawn automation engine
- **Layer:** cross-cutting
- **Status:** implemented
- **Summary:** Data-driven triggers fire on named events (user signup, cron, task status changes), template-substitute into spawned tasks or outbound communications, with idempotency keys and completion gates. Backbone of treaty signer-reminder flows.
- **Evidence:** packages/web/src/lib/triggers/admin.ts; packages/web/src/lib/triggers/fire.ts; tests: triggers/__tests__/fire.integration.test.ts, triggers/__tests__/one-percent-treaty-blueprints.test.ts
- **Acceptance:** Firing a trigger for a matching event spawns the specified task exactly once (idempotent on re-fire).
- **Roadmap:** shipped — maintain
- **Notes:** "TaskTemplate" MCP tools are a facade over TaskTrigger rows (`metadata.taskTemplateFacade`), not a second engine.

### OPT-TASK-04 — Queue audit graph linter
- **Layer:** personal / org
- **Status:** implemented
- **Summary:** Validates the execution graph: cycles, unrooted tasks, non-atomic tasks in queues, missing marginal estimates, invalid/unannotated value edges, nondeterministic ties.
- **Evidence:** packages/web/src/lib/tasks/execution-planner-audit.ts (`auditExecutionGraph`); execution-planner-audit.test.ts; wired into `getQueueAudit` in packages/web/src/lib/mcp-server.ts
- **Acceptance:** Introducing a dependency cycle yields a DEPENDENCY_CYCLE finding from getQueueAudit.
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
- **Summary:** The MCP createTask tool requires an explicit parentTaskId and rejects direct attachment to the optimize-earth root; agents are instructed to searchTasks first. No automated best-parent matching exists, and the non-MCP path still defaults to root.
- **Evidence:** `validateExplicitTaskParent` in packages/web/src/lib/mcp-server.ts (throws on root); packages/web/src/lib/tasks.server.ts `createTask` (`parentTaskId: input.parentTaskId ?? OPTIMIZE_EARTH_ROOT_TASK_ID`)
- **Acceptance:** No user-created task attaches to the root by default on any path, and new tasks receive a ranked parent suggestion from tree search.
- **Roadmap:** next — companion loop; root-default inconsistency is cleanup item #4 in ROADMAP.md Appendix A
- **Notes:** Gap is path-specific: MCP enforces, REST/feedback (`feedback.server.ts`) silently roots.

### OPT-TASK-07 — AI decomposition into atomic subtasks
- **Layer:** personal
- **Status:** partial
- **Summary:** proposeTaskBundle accepts multi-task decompositions and the audit flags non-atomic tasks in queues (EXECUTABLE_PARENT), but decomposition is agent-prompted via tool descriptions — there is no automated splitter or confirm-flow.
- **Evidence:** `proposeTaskBundle` in packages/web/src/lib/mcp-server.ts; `EXECUTABLE_PARENT` finding in packages/web/src/lib/tasks/execution-planner-audit.ts + test
- **Acceptance:** Given "apply for an SFF grant," the system proposes atomic subtasks (draft, budget, reference, submit), the user confirms, and the children are created with edges.
- **Roadmap:** next — companion loop

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
- **Status:** dead
- **Summary:** Schema for scheduled health-variable reminders ("rate mood daily at 8am") with zero application usage: no scheduler, no UI, no trigger reads it.
- **Evidence:** packages/db/prisma/schema.prisma (`TrackingReminder`, `TrackingReminderNotification`); zero non-generated references verified repo-wide
- **Acceptance:** n/a (dead) — successor acceptance lives in OPT-HEALTH-06.
- **Roadmap:** decision recorded in ROADMAP.md companion-loop track: revive with a scheduler, or supersede via TaskTrigger cron (OPT-TASK-03) and drop the model.

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
- **Evidence:** absence verified in packages/web/src/lib/triggers/ and app/api/cron/run-due-triggers/route.ts (no cron.* trigger spawning measurement tasks)
- **Acceptance:** A daily mood-rating task appears in getMyQueue each morning; completing it writes a Measurement and the next occurrence schedules itself.
- **Roadmap:** now — companion loop stage 1 (implementation decision: TaskTrigger cron vs TrackingReminder revival)

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
- **Roadmap:** now — campaign track (operational-surface rework queued in TODO.md)

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
- **Summary:** Standalone MV3 tracker: treatment reminders (chrome.alarms), symptom/mood/food logging, JSON/CSV export, and on-device causal analysis via the optimizer in a Web Worker. All data stays local; never touches the server or the Measurement model. Zero tests.
- **Evidence:** packages/extension/src/workers/analysis.worker.ts (imports `runFullAnalysis` from @optimitron/optimizer); src/background/service-worker.ts; src/lib/storage.ts
- **Acceptance:** Logging treatments+symptoms for a period yields an on-device analysis report; export produces optimizer-compatible CSV.
- **Roadmap:** shipped — test coverage queued in ROADMAP.md Appendix A
- **Notes:** Deliberately disconnected from the web account system (privacy by architecture).

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
- **Status:** vision
- **Summary:** Notion pages become task/commitment proposals with stable source keys, change detection, and duplicate collapsing. The pure normalization layer exists and is pilot-tested against realistic fixtures; no Notion API client exists anywhere.
- **Evidence:** packages/web/src/lib/tasks/execution-source-normalization.ts (`normalizeNotionPlanningItems`) + tests; @notionhq/client absent from every package.json
- **Acceptance:** Connecting a Notion workspace yields deduplicated task-import proposals that update on source edits.
- **Roadmap:** later — after companion loop stages 1–2

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
