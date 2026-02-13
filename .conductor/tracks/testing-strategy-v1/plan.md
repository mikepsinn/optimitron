# Plan: Hypothesis-Driven Tests for Findings (v1)

1. [x] Define a `HypothesisTestCase` format and helpers.
2. [x] Add tests for partial correlation confounds (GDP example).
3. [x] Add tests for minimum effective spending logic.
4. [x] Add tests for policy scoring and evidence grades.
5. [ ] Add a report-to-tests mapping table in `reports/`.
6. [x] Add tests for adaptive binning and report output contracts.
   - `@optomitron/optimizer`: adaptive binning unit tests.
   - `@optomitron/examples`: assertions for low-spending `% GDP` tiers and per-capita PPP tier output.
7. [x] Add tests for ranking stability under multiple-testing correction (FDR/Bonferroni as configured).
   - Added in `@optomitron/optimizer/src/__tests__/outcome-mega-study-ranking.test.ts`.
   - Covers BH and Bonferroni adjustment behavior plus deterministic ranking ties.
8. [ ] Add UI-contract tests for uncertainty/quality badges on outcome hub and pair study pages.
