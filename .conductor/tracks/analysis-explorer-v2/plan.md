# Plan: Temporal Calibration + Report Reliability (v2)

1. [x] Add temporal profile fields to predictor registry entries.
   - Add onset-delay candidate years, duration-of-action candidate years, and preferred filling strategy per predictor.
   - Keep defaults backward-compatible for existing analyses.
2. [x] Add optional predictor/outcome pair temporal overrides.
   - Add a small override table/config for well-known pairs where lag structure is domain-established.
   - Enforce deterministic precedence: pair override > predictor default > global fallback.
3. [x] Implement temporal profile search for pair analysis.
   - Evaluate candidate onset/duration combinations.
   - Score combinations using directional strength + significance + support thresholds.
   - Keep deterministic tie-breakers.
4. [x] Add temporal sensitivity outputs to pair-study artifacts.
   - Include selected profile, runner-up profiles, and score deltas.
   - Add instability warning when top profiles are too close.
5. [ ] Add recommendation gating policy.
   - Hide or downgrade actionable recommendations when subject/pair support is below threshold.
   - Add plain-language fallback text for exploratory-only pairs.
6. [ ] Add outlier robustness policy for actionable ranges.
   - Add configurable winsorization/quantile support for extreme predictor ranges.
   - Surface robust range and raw range separately where useful.
7. [ ] Add quality-tier badges for outcome reports.
   - Add simple tiers (strong/moderate/exploratory/insufficient) driven by support + significance + stability.
8. [ ] Integrate direct after-tax median disposable income source(s).
   - Add fetcher(s) and normalization pipeline for direct series where available.
   - Maintain explicit proxy fallback for uncovered jurisdictions/years.
9. [ ] Add derived growth-series quality checks.
   - Require minimum continuity for YoY calculations.
   - Add missingness/interpolation diagnostics in report metadata.
10. [ ] Add report output contract tests for new temporal/sensitivity sections.
   - Validate selected profile fields, gating behavior, and fallback labeling.
11. [ ] Add integration benchmark for generation runtime.
   - Compare cached and uncached generation times.
   - Guard against unacceptable runtime regressions.
12. [ ] Update web pages to keep advanced diagnostics collapsed by default.
   - Reader-first summary always visible.
   - Technical appendix expandable with explicit caveats.

## Progress Notes (2026-02-13)
- Completed deterministic temporal precedence wiring:
  - predictor registry temporal defaults
  - pair-level override map
  - fallback path
- Added temporal candidate search per pair:
  - evaluates onset/duration combinations for predictor defaults
  - deterministic scoring and tie-breakers
  - selected profile now drives actual runner/alignment configuration
- Pair report metadata now includes selected lag/duration/filling and source (`pair_override` / `predictor_default` / `global_fallback`).
- Added temporal sensitivity diagnostics in pair outputs:
  - selected profile score
  - top runner-ups with score deltas
  - instability warning when top profiles are too close
- Next highest-priority implementation task: item 5 (recommendation gating), then item 6 (outlier robustness policy).
