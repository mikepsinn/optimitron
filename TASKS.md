# Optimitron Agent Tasks

Tasks are ordered by priority. Work top-to-bottom. Mark status as you go.

## Status Key
- `todo` — not started
- `in_progress` — currently working on
- `done` — completed
- `blocked` — needs human input

---

## P0: Get It Building

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Fix build — `pnpm build` passing for ALL packages | done | All 6 packages build: causal, wishocracy, opg, obg, data, db. Issue was missing node_modules. |
| 2 | Add vitest config to all packages | done | vitest.config.ts + smoke tests for causal, wishocracy, opg, obg, data. 27 tests passing. |
| 3 | Resolve type errors from `core` → `opg`/`obg` split | done | Types already correctly placed; build passes with strict mode |

## P1: Tests for Existing Code

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4 | Tests for `@optimitron/optimizer` temporal alignment | done | dFDA paper examples |
| 5 | Tests for `@optimitron/optimizer` Bradford Hill scoring | done | |
| 6 | Tests for `@optimitron/optimizer` PIS calculation | done | |
| 7 | Tests for `@optimitron/wishocracy` aggregateComparisons() | done | Wishocracy paper's Alice scenario |
| 8 | Tests for `@optimitron/wishocracy` principalEigenvector() | done | Verified against known AHP examples |
| 9 | Tests for `@optimitron/wishocracy` consistencyRatio() | done | CR < 0.1 for consistent matrices |
| 10 | Tests for `@optimitron/wishocracy` alignment scoring | done | |
| 11 | Tests for `@optimitron/opg` Bradford Hill | done | 213 tests: bradford-hill, welfare, policy, jurisdiction, budget, integration |
| 12 | Tests for `@optimitron/obg` diminishing returns | done | 36 tests: fitLogModel, fitSaturationModel, marginalReturn, findOSL, estimateOSL + edge cases |
| 13 | Tests for `@optimitron/obg` cost-effectiveness | done | 107 additional tests: cost-effectiveness (32), BIS (37), welfare (17), budget schemas (18), smoke (3) |

## P2: RAPPA Math (Wishocracy)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 14 | Statistical convergence analysis | done | `convergence.ts` + tests. Determines how many comparisons → stable weights. |
| 15 | Matrix completion from sparse data | done | `matrix-completion.ts` + tests. Infers missing pairs transitively. |
| 16 | Bootstrap confidence intervals | done | `bootstrap-ci.ts` + tests. 95% CI on preference weights. |
| 17 | Manipulation resistance analysis | done | `manipulation.ts` + tests. Measures how much one strategic voter can shift results. |
| 18 | Random pair selection algorithm | done | `pair-selection.ts` + tests. Optimal sampling strategy from paper. |

## P3: Data Fetchers

| # | Task | Status | Notes |
|---|------|--------|-------|
| 19 | OECD spending data fetcher | done | `fetchers/oecd.ts`, `sources/oecd.ts` + tests. Also `oecd-direct-outcomes.ts`, `oecd-budget-panel.ts` datasets. |
| 20 | World Bank indicators fetcher | done | `fetchers/world-bank.ts`, `sources/world-bank.ts` + tests. |
| 21 | FRED (St. Louis Fed) fetcher | done | `fetchers/fred.ts` + tests. |
| 22 | WHO Global Health Observatory fetcher | done | `fetchers/who.ts` + tests. |
| 23 | Congress API vote records fetcher | done | `fetchers/congress.ts` + tests. |
| 24 | USAspending.gov budget fetcher | done | `fetchers/usaspending.ts` — Spending Explorer API (no key required). Fetches by budget function/subfunction for FY2017+. Includes `fetchFederalBudgetByFunction()`, `fetchBudgetFunctionTimeSeries()`, `fetchLatestBudgetBreakdown()`. 26 tests passing. |
| 25 | Politician vote → budget category mapping | done | `web/src/lib/wishocracy-alignment.ts` resolves internal keys, category ids, and human-readable names into normalized budget allocations for scorecards/API use. |

## P4: Database & API

| # | Task | Status | Notes |
|---|------|--------|-------|
| 26 | Prisma migration setup | done | Docker Compose Postgres + committed Prisma migration history now exist. Root scripts support `db:setup`, `db:deploy`, `db:migrate`, and `db:reset`. |
| 27 | Seed script with federal budget items | done | `prisma/seed.ts` seeds Units, VariableCategories, GlobalVariables, Jurisdictions (US + 50 states), and ~20 FY2025 budget Items. |
| 28 | API routes for submitting pairwise comparisons | done | `web/src/app/api/wishocracy/` — allocation (POST single), allocations (GET/PATCH/DELETE), sync (POST bulk), category-selections (POST/GET/DELETE). Tests in allocation/route.test.ts, allocations/route.test.ts. |
| 29 | API route for preference weights | done | `web/src/app/api/wishocracy/average-allocations/route.ts` — GET endpoint aggregates all users' pairwise comparisons via `calculateAllocationsFromPairwise()` and returns averaged preference weights. |
| 30 | API route for alignment scores | done | `web/src/app/api/wishocracy/alignment/route.ts` exposes citizen preference summaries, bootstrap CIs, preference gaps, and politician alignment scoring/ranking. |

