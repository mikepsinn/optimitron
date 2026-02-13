# Track Spec: Jurisdiction N-of-1 Drilldown Pages and APIs (v1)

## Background
Global aggregates are useful but hide heterogeneity. Users need jurisdiction-level evidence to assess transferability and identify where relationships are strong, weak, or reversed.

## Objective
Expose full N-of-1 jurisdiction analysis for each predictor/outcome pair with consistent diagnostics and rankings.

## Scope
- Per-jurisdiction analysis payload for every pair study.
- Ranking and filtering by evidence quality.
- Drilldown detail view with temporal and statistical diagnostics.

## Required Diagnostics
- Number of pairs and data quality flags
- Forward/reverse/predictive correlation metrics
- Baseline/follow-up effect metrics
- Bradford Hill components
- Estimated optimal value and uncertainty indicator

## Deliverables
- Jurisdiction-level summary table contract.
- Jurisdiction drilldown page contract.
- UI components for ranking, filtering, and comparison to global aggregate.
- Interpretation guidance for weak/confounded jurisdiction evidence.
  - Added in `.conductor/tracks/jurisdiction-nof1-v1/interpretation.md`.

## Acceptance Criteria
- Every pair study page includes a jurisdiction summary table.
- Users can click a jurisdiction to open a drilldown detail view.
- Drilldown provides enough diagnostics to debug model behavior and data adequacy.
- Jurisdiction ordering is deterministic and quality-gated.
