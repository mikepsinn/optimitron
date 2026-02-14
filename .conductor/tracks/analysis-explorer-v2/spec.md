# Track Spec: Temporal Calibration + Report Reliability (v2)

## Background
Current explorer reports are readable and actionable, but major methodological gaps remain:
- Temporal analysis uses a fixed duration-of-action for annual panel analyses.
- Onset delay is selected from lag intersections only, without pair-specific calibration.
- Actionable recommendations can appear even when signal quality is weak/noisy.
- "After-tax median income" is currently a proxy and needs source upgrades.
- Growth outcomes can be too noisy (especially HALE YoY), producing low-confidence recommendations.
- Report semantics currently mix internal scoring and decision confidence in ways that can confuse readers.
- Education recommendations can be distorted when broad spending totals are optimized without direct student-performance outcomes or composition decomposition.

## Objective
Increase decision usefulness and causal credibility by calibrating temporal assumptions, tightening recommendation gates, improving welfare outcome data quality, and separating diagnostic model outputs from decision-grade guidance.

## Scope
- Temporal model calibration:
  - predictor-level default onset/duration profiles
  - optional predictor/outcome pair overrides
  - automatic temporal profile selection with sensitivity reporting
- Recommendation reliability:
  - confidence/support gates for showing actionable recommendations
  - suppression/fallback language when evidence is exploratory
  - outlier-robust support/range reporting
- Outcome data quality:
  - integrate direct after-tax median disposable income data where available
  - preserve explicit proxy fallback and coverage diagnostics where direct data is missing
  - add multi-horizon outcome modeling (level + growth horizons) and reliability-based horizon selection
- Report/UI clarity:
  - preserve reader-first summaries
  - keep technical diagnostics collapsible and clearly labeled
  - separate model-optimal diagnostics from support-constrained decision targets
  - clearly distinguish internal signal strength vs decision confidence labels
- Education reliability:
  - decompose education predictors so budget guidance distinguishes instructional vs administrative composition
  - require direct student-performance outcome support for high-confidence education scale recommendations
  - prevent out-of-support extrapolated education targets from appearing as primary recommendations

## Deliverables
- Temporal profile schema in variable registry and pair overrides.
- Temporal profile selector module with deterministic scoring and test coverage.
- Pair/outcome report fields for temporal sensitivity and robustness.
- Reliability gate policy for actionable rows and lead recommendations.
- Direct-income data integration plan + implementation (or explicit phased fallback contract).
- Multi-horizon outcome construction and horizon-reliability selector.
- Report contract update with model-optimal vs decision-optimal fields.
- Confidence-label refactor for reader-first sections.
- Education outcome-source integration plan (international + US companion) and decomposition-ready predictor contract.

## Acceptance Criteria
- Reports no longer rely on one fixed duration for all predictor/outcome pairs.
- Every pair report shows selected temporal profile and at least one alternative profile comparison.
- Actionable recommendations are hidden or downgraded when support/quality thresholds fail.
- Outcome scope continues to target:
  - after-tax median income PPP (level + growth)
  - HALE (level + growth)
- If direct after-tax median income is unavailable for a jurisdiction-period, fallback/proxy labeling is explicit in report output.
- Growth horizons with insufficient support are automatically downgraded or labeled insufficient-data.
- Reader-facing recommendation tables prioritize decision-optimal ranges, with raw model-optimal values retained in diagnostics.
- Confidence semantics in summaries no longer imply classical causal certainty when based on internal scoring heuristics.
- Education recommendations are composition-aware and suppressed/downgraded when direct learning-outcome support is insufficient.

## Risks
- Temporal profile search can increase compute time and overfitting risk.
- Direct income sources may have limited country/year coverage.
- Stronger gating may reduce the number of "actionable" rows, which can feel less decisive without clear explanation.