## P5: Integration & Reports

| # | Task | Status | Notes |
|---|------|--------|-------|
| 31 | CLI report generator (causal analysis) | done | `optimizer/src/report.ts` — full markdown report from `FullAnalysisResult`. |
| 32 | CLI report generator (preference weights) | done | `examples/src/federal-budget-demo.ts` and `alignment-demo.ts` generate markdown reports with preference weights and alignment scores. |
| 33 | Example: Federal budget with 20 categories | done | `examples/src/federal-budget-demo.ts` — 20 FY2025 categories, 4 voter archetypes, full RAPPA pipeline. Also `us-federal-analysis/` with budget, policy, and efficient frontier reports. |
| 34 | Example: Drug→symptom causal analysis | done | `examples/src/causal-analysis-demo.ts` (Vitamin D → mood) + `golden-path/health-optimization-demo.ts`. Full dFDA pipeline. |
| 35 | README with architecture diagram and examples | done | Root `README.md` with architecture diagram, package table, quick start, domain examples, paper references. |
| 36 | GitHub Actions CI | done | `.github/workflows/ci.yml` — build, typecheck, lint, test on push/PR to main. Also `deploy-pages.yml`. |

## P6: Report Quality — Critical (would mislead users)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 37 | PIS grading rubric for n=1 personal health analysis | done | Added `analysisMode: 'individual'` option that floors φUsers at 0.5 so n=1 analysis can reach Grade B. Golden-path demo updated to use individual mode. |
| 38 | Exclude non-discretionary items from preference/budget analysis | done | Added `discretionary` field to SpendingCategorySchema. Net Interest marked non-discretionary, excluded from RAPPA pairwise and OBG recommendations/frontier. Shown as informational with *(non-discretionary)* annotation. |
| 39 | Budget optimization: constrain to current total spending | done | Added `constrainToCurrentBudget` option to `generateBudgetReport`. When true, scales optimal values to sum to totalBudgetUsd and shows "Constrained Reallocation" section. US federal analysis now uses constrained mode. |
| 40 | BIS score saturation — all scores are 1.0 | done | Increased BIS_CALIBRATION_K from 10 to 500. Single weak estimate now scores ~0.006 (F), single strong ~0.49 (C), three strong estimates reach 1.0 (A). Actual differentiation between categories. |
| 41 | Fix causal direction label for negative correlations | done | `describePredictiveDirection` now compares |forwardR| - |reverseR| instead of raw delta. Coffee→Sleep correctly labeled as forward causation. |
| 42 | Report template: predictor-type-aware language | done | Changed to generic phrasing: "A daily average of X" and "Target: X daily". Works for any predictor type without domain-specific language. |

## P7: Report Quality — Important (reduce credibility)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 43 | Alignment score compression — 91-99% range | done | Recalibrated `wishocracy/alignment.ts` to use explicit percentage-point gap penalties (`FULL_MISALIGNMENT_GAP_PCT = 25`) so category misses are no longer reported as near-perfect alignment. |
| 44 | Temporality criterion always 1.0 in OPG policy reports | done | `opg/report.ts` now explicitly explains temporality as a gate/known limitation in policy reports instead of implying it differentiates among already forward-looking studies. |
| 45 | Add confidence intervals to preference weights and welfare scores | done | Preference-weight CIs now surface in alignment/budget demos and Wishocracy alignment API; OPG and OBG reports now display welfare/OSL uncertainty when available. |
| 46 | Policy report: include negative/repeal examples | done | `examples/src/us-federal-analysis/generate-policy-analysis.ts` includes 4 repeal policies: federal_mandatory_minimums (negative health), abstinence_only_education (negative health), ethanol_fuel_mandate (weak positive, political blocking), penny_continuation (negative, minimal effects). |

## P8: Report Quality — Polish (before v1)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 47 | Extract shared report formatting utilities | todo | `describeGrade`, `fmt`, `formatUsd`, and similar helpers are reimplemented independently in `optimizer/report.ts`, `opg/report.ts`, and `obg/report.ts`. Extract to a shared reporting utility. Packages: `optimizer`, `opg`, `obg`. |
| 48 | Consistent emoji styling across reports | todo | Report 1 uses 🟢🟡🟠🔴 for Bradford Hill. Report 5 uses none. Report 2 uses 📈📉≈. Standardize emoji usage (or remove entirely) across all report generators. Packages: `optimizer`, `opg`, `obg`, `examples`. |
| 49 | Add units to golden path report detail sections | todo | "Optimal Daily Value: 4500" (4500 what?). "Value predicting high outcome: 4391.39" (no unit). Optimal values in executive summary vs detail sections use different rounding without explanation. Package: `optimizer`, `examples`. |
| 50 | Report metadata and versioning | todo | Reports don't include package versions, algorithm parameters, or data source identifiers needed for reproducibility. Add a metadata footer with version, parameters, and data hash. Packages: all report generators. |

