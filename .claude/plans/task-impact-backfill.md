## Research log

- Read `.claude/codex-delegation.md`. The Plan-first protocol requires this section order: Research log first, then Brief, current/proposed ASCII diagrams, step list, risks, files to touch, ALERTS, and Agent log.
- Read `TODO.md:118-125`. Current recommendation is to show "—" for tasks without their own `impact.selectedFrame`; parent inheritance creates child aggregation double-counting.
- Read `packages/db/src/managed-data/optimize-earth-task-tree.ts`. Current checkout has 13 active canonical records plus 2 retired records, not 50+ active entries in this file. Every active canonical child has `impactStatement` prose. Only root/treaty impact frames are written elsewhere.
- Read `packages/db/src/managed-data/managed-seed-data.ts:1230-1275`. Canonical root and treaty impact estimates use parameter-backed lifetime DALYs/economic value plus per-day delay rates.
- Read `packages/db/src/managed-data/managed-seed-data.ts:1277-1409`. Foundation grant tasks are dynamic treaty children with their own $1 grant impact estimate: `IC2EWD_GRANT_DALYS_PER_USD`, economic value per DALY, one-year benefit duration, and `icewad-one-dollar-grant` methodology.
- Read `packages/db/src/managed-data/managed-seed-data.ts:1411-1594`. Treaty signer tasks are dynamic treaty children with their own impact estimates, currently split by `1 / leaderCount` and using `treaty-per-country-lifetime`.
- Read `packages/db/src/managed-data/managed-seed-data.ts:1623-1765`. The helper in this checkout is named `createTaskWithImpact` plus `syncTaskImpactEstimate`, not `upsertCanonicalTaskImpact`. It upserts the task, deletes old estimate sets for that task, creates a fresh current `TaskImpactEstimateSet`, and creates one `LIFETIME` frame.
- Read `packages/web/src/lib/tasks/accountability.ts:131-175`. `getTaskDelayStats` consumes `task.impact.selectedFrame`, multiplies frame per-day delay rates by `currentDelayDays`, and returns null delay values when the frame/rates are absent.
- Read `packages/web/src/lib/tasks.server.ts:550-587` and `:733-750`. The current decorator still builds a parent-inherited impact frame when a task lacks a direct frame, which conflicts with the TODO recommendation.
- Read `packages/web/src/lib/tasks/impact.ts:113-155`. `selectImpactFrame` returns `selectedFrame: null` when no current estimate set exists; this is the clean "show em dash" state.
- Read `packages/db/src/managed-data/managed-task-triggers.ts:151-274` and `:281-354`. Generated user treaty/referral/reminder subtasks exist outside `optimize-earth-task-tree.ts`; most are action/process tasks, not measured impact units.
- Read `packages/data/src/parameters/parameters-calculations-citations.ts` entries for `GLOBAL_REGISTERED_VOTERS`, `VOTER_LIVES_SAVED`, and `VOTER_SUFFERING_HOURS_PREVENTED`. These support a future per-verified-voter estimate, but not every outreach task has a defensible conversion probability.
- No web/vendor documentation research was needed for this plan because the work is repo-internal managed data and UI behavior, not a third-party API/SDK/tool integration. If implementation changes external citations or imports fresh public data, source research belongs in that implementation pass before coding.

## Brief

Backfill task impact data only where the task has a defensible, non-duplicative estimate. Keep the existing "show —" policy for tasks without direct impact frames. Do not make parent/task-container impact inherit into children, because child aggregation would multiply the parent value and make dashboards lie.

Recommendation: accept option (a). Use explicit direct estimates for a curated subset of leaf-like tasks with measurable units, and keep container/process/legal tasks empty until Mike approves a causal probability or time-acceleration model. For the current canonical tree, the defensible subset is root, treaty parent, dynamic treaty signer tasks, dynamic grant tasks, and a later per-verified-voter/referral leaf family. The current Court / prosecution / plaintiff / evidence / verdict / settlement containers should stay empty in Phase 1.

## Current state ASCII diagram

