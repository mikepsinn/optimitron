# Track Spec: OBG Minimum Effective Spending + Efficient Frontier (v2)

## Background
The v1 OBG framing is US-only and prone to wealth confounds with monotonic trends. This track reframes OBG around minimum effective spending, efficient frontier benchmarking, and explicit wealth confound control.

## Objectives
- Identify minimum effective spending per category.
- Compute overspend ratios by category.
- Surface efficient frontier countries for outcomes per dollar.

## Data Requirements
- OECD panel with per-capita PPP.
- Direct outcomes by category.
- GDP confound controls.
- COVID sensitivity toggle.

## Methodology
- Partial correlations for confound control.
- Decile-floor analysis for minimum effective thresholds.
- N-of-1 per country with aggregation.

## Deliverables
- OBG API function `findMinimumEffectiveSpending`.
- Report `us-optimal-budget-v6` with minimum-effective framing.
- Web JSON outputs for v6.

## Acceptance Criteria
- Reproducible outputs with baseline-change + z-score metrics.
- Confound flags on all category results.
- Efficient frontier and overspend ratios computed per category.

## Risks
- Synthetic direct outcomes.
- Missing education data gaps.