## P9: Decentralized Storage & Verifiable Records

**Build order:** Task 51 (Storacha) → Task 52 (Hypercerts) → Tasks 53–57 (Agent) — each layer depends on the previous.

### Storacha Decentralized Storage (build first — dependency for Agent)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 51 | Storacha storage package | done | `packages/storage` implements linked Wishocracy/policy snapshots, chain-head discovery, history verification, and tested Storacha client adapters for content-addressed persistence. |

### Hypercerts Integration (dependency for Agent)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 52 | Hypercerts package | done | `packages/hypercerts` maps OPG recommendations and Wishocracy aggregation into Hypercert activity claims, measurements, evaluations, attachments, and tested publish helpers. |

## P10: Autonomous Policy Analyst Agent

### Agent Core (Google ADK + Gemini)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 53 | Autonomous agent package | done | `packages/agent` implements a Gemini-driven `discover → plan → execute → interpret → verify → publish` orchestration layer over the existing Optimitron pipeline with injected adapters and end-to-end tests. |
| 54 | Gemini reasoning via structured tool decisions | done | Gemini structured-output calls now drive discover/plan/interpret/verify/publish decisions programmatically; `agent_log.json` captures the reasoning chain. |
| 55 | ERC-8004 on-chain identity | blocked | `packages/agent/src/erc8004.ts` includes identity/reputation registry helpers, but live Sepolia registration and reputation writes still require a funded wallet, deployed registry addresses, and a real transaction. |
| 56 | Agent manifest and logging | done | `packages/agent/agent.json` and `packages/agent/agent_log.json` exist and are validated in tests; manifest placeholders remain until Task 55 is executed live. |
| 57 | Agent safety guardrails | done | Guardrails implemented in `packages/agent`: input validation, response validation, insufficient-data aborts, retry/proceed logic, API-call caps, runtime caps, and no financial transaction execution. |

## P11: Policy Evaluation & Review Pipeline

| # | Task | Status | Notes |
|---|------|--------|-------|
| 58 | Three-layer policy evaluation pipeline | done | `evaluatePolicy()`, `runNaturalExperiment()`, `buildPanelAnalysis()`, `aggregateEffectSizes()` in `packages/opg/src/policy-evaluation.ts`. `PolicyEvaluation` and `NaturalExperimentDef` types. Portugal natural experiment dataset in `packages/data/src/datasets/natural-experiments.ts`. |
| 59 | LLM review evaluation with Gemini | done | Gemini sanity-checks policy evaluation outputs for reasonableness. Scored 94/100 on golden path test. Tests in `packages/agent/src/__tests__/analysis-publication-review.test.ts` and `packages/examples/src/analysis-explorer/__tests__/publication-review.test.ts`. |
| 60 | Mega study publication review | done | Review workflow for mega study outputs. `packages/examples/src/analysis-explorer/publication-review.ts` + `mega-study-generator.ts` updates. Output in `packages/examples/output/mega-studies/mega-study-publication-review.json`. |
| 61 | Gemini model update + `askGemini()` helper | done | Updated from `gemini-2.5-flash` to `gemini-3-flash-preview`. Added `askGemini()` convenience helper to `@optimitron/agent` (`packages/agent/src/analysis-publication-review.ts`). |

## P12: Human Cost of Votes — Politician Body Count Attribution

Systematically quantify the human cost of each politician's military/conflict votes using Gemini + credible data sources. The existing alignment scoring compares politician votes against citizen preferences. This adds a second dimension: how many people died because of their votes.

### Data Pipeline

| # | Task | Status | Notes |
|---|------|--------|-------|
| 62 | Military operations database | todo | Gemini agent scrapes/aggregates casualty data for each named military operation (Iraq, Afghanistan, Libya, Syria, Yemen, Iran, etc.) from credible sources: Watson Institute Costs of War (Brown University), UN OCHA, Airwars, WHO conflict mortality reports, ICRC. Store as structured data with operation name, date range, authorization source, and casualty estimates (low/mid/high with confidence). |
| 63 | Congressional vote mapping | todo | Map each military operation to the congressional votes that authorized/funded it: AUMF 2001, AUMF 2002, NDAA annual votes, arms sale approvals, specific authorization votes. Use Congress.gov API + Gemini for vote record extraction. Store as vote ID → operation ID mapping. |
| 64 | Attribution model | todo | For each politician, sum the casualties from operations they voted to authorize/fund. Attribution rules: (1) Voted YES on authorization = full attribution for subsequent casualties. (2) Voted YES on funding (NDAA) = partial attribution (funded continuation). (3) Executive orders (president) = full attribution. (4) Voted NO = zero attribution. Handle edge cases: abstentions, not-yet-in-office, committee vs floor votes. |
| 65 | DB schema for conflict data | todo | Add Prisma models: `MilitaryOperation` (name, dateRange, casualties, sources, confidence), `OperationVote` (operationId, voteId, voteType), `PoliticianCasualties` (politicianId, operationId, attributedCasualties, attributionType). |

