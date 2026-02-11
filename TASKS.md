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
| 1 | Fix build — `pnpm build` passing for ALL packages | done | All 6 packages build: causal, wishocracy, opg, obg, data, db. Issue was missing node_modules. |
| 2 | Add vitest config to all packages | done | vitest.config.ts + smoke tests for causal, wishocracy, opg, obg, data. 27 tests passing. |
| 3 | Resolve type errors from `core` → `opg`/`obg` split | done | Types already correctly placed; build passes with strict mode |

## P1: Tests for Existing Code

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4 | Tests for `@optomitron/optimizer` temporal alignment | done | dFDA paper examples |
| 5 | Tests for `@optomitron/optimizer` Bradford Hill scoring | done | |
| 6 | Tests for `@optomitron/optimizer` PIS calculation | done | |
| 7 | Tests for `@optomitron/wishocracy` aggregateComparisons() | done | Wishocracy paper's Alice scenario |
| 8 | Tests for `@optomitron/wishocracy` principalEigenvector() | done | Verified against known AHP examples |
| 9 | Tests for `@optomitron/wishocracy` consistencyRatio() | done | CR < 0.1 for consistent matrices |
| 10 | Tests for `@optomitron/wishocracy` alignment scoring | done | |
| 11 | Tests for `@optomitron/opg` Bradford Hill | done | 213 tests: bradford-hill, welfare, policy, jurisdiction, budget, integration |
| 12 | Tests for `@optomitron/obg` diminishing returns | done | 36 tests: fitLogModel, fitSaturationModel, marginalReturn, findOSL, estimateOSL + edge cases |
| 13 | Tests for `@optomitron/obg` cost-effectiveness | done | 107 additional tests: cost-effectiveness (32), BIS (37), welfare (17), budget schemas (18), smoke (3) |

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
| 24 | USAspending.gov budget fetcher | todo | Actual federal allocations. No dedicated fetcher yet; budget data currently uses static datasets. |
| 25 | Politician vote → budget category mapping | todo | No implementation yet. |

## P4: Database & API

| # | Task | Status | Notes |
|---|------|--------|-------|
| 26 | Prisma migration setup | todo | Needs DATABASE_URL. Schema exists but no migrations generated yet. |
| 27 | Seed script with federal budget items | done | `prisma/seed.ts` seeds Units, VariableCategories, GlobalVariables, Jurisdictions (US + 50 states), and ~20 FY2025 budget Items. |
| 28 | API routes for submitting pairwise comparisons | todo | Web layer work. |
| 29 | API route for preference weights | todo | Web layer work. |
| 30 | API route for alignment scores | todo | Web layer work. |

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
| 43 | Alignment score compression — 91-99% range | todo | All politician alignment scores fall in 91.4–99.4 range with category alignments at 95–100%. A 4.7pp gap in a category still scores 95% alignment. The scoring formula saturates too quickly for meaningful differentiation. Package: `wishocracy`. |
| 44 | Temporality criterion always 1.0 in OPG policy reports | todo | Temporality = 1.00 for all 15 policies because all have before/after temporal structure. The criterion provides zero differentiation. Should either note this as a known limitation or adjust for policy-vs-epidemiology context. Package: `opg`. |
| 45 | Add confidence intervals to preference weights and welfare scores | todo | Bootstrap CI module exists in `wishocracy` but isn't used in any report. Welfare scores in OPG report (75.0, 60.0, etc.) are presented as exact numbers with no uncertainty. Add CIs to both RAPPA and OPG/OBG reports. Packages: `wishocracy`, `opg`, `obg`, `examples`. |
| 46 | Policy report: include negative/repeal examples | todo | All 15 policies in OPG report are recommended for enact/modify. None get repeal or insufficient-evidence. A credible ranking system needs some policies that score poorly. Add 3-5 policies with weak or negative evidence. Package: `data`, `examples`. |

## P8: Report Quality — Polish (before v1)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 47 | Extract shared report formatting utilities | todo | `describeGrade`, `fmt`, `formatUsd`, and similar helpers are reimplemented independently in `optimizer/report.ts`, `opg/report.ts`, and `obg/report.ts`. Extract to a shared reporting utility. Packages: `optimizer`, `opg`, `obg`. |
| 48 | Consistent emoji styling across reports | todo | Report 1 uses 🟢🟡🟠🔴 for Bradford Hill. Report 5 uses none. Report 2 uses 📈📉≈. Standardize emoji usage (or remove entirely) across all report generators. Packages: `optimizer`, `opg`, `obg`, `examples`. |
| 49 | Add units to golden path report detail sections | todo | "Optimal Daily Value: 4500" (4500 what?). "Value predicting high outcome: 4391.39" (no unit). Optimal values in executive summary vs detail sections use different rounding without explanation. Package: `optimizer`, `examples`. |
| 50 | Report metadata and versioning | todo | Reports don't include package versions, algorithm parameters, or data source identifiers needed for reproducibility. Add a metadata footer with version, parameters, and data hash. Packages: all report generators. |