```text
Optimize Earth
  impact.selectedFrame = yes
  methodology = earth-optimization-prize-win-condition
  |
  +-- End War and Disease
      impactStatement = yes
      impact.selectedFrame = no
      |
      +-- Establish the Court of Humanity
      |   impactStatement = yes
      |   impact.selectedFrame = no
      |   |
      |   +-- Adopt the Court of Humanity charter
      |   |   impactStatement = yes
      |   |   impact.selectedFrame = no
      |   |
      |   +-- Prosecute Humanity v. Government
      |       impactStatement = yes
      |       impact.selectedFrame = no
      |       |
      |       +-- Register plaintiffs
      |       |   impactStatement = yes
      |       |   impact.selectedFrame = no
      |       +-- Summon jurors
      |       |   impactStatement = yes
      |       |   impact.selectedFrame = no
      |       +-- Publish evidence and damages
      |       |   impactStatement = yes
      |       |   impact.selectedFrame = no
      |       +-- Render the verdict
      |       |   impactStatement = yes
      |       |   impact.selectedFrame = no
      |       +-- Enforce the settlement: the 1% Treaty
      |           impactStatement = yes
      |           impact.selectedFrame = no
      |
      +-- Ratify the 1% Treaty
          impact.selectedFrame = yes
          methodology = treaty-lifetime-parameters
          |
          +-- Get a majority of humanity to vote yes
          |   impactStatement = yes
          |   impact.selectedFrame = no
          +-- Get 193 heads of government to sign
          |   impactStatement = yes
          |   impact.selectedFrame = no
          +-- 1-pct-treaty-signer-* dynamic children
          |   impact.selectedFrame = yes
          |   methodology = treaty-per-country-lifetime
          +-- icewad-grant-* dynamic children
              impact.selectedFrame = yes
              methodology = icewad-one-dollar-grant

ALL other children have impactStatement prose but no direct impact.selectedFrame.

UI caveat: packages/web/src/lib/tasks.server.ts currently fabricates parent-inherited
frames for children without direct frames, so the rendered state may not match the
data model until inheritance is removed/disabled.
```

## Proposed state ASCII diagram

```text
Optimize Earth
  direct impact frame: keep existing root lifetime estimate
  methodology: parameter-backed earth optimization prize win condition
  |
  +-- End War and Disease
      direct impact frame: none, render "—"
      methodology: container only; avoid duplicating root/treaty value
      |
      +-- Court / charter / case / plaintiffs / jurors / evidence / verdict
      |   direct impact frame: none, render "—"
      |   methodology: process/legal containers; no approved causal share yet
      |
      +-- Enforce the settlement: the 1% Treaty
      |   direct impact frame: none in Phase 1, render "—"
      |   methodology: duplicate of treaty outcome unless Mike approves an
      |   explicit settlement-gate probability/time-delta model
      |
      +-- Ratify the 1% Treaty
          direct impact frame: keep existing treaty lifetime estimate
          methodology: treaty-lifetime-parameters
          |
          +-- Get a majority of humanity to vote yes
          |   Phase 1: no aggregate direct frame, render "—"
          |   Phase 2: add direct frames only to per-voter/per-referral leaves
          |   methodology: treaty impact / GLOBAL_REGISTERED_VOTERS, with
          |   VOTER_LIVES_SAVED and VOTER_SUFFERING_HOURS_PREVENTED metrics
          |
          +-- Get 193 heads of government to sign
          |   Phase 1: no aggregate direct frame, render "—"
          |   child leaves: signer tasks keep direct estimates
          |   methodology: signer leaf share of treaty lifetime impact
          |
          +-- 1-pct-treaty-signer-* dynamic children
          |   direct impact frame: keep; consider later review of equal-share
          |   versus military-budget-weighted share before changing visible values
          |   methodology: treaty-per-country-lifetime
          |
          +-- icewad-grant-* dynamic children
          |   direct impact frame: keep
          |   methodology: grant amount x parameter-backed DALYs/USD
          |
          +-- generated referral invitation / verified-voter leaves
              Phase 2 direct impact frame: add only when the task represents
              one verified vote or a forecast with an explicit conversion rate
              methodology: treaty impact / GLOBAL_REGISTERED_VOTERS; no parent
              inheritance; no value on generic share/call/process subtasks
```

## Step list