### Integration with Existing Systems

| # | Task | Status | Notes |
|---|------|--------|-------|
| 66 | Add "Human Cost" to alignment score | todo | Extend the existing `AlignmentReport` component to show a second metric alongside the citizen-preference alignment score: "Attributed Casualties" with breakdown by operation. |
| 67 | Politician leaderboard update | todo | Add "Human Cost" column to `/politicians` scoreboard. Sort option: most casualties attributed. Make it undeniable. |
| 68 | Hypercert attestation for body counts | todo | Publish each politician's casualty attribution as a verifiable Hypercert on IPFS. Same pipeline as existing alignment Hypercerts. Immutable public record. |
| 69 | Gemini agent cron job | todo | Periodic agent run: scrape new casualty reports → update attribution → publish Hypercerts → update scoreboard. Use existing `packages/agent` orchestration. |

### Data Sources (Priority Order)

1. **Watson Institute Costs of War** (Brown University) — most comprehensive US war casualty database
2. **Airwars** — civilian casualty tracking for air/drone strikes, per-operation
3. **UN OCHA** — humanitarian impact reports with civilian casualty estimates
4. **ACLED** (Armed Conflict Location & Event Data) — global conflict events database
5. **Iraq Body Count** — peer-reviewed civilian casualty database
6. **Congress.gov API** — official voting records
7. **OpenSecrets** — defense industry donations to correlate with votes

### Key Design Decisions

- **Conservative estimates only** — use low-end credible figures, cite sources. Overestimating undermines credibility.
- **Per-operation breakdown** — don't just show a total. Show "Iraq: X, Afghanistan: Y, Yemen drone strikes: Z"
- **No editorializing** — let the numbers speak. Wishonia's voice works here: deadpan presentation of horrifying facts.
- **Verifiable** — every number links to its source. Every attribution links to the vote record.
- **Time-bounded** — only count casualties during/after the politician's vote, not before.

## P13: Web App — Session Wrap-Up Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 70 | Landing page rebuild (22→8 sections) | done | Tight funnel to prize. New components: LandingProblemSection, LandingPrizeOffer, LandingFAQSection. |
| 71 | Prize mechanism simplification | done | Removed bounty stages, v1/v2, required functions, whatYouFund. Prize is simple: deposit, recruit, allocate, vote, wait. |
| 72 | Earth Optimization Game arcade framing | done | INSERT COIN TO PLAY, GAME OVER cards, LEVELS, hedge framing, Press Start 2P pixel font, "Play the Game" CTA. |
| 73 | VOTE tokens → VOTE points | done | 45 user-facing occurrences across 21 files. Code identifiers unchanged. |
| 74 | Parameter renames (PRIZE_ESCROW → PRIZE_POOL_HORIZON) | done | All hardcoded numbers replaced with fmtParam(). Double-unit bugs fixed. |
| 75 | Route reorganization | done | /scoreboard → /politicians (politician leaderboard). New /scoreboard (game dashboard). New /tools page. |
| 76 | Live data wiring | done | Scoreboard + prize page pull pool size, verified voters, VOTE points from DB. |
| 77 | Countdown timer | done | CollapseCountdownTimer component. Live countdown to 50% GDP collapse. On prize + scoreboard. |
| 78 | GDP trajectory chart | done | 4-trajectory SVG: status quo, treaty, optimal governance, productive GDP. On scoreboard. |
| 79 | Shared components | done | GameCTA (30 instances), ArcadeTag (4), PrizeCalculator, messaging.ts, .env.test for vitest. |
| 80 | Animation cleanup | done | Removed ScrollReveal, StaggerGrid, HeroEntrance, CountUp from landing page. Content renders immediately. |
| 81 | DB seed | done | 1% Treaty referendum seeded. Budget categories, jurisdictions, demo user. |
| 82 | E2E tests | done | 25 Playwright tests (18 smoke + 7 functional). 216 vitest unit tests. All passing. |
| 83 | Wishonia is an alien, not AI | done | Removed all "governance AI" / "alien AI" references. |
| 84 | Content consistency sweep | done | Zero stale CTAs, zero old parameter names, zero wrong framing across entire codebase. |
