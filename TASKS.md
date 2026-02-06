# Optomitron Agent Tasks

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
| 1 | Fix build — `pnpm build` passing for ALL packages | done | All 6 packages build: causal, rappa, opg, obg, data, db. Issue was missing node_modules. |
| 2 | Add vitest config to all packages | done | vitest.config.ts + smoke tests for causal, rappa, opg, obg, data. 27 tests passing. |
| 3 | Resolve type errors from `core` → `opg`/`obg` split | done | Types already correctly placed; build passes with strict mode |

## P1: Tests for Existing Code

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4 | Tests for `@optomitron/causal` temporal alignment | todo | Use dFDA paper examples |
| 5 | Tests for `@optomitron/causal` Bradford Hill scoring | todo | |
| 6 | Tests for `@optomitron/causal` PIS calculation | todo | |
| 7 | Tests for `@optomitron/rappa` aggregateComparisons() | todo | Use Wishocracy paper's Alice scenario |
| 8 | Tests for `@optomitron/rappa` principalEigenvector() | todo | Verify against known AHP examples |
| 9 | Tests for `@optomitron/rappa` consistencyRatio() | todo | CR < 0.1 for consistent matrices |
| 10 | Tests for `@optomitron/rappa` alignment scoring | todo | |
| 11 | Tests for `@optomitron/opg` Bradford Hill | todo | |
| 12 | Tests for `@optomitron/obg` diminishing returns | done | 36 tests: fitLogModel, fitSaturationModel, marginalReturn, findOSL, estimateOSL + edge cases |
| 13 | Tests for `@optomitron/obg` cost-effectiveness | done | 107 additional tests: cost-effectiveness (32), BIS (37), welfare (17), budget schemas (18), smoke (3) |

## P2: RAPPA Math (Wishocracy)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 14 | Statistical convergence analysis | todo | How many comparisons → stable weights? |
| 15 | Matrix completion from sparse data | todo | Infer missing pairs transitively |
| 16 | Bootstrap confidence intervals | todo | 95% CI on preference weights |
| 17 | Manipulation resistance analysis | todo | How much can one strategic voter shift results? |
| 18 | Random pair selection algorithm | todo | Optimal sampling strategy from paper |

## P3: Data Fetchers

| # | Task | Status | Notes |
|---|------|--------|-------|
| 19 | OECD spending data fetcher | todo | |
| 20 | World Bank indicators fetcher | todo | |
| 21 | FRED (St. Louis Fed) fetcher | todo | |
| 22 | WHO Global Health Observatory fetcher | todo | |
| 23 | Congress API vote records fetcher | todo | ProPublica or congress.gov |
| 24 | USAspending.gov budget fetcher | todo | Actual federal allocations |
| 25 | Politician vote → budget category mapping | todo | |

## P4: Database & API

| # | Task | Status | Notes |
|---|------|--------|-------|
| 26 | Prisma migration setup | todo | Needs DATABASE_URL |
| 27 | Seed script with federal budget items | todo | Top 20 categories |
| 28 | API routes for submitting pairwise comparisons | todo | |
| 29 | API route for preference weights | todo | |
| 30 | API route for alignment scores | todo | |

## P5: Integration & Reports

| # | Task | Status | Notes |
|---|------|--------|-------|
| 31 | CLI report generator (causal analysis) | todo | Markdown output |
| 32 | CLI report generator (preference weights) | todo | |
| 33 | Example: Federal budget with 20 categories | todo | Full RAPPA pipeline demo |
| 34 | Example: Drug→symptom causal analysis | todo | Full dFDA pipeline demo |
| 35 | README with architecture diagram and examples | todo | |
| 36 | GitHub Actions CI | todo | typecheck + lint + test on PR |