- [ ] Re-read this plan and the `## ALERTS` section before touching files.
- [ ] Confirm the current task inventory from `packages/db/src/managed-data/optimize-earth-task-tree.ts` and note the prompt/current-file mismatch: 13 active canonical records plus 2 retired records in this checkout, not 50+ active records in that file.
- [ ] Preserve the existing root and treaty parent impact writes in `seedTreatyAccountabilityData` without changing their methodology keys or visible values.
- [ ] Preserve dynamic foundation grant impact estimates in `createTaskWithImpact`; do not fold them into an aggregate parent value.
- [ ] Preserve dynamic treaty signer impact estimates in `createTaskWithImpact`; before changing equal-share signer allocation, get Mike approval because budget-weighting would materially change public leader rankings.
- [ ] Remove or disable parent-inherited frame construction in `packages/web/src/lib/tasks.server.ts` so a task without a direct current estimate set renders no selected frame instead of a scaled parent share.
- [ ] Keep downstream edge-derived value separate from parent inheritance. If implementation keeps `buildDownstreamUnlockedImpactFrame`, verify it only reflects explicit task edges with probability/time-delta values, not hierarchy.
- [ ] Add a focused regression test that a child task with no direct `currentImpactEstimateSet` and a parent with an impact frame has `impact.selectedFrame === null` unless an explicit downstream edge supplies value.
- [ ] Add a focused accountability test that `getTaskDelayStats` returns null per-day/current delay values when `impact.selectedFrame` is absent, even if `dueAt` is overdue.
- [ ] Add a small managed-data test or seed dry-run assertion for the curated policy: root/treaty/signers/grants have direct frames; canonical court/case/process containers do not.
- [ ] Phase 1 data backfill: no new canonical court/case/process child frames. This is intentional; the em dash is the honest state.
- [ ] Phase 2 data backfill, only after Mike approves the modeling decision: add per-verified-voter/referral leaf impact estimates using `GLOBAL_REGISTERED_VOTERS`, `VOTER_LIVES_SAVED`, `VOTER_SUFFERING_HOURS_PREVENTED`, treaty lifetime DALYs/economic value, and an explicit conversion probability when the task is a forecast rather than an observed converted vote.
- [ ] Document each methodology key in seed assumptions JSON or source artifacts so future UI can explain why a task has a number or why it shows "—".
- [ ] Run focused tests only: managed-data tests for task tree/seed policy, `packages/web/src/lib/tasks/impact.test.ts`, `packages/web/src/lib/tasks/accountability.test.ts`, and the relevant `tasks.server` test. Do not run `pnpm build` or `next build`.
- [ ] If implementation changes task UI output, reuse the dev server at `http://127.0.0.1:3001`, capture screenshots, update `packages/web/output/playwright/review/latest.html`, and wait for Mike's screenshot approval before any commit.

## Risks

- Parent inheritance already exists in `tasks.server.ts`; leaving it in place would undermine the data backfill by continuing to show synthetic child values.
- Adding full treaty/root value to several canonical children would double-count immediately in child summaries and any future aggregate rollups.
- Adding arbitrary shares to Court/prosecution/plaintiff/evidence/verdict tasks would look precise but mostly encode taste. Those should stay empty until there is an explicit probability-delta or time-delta model.
- Signer tasks currently split treaty impact equally across leaders. Budget-weighting may be more intuitive for military-spend redirection, but it changes public ordering and should be a separate approved methodology change.
- Referral/voter tasks have parameter-backed per-voter values, but pending invitations need a conversion probability. Using observed per-voter value on unfinished forecast tasks would overstate expected value.
- `syncTaskImpactEstimate` deletes old estimate sets before creating fresh ones. That is current pattern, but implementation should avoid calling it for tasks that intentionally have no estimate.
- No Prisma schema or exported `@optimitron/db` type changes should be needed. If implementation discovers one, stop for explicit human approval.

## Files to touch

