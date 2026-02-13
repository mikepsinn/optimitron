# Track Spec: Temporal Calibration + Report Reliability (v2)

## Background
Current explorer reports are readable and actionable, but major methodological gaps remain:
- Temporal analysis uses a fixed duration-of-action for annual panel analyses.
- Onset delay is selected from lag intersections only, without pair-specific calibration.
- Actionable recommendations can appear even when signal quality is weak/noisy.
- "After-tax median income" is currently a proxy and needs source upgrades.

## Objective
Increase decision usefulness and causal credibility by calibrating temporal assumptions, tightening recommendation gates, and improving welfare outcome data quality.

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
- Report/UI clarity:
  - preserve reader-first summaries
  - keep technical diagnostics collapsible and clearly labeled

## Deliverables
- Temporal profile schema in variable registry and pair overrides.
- Temporal profile selector module with deterministic scoring and test coverage.
- Pair/outcome report fields for temporal sensitivity and robustness.
- Reliability gate policy for actionable rows and lead recommendations.
- Direct-income data integration plan + implementation (or explicit phased fallback contract).

## Acceptance Criteria
- Reports no longer rely on one fixed duration for all predictor/outcome pairs.
- Every pair report shows selected temporal profile and at least one alternative profile comparison.
- Actionable recommendations are hidden or downgraded when support/quality thresholds fail.
- Outcome scope continues to target:
  - after-tax median income PPP (level + growth)
  - HALE (level + growth)
- If direct after-tax median income is unavailable for a jurisdiction-period, fallback/proxy labeling is explicit in report output.

## Risks
- Temporal profile search can increase compute time and overfitting risk.
- Direct income sources may have limited country/year coverage.
- Stronger gating may reduce the number of "actionable" rows, which can feel less decisive without clear explanation.
