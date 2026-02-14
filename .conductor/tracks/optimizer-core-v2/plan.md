# Plan: Optimizer Core v2

## DONE
- [x] Add `partialCorrelation()` in `statistics.ts` (committed 5f6c0d6)
- [x] Add `diminishingReturnsDetection()` helper (committed 5f6c0d6)
- [x] Add tests (67 new tests committed)
- [x] Add `buildAdaptiveNumericBins()` in `packages/optimizer` with exports and tests (2026-02-13)
  - Supports quantile-seeded bins, anchor constraints, edge rounding, and minimum sample-size merging.
  - Added coverage in `packages/optimizer/src/__tests__/adaptive-binning.test.ts`.

## REOPENED PRIORITIES (2026-02-13)
Execution priority note:
- This track is foundational for analysis-explorer-v2 decision outputs and should be completed before explorer items that depend on support-constrained targeting.

1. [x] Add decision-grade diminishing-returns API.
   - Expose a reusable curve diagnostics helper that estimates marginal gains across predictor values.
   - Return knee-point / diminishing-returns onset candidate with support diagnostics.
2. [x] Add minimum effective dose (MED) estimator.
   - Detect the lowest predictor level where outcome gains become consistently positive beyond noise thresholds.
   - Include uncertainty/support metadata and "not identifiable" fallback state.
3. [x] Add saturation/plateau-zone estimator.
   - Detect ranges where marginal gains are near-zero or inconsistent.
   - Return a practical upper bound for decision-grade recommendations when detectable.
4. [x] Add support-constrained target helpers for downstream report generators.
   - Compute model-optimal (raw), support-constrained optimal, and robust-window optimal in one contract.
   - Provide delta metrics among the three targets.
5. [x] Add synthetic-test fixtures for known response shapes.
   - Null/no effect, monotonic linear, saturating Michaelis-Menten, and inverted-U patterns.
   - Validate MED/knee/plateau detection behavior and uncertainty flags.
6. [x] Add lightweight integration hooks for explorer pair studies.
   - Keep optimizer domain-agnostic (predictor/outcome terminology only).
   - Surface MED/diminishing-returns outputs without coupling to jurisdiction semantics.

## Progress Notes (2026-02-13)
- Added new optimizer response-curve APIs in `packages/optimizer/src/response-curve.ts`:
  - `estimateDiminishingReturns(...)`
  - `estimateMinimumEffectiveDose(...)`
  - `estimateSaturationRange(...)`
  - `deriveSupportConstrainedTargets(...)`
- Exported new APIs and types from `packages/optimizer/src/index.ts`.
- Added synthetic coverage in `packages/optimizer/src/__tests__/response-curve.test.ts` for:
  - saturating vs linear vs insufficient-support behavior
  - MED threshold detection and no-effect fallback
  - plateau detection and minimization objective support
  - support-constrained/raw/robust target deltas
- Wired diagnostics into explorer pair artifacts and markdown rendering in
  `packages/examples/src/analysis-explorer/mega-study-generator.ts`:
  - pair pages now include MED, knee, plateau, and support-constrained target diagnostics
  - outcome pages now surface observed-support targets + MED/knee in recommendation/evidence tables

## DEFERRED (YAGNI)
- [ ] ~~Add `partialR` to `FullAnalysisResult`~~ — not needed yet; ad-hoc scripts handle this
- [ ] ~~Update report generator solely for partialR~~ — use focused report changes when a concrete consumer needs it