- `packages/web/src/lib/tasks.server.ts` - remove/disable parent hierarchy impact inheritance and keep explicit downstream edge behavior separate.
- `packages/web/src/lib/__tests__/tasks.server.test.ts` - regression coverage for no parent inheritance.
- `packages/web/src/lib/tasks/accountability.test.ts` - regression coverage for missing selected frame returning null delay values.
- `packages/db/src/managed-data/managed-seed-data.ts` - only if adding Phase 2 vetted leaf estimates or documenting methodology assumptions; Phase 1 should mostly preserve existing root/treaty/signer/grant writes.
- `packages/db/src/managed-data/optimize-earth-task-tree.test.ts` or a new focused managed-data test - assert the curated direct-frame policy for canonical tasks.
- `packages/db/src/managed-data/managed-task-triggers.ts` - only in Phase 2 if generated voter/referral leaves need explicit impact metadata or methodology hooks.
- `packages/data/src/parameters/parameters-calculations-citations.ts` - do not edit for Phase 1; use existing parameters if Phase 2 per-voter estimates are approved.

## ALERTS

## Agent log

## Codex critique (round 1)

### Parent-inheritance ratification

The plan does address the core contradiction. It does not merely ratify "show —" while leaving parent inheritance untouched: the step list explicitly says to remove or disable parent-inherited frame construction in `packages/web/src/lib/tasks.server.ts`, and the risk section says leaving it in place would undermine the backfill.

That said, "remove or disable" is too soft for this policy. The implementation target should be deletion of the hierarchy fallback, not a branch that still exists behind an option. The code path is concrete:

- `buildParentInheritedImpactFrame` at `tasks.server.ts:550-587` reads the parent estimate, divides it by sibling count, labels it "Inherited from parent task ...", and returns a synthetic frame.
- `decorateTask` at `tasks.server.ts:737-750` injects that synthetic frame whenever the task lacks a direct selected frame.
- `taskListSelect.parentTask` currently pulls `childTasks` and `currentImpactEstimateSet` mostly to support that synthetic path. If parent inheritance is removed, keep only the minimal parent fields needed by UI navigation, not the impact estimate and sibling count payload.

The plan should make the acceptance criterion sharper: a task with no direct current estimate set and no explicit downstream value must produce `impact.selectedFrame === null`. No "parent-share" frame slug, no inherited label, no hidden option.

There is a second inheritance-like path the plan mentions but underplays. `buildDownstreamUnlockedImpactFrame` currently pushes the full downstream frame when an outgoing `BLOCKS` or `DEPENDS_ON` edge has neither `probabilityDeltaBase` nor `timeDeltaDaysBase` (`tasks.server.ts:673-675`). That means a task can still display another task's impact without an explicit probability/time-delta model. The plan says to keep downstream edge-derived value separate, but it should explicitly require removing this full-frame fallback too, or the "show — unless explicitly modeled" policy is still leaky.

### Curated subset

The curated subset is mostly defensible against the current source tree. `optimize-earth-task-tree.ts` has 13 active canonical records plus 2 retired records. Among the active canonical records, the obvious direct-impact holders are:

- `Optimize Earth`, because it is the root civilizational objective and already has the prize/win-condition estimate.
- `Ratify the 1% Treaty`, because it is the concrete campaign outcome and already has the treaty lifetime estimate.
- Dynamic signer children, because each is an assigned, measurable government-signature unit.
- Dynamic foundation grant children, because each is a concrete $1 grant unit with its own cost-effectiveness math.

I do not see a current canonical task in `optimize-earth-task-tree.ts` that obviously deserves a Phase 1 direct estimate and is missing from that subset. The Court/prosecution/plaintiff/evidence/verdict/settlement records are containers or process steps unless Mike approves a causal probability or time-acceleration model. `Get a majority of humanity to vote yes` and `Get 193 heads of government to sign` are also aggregate containers if the plan keeps impact on per-voter and per-signer leaves.

The plan should say that more explicitly, because these rows look like "missing data" to a future implementer:

- `Summon jurors` and `Render the verdict` sound vote-adjacent, but they are not one verified vote.
- `Get a majority of humanity to vote yes` is the aggregate target, not a single voter leaf.
- `Get 193 heads of government to sign` is the aggregate target, not a single signer leaf.
- `Enforce the settlement: the 1% Treaty` duplicates the treaty outcome unless it gets its own settlement-gate model.

Also be precise about scope: signers and grants are not active canonical records in `optimize-earth-task-tree.ts`; they are dynamic managed tasks from `managed-seed-data.ts`. The policy is cross-managed-data, not just a curated subset of that one tree file.

