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
5. [x] Add recommendation gating policy.
   - Hide or downgrade actionable recommendations when subject/pair support is below threshold.
   - Add plain-language fallback text for exploratory-only pairs.
6. [x] Add outlier robustness policy for actionable ranges.
   - Add configurable winsorization/quantile support for extreme predictor ranges.
   - Surface robust range and raw range separately where useful.
7. [x] Add quality-tier badges for outcome reports.
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
13. [x] Add budget-allocation style derived predictors and report sections.
   - Add derived sector-share predictors (`% of government expenditure`) for health, education, R&D, and military.
   - Add derived civilian (non-military) per-capita spending predictor.
   - Surface allocation-share table in outcome mega-study reports.
14. [ ] Add multi-horizon outcome modeling and reliability selection.
   - Keep level outcomes as primary decision targets.
   - Add parallel growth horizons (`1y YoY`, `3y CAGR`, `5y CAGR` / long-difference variants).
   - Choose default decision horizon per outcome by reliability score (support + stability + significance).
15. [ ] Add hard data-sufficiency gates before pair scoring.
   - Require minimum continuity/coverage thresholds before generating recommendations.
   - Emit explicit "insufficient-data" outcome/pair pages instead of low-confidence pseudo-recommendations.
16. [ ] Split report targets into model-optimal vs decision-optimal.
   - Keep raw model-optimal target for diagnostics.
   - Add support-constrained decision target/range (observed-support and robust-window bounded) for actionable guidance.
   - Show explicit divergence metrics between model-optimal and decision-optimal.
17. [ ] Refactor evidence semantics for human clarity.
   - Separate `internal signal strength` from `decision confidence`.
   - Replace ambiguous A-F emphasis in reader-first sections with calibrated confidence labels.
   - Keep raw scoring components in technical appendix.
18. [ ] Simplify report templates to prioritize actionability.
   - In outcome pages, show a concise "recommended range + confidence + direction" table first.
   - Hide/de-emphasize repetitive monitor-only sections when no actionable rows exist.
   - Move bulky diagnostics (full subject tables, ASCII histograms) to expandable appendix/debug outputs.
19. [ ] Add universal report contract for any predictor/outcome pair.
   - Define required pair and outcome markdown sections and link behavior.
   - Ensure report generation scales to arbitrary predictor/outcome selections with the same schema.
20. [x] Integrate optimizer MED/diminishing-returns outputs into pair reports.
   - Show minimum effective dose (MED), diminishing-returns knee, and plateau-zone diagnostics when identifiable.
   - Fall back to "no reliable MED/knee detected" when support is insufficient.

## Progress Notes (2026-02-13)
- Switched report-facing predictor set to discretionary PPP per-capita spending predictors.
  - Added derived per-capita PPP predictors for education, health, R&D, and military spending.
  - Kept `% GDP` spending predictors available in registry but marked non-discretionary for report exclusion.
  - Marked tax revenue `% GDP` non-discretionary for exclusion from report-facing predictor scope.
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
- Added recommendation gating + fallback language:
  - pair reports now carry `actionable` vs `exploratory` status and gate reasons
  - exploratory pairs are downgraded to non-prescriptive guidance
- Added outlier-robust sensitivity for predictor targets:
  - trimmed (p10-p90) robustness summary alongside raw ranges
  - raw-vs-robust optimal deltas surfaced in pair/outcome reports
  - quality warning when tail influence materially shifts the target
- Ported useful decision-oriented structure from US budget report into generalized outcome reports:
  - Top Recommendations section (action verbs + status)
  - Evidence Snapshot table (status, evidence, significance, directional score, support)
- Added quality tiers to pair/outcome outputs:
  - pair-level tier field (`strong`/`moderate`/`exploratory`/`insufficient`)
  - tier counts in lead takeaway and tier columns in outcome tables/appendix
- Current calibration snapshot after regeneration:
  - quality tier distribution: 15 exploratory, 5 insufficient, 0 moderate, 0 strong
  - mean absolute raw-vs-robust optimal delta is large (~81.5%), so tail influence remains material
- Refactored outcome mega-study reports to lead with optimal-value clarity per predictor (human-readable targets), with ranking details moved to appendix.
- Added budget-allocation style derived predictors to generalized analysis scope:
  - `predictor.derived.gov_non_military_expenditure_per_capita_ppp`
  - `predictor.derived.gov_health_share_of_gov_expenditure_pct`
  - `predictor.derived.education_share_of_gov_expenditure_pct`
  - `predictor.derived.rd_share_of_gov_expenditure_pct`
  - `predictor.derived.military_share_of_gov_expenditure_pct`
- Added `Budget Allocation Signals` section in outcome reports to mirror allocation-focused decision support from the US budget report.
- Integrated optimizer response-curve diagnostics into pair/outcome report templates:
  - pair pages now show MED, diminishing-returns knee, plateau zone, and support-constrained target diagnostics
  - outcome recommendation/evidence tables now expose observed-support targets plus MED/knee columns
- Refined direction labeling semantics in reports:
  - action-direction label now derives from forward association sign with predictive-strength gating (weak predictive signal -> neutral)
  - added warning pathway for forward-sign vs directional-score-sign conflicts to reduce misinterpretation risk
- Shifted reader-facing reports to number-first presentation:
  - removed primary `actionable/exploratory` language from lead sections and target tables
  - replaced recommendation wording with numeric target summaries (best estimate, observed-support target, MED, knee, robust target)
  - kept gating/actionability internals in artifact JSON for downstream API/debug use
- Added explicit backend reliability + sufficiency contracts for each pair:
  - `dataSufficiency` (`sufficient` / `insufficient_data`) with thresholded reasons
  - numeric `reliability` object with component scores (support/significance/directional/temporal/robustness), overall score, and band
  - surfaced in pair and outcome markdown tables for web/API readiness
- Added web-ready API payload artifact:
  - `packages/examples/output/mega-studies/mega-study-api.json`
  - schema-versioned (`2026-02-14`) compact contract with pair numeric targets + outcome-index rows
- Kept model-optimal targets raw (no clamping) and added explicit diagnostics for interpretability:
  - pair reports now state when model-optimal is outside the highest-outcome observed bin despite being within global observed support
  - outcome reports now include `Outside Best Observed Bin?` and bin-alignment counts in lead takeaway
  - human-readable targets now call out bin-misaligned model optima to reduce confusion
- Reliability snapshot after latest regeneration:
  - `outcome.who.healthy_life_expectancy_years`: strong signal quality (`A` grades), but most pairs still exploratory due to temporal-stability gate.
  - `outcome.derived.after_tax_median_income_ppp`: similarly strong internal signal (`A` grades), exploratory status dominated by temporal instability + weak directional separation on several pairs.
  - `outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`: mostly `B/C`, exploratory.
  - `outcome.derived.healthy_life_expectancy_growth_yoy_pct`: all `F` / insufficient under current reliability gates; treat as non-decision-grade until multi-horizon/gating upgrades land.
- Next highest-priority implementation order:
  1) Implement item 14 (multi-horizon outcomes) and item 15 (hard sufficiency gates).
  2) Tighten item 16 by explicitly selecting decision targets from support-constrained + robustness diagnostics.
  3) Implement item 8 (direct after-tax median income integration).
