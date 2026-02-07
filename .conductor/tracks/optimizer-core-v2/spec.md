# Track Spec: Partial Correlations + Diminishing Returns Detection (v2)

## Background
Core optimizer utilities need first-class confound control and diminishing returns detection to support OBG and OPG. These should be part of the default analysis outputs without breaking existing consumers.

## Objectives
- Add partial correlation utility for confound control.
- Add diminishing returns detection hooks.
- Extend analysis outputs with optional partial correlation metrics.

## API Changes
- `runFullAnalysis` accepts optional `confoundSeries`.
- `FullAnalysisResult` adds optional `partialR` output.
- New helpers for partial correlation and diminishing returns detection.

## Tests
- Synthetic datasets with known confounds.
- Datasets with expected slope changes for diminishing returns.

## Acceptance Criteria
- Partial correlation results match expected values on synthetic tests.
- Diminishing returns detection passes known slope-change scenarios.
- Report generator includes `partialR` when present.