### Verified-voter leaf math

This is the weakest part of the plan. It names `GLOBAL_REGISTERED_VOTERS`, `VOTER_LIVES_SAVED`, and `VOTER_SUFFERING_HOURS_PREVENTED`, but it does not actually specify the frame math needed by `TaskImpactFrameEstimate`.

For a completed verified-voter leaf, the DALY/economic frame should be pinned down before implementation. Based on current parameter values:

- `expectedDalysAvertedBase = DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS / GLOBAL_REGISTERED_VOTERS`, about `136.924` DALYs per verified voter.
- `expectedEconomicValueUsdBase = DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE / GLOBAL_REGISTERED_VOTERS`, about `$20.54M` per verified voter.
- `delayDalysLostPerDayBase = (GLOBAL_ANNUAL_DALY_BURDEN * EVENTUALLY_AVOIDABLE_DALY_PCT / 365) / GLOBAL_REGISTERED_VOTERS`, equivalently roughly `totalDalys / accelerationYears / 365 / voters`, about `0.00177` DALYs per voter-day.
- `delayEconomicValueUsdLostPerDayBase = delayDalysLostPerDayBase * STANDARD_ECONOMIC_QALY_VALUE_USD`, about `$265.6` per voter-day.

`VOTER_LIVES_SAVED` and `VOTER_SUFFERING_HOURS_PREVENTED` are useful additional metrics, not substitutes for the DALY/economic fields. `VOTER_LIVES_SAVED` is about `2.603` lives per verified voter from a separate lives model; it does not equal `DALYs / 40` from the task row's display heuristic, which would be about `3.423`. The plan needs to prevent those two interpretations from being silently mixed.

The plan also needs to decide how forecast tasks differ from observed converted votes. If a pending invitation has a 10% conversion probability, does the implementation scale every frame value by `0.10`, set `successProbabilityBase = 0.10`, or both? The current seed pattern stores full treaty/signer values and a separate `successProbabilityBase`, so this semantic choice cannot be left to the implementer.

### Phase 1 UX

Phase 1's data policy is honest, but the display plan is incomplete. Removing parent inheritance means the Humanity v. Government task-detail rows for `Register plaintiffs`, `Summon jurors`, `Publish evidence and damages`, `Render the verdict`, and `Enforce the settlement: the 1% Treaty` will have no direct impact frame. In the current default task row, desktop still renders static `Deaths From Delay` and `Wasted By Delay` columns, and cells without values render `—`.

That is acceptable as a temporary truth state only if the UI makes it clear that these are unestimated containers, not low-value tasks. Otherwise the first task-tree dashboard for the legal case becomes a table of dashes under the most emotionally loaded columns.

The plan should pull the existing TODO display rule into Phase 1: hide a task-table impact column when no row in that rendering has a value, or add a compact "impact not directly estimated" affordance for container rows. Do not wait for Phase 2 to address this if the first implementation removes inheritance; the visual regression happens immediately.

The plan should also require a local screenshot for the affected task detail page after removing inheritance. This is a UI behavior change even if the data seed is unchanged.

### Test impact

The plan says to add tests, but it does not enumerate what existing tests are likely to break or remain blind. Based on the current tests:

- `packages/web/src/lib/__tests__/tasks.server.test.ts` currently has visibility/create/claim tests, but no assertion for `decorateTask` impact selection, parent inheritance, or `parent-share`. Removing inheritance probably will not break this file today; it needs new coverage.
- `packages/web/src/lib/tasks/accountability.test.ts` tests `getTaskDelayStats` with a populated selected frame and aggregation, but not the absent-frame overdue case. Removing parent inheritance does not directly break it; the needed test is a new guard for null delay values when `impact.selectedFrame` is absent.
- `packages/db/src/managed-data/optimize-earth-task-tree.test.ts` only checks root existence, root `dueAt`, and root parenthood. It will not catch a bad curated direct-frame policy unless expanded.
- The broad `rg` pass did not find an existing test asserting "Inherited from parent task", `parent-share`, or a child with no estimate inheriting a parent estimate. That means the current problematic behavior is under-tested rather than protected by tests.
- `rank-tasks` and task-row behavior may change indirectly because tasks without inherited impact will sort/rank at zero for impact/delay fields. The plan should list those suites as smoke candidates if implementation touches ranking or task table display, even if no existing test fails.

So the answer to "will removal break existing tests?" appears to be "probably not, because existing tests do not cover it." The plan should say that plainly and then name the new tests as coverage for a previously unguarded bug.

### Idempotency and migration path

The plan notes that `syncTaskImpactEstimate` deletes old estimate sets and recreates a current one, but it does not give a migration path for Phase 2.

For a task that currently has no impact and later gains one, the mechanical path is straightforward: call `syncTaskImpactEstimate` after the task exists, or use `createTaskWithImpact` for new dynamic leaves. `deleteMany({ taskId })` is a no-op on first backfill, then the helper creates a fresh `TaskImpactEstimateSet` and updates `Task.currentImpactEstimateSetId`.

The missing parts:

- If any task is intentionally supposed to have no direct estimate, the implementation needs an audit/clearing step for stale current estimate sets. "Do not call `syncTaskImpactEstimate`" only preserves the empty state if the DB is already empty.
- If a future phase removes an estimate from a task, the current helper cannot express "clear this task's current impact"; a separate clear helper or seed assertion is needed.
- Because the helper deletes and recreates estimate sets, it is not preserving estimate history despite the schema's "immutable run" wording. That may be fine for seed-owned forecasts, but the plan should call it out as the current seed-sync behavior.
- The Phase 2 owner file is underspecified. Per-voter/referral leaves are likely generated by referral/treaty task code or managed triggers, not `optimize-earth-task-tree.ts`. The plan should name the exact generation path before implementation starts.

### Overall judgment

The direction is solid: direct estimates only where the unit is concrete, no parent hierarchy inheritance, no fake precision on legal/process containers. The plan is not yet implementation-grade because it leaves the math and display behavior too implicit.

## Codex critique summary

Top 3 issues by severity:

1. The plan must explicitly remove both hierarchy inheritance and the full downstream-edge fallback; otherwise tasks can still show synthetic impact without a direct estimate or explicit model.
2. The per-verified-voter Phase 2 math is hand-waved. It must specify DALYs, economic value, per-day delay rates, lives/suffering metrics, and forecast-vs-observed probability semantics.
3. Phase 1 needs a UI display strategy for empty container rows. Showing a table full of `—` under deaths/money columns may be honest, but without column hiding or an "unestimated container" affordance it will look broken.

## Mike approved (round 2 — supersedes my earlier remove-inheritance framing)

Mike's reframe: the goal is motivation to act, not academic data hygiene. Empty cells = "no one knows how important this is" = anti-motivation. Reasonable inferred numbers > blank rows. My earlier recommendation to remove both inheritance paths was wrong — I was optimizing for data purity when the campaign needs motivation.

Approved scope:
1. KEEP the existing inheritance for individual task display (`tasks.server.ts:550-587` parent inheritance + the downstream-edge fallback). Both remain. The dashboard renders a reasonable inferred number for tasks without their own direct impact frame.
2. ADD curated direct impact frames on the canonical tasks where we can do better than inheritance: root + treaty parent + signer tasks + grant tasks + per-verified-voter leaf tasks. These tasks override the inheritance with measured values.
3. Per-verified-voter math = simple division: (treaty total DALYs averted) ÷ (target voter count). Hand-waved but defensible as a first pass. Each verified-voter leaf task gets that per-task delay rate.
4. Aggregation double-counting concern (parent-inherited value summed alongside child-inherited values) is THEORETICAL today — root task has its own direct frame computed from root's per-day rates, NOT a sum of children. If we later add a surface that aggregates child impacts into a parent total, handle the double-count there explicitly. Don't pre-pay engineering cost on a hypothetical bug.
5. Column-hiding still applies when ALL tasks in a list have null for a given column (the rare case where inheritance and direct frames both produce null).

NOT in scope: removing the inheritance paths. NOT in scope: rigorous decision-theoretic per-voter math.

Implementation: focused additions to `packages/db/src/managed-data/optimize-earth-task-tree.ts` plus the per-voter-leaf data path. No removals from `tasks.server.ts`.
