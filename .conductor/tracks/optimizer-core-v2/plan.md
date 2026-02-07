# Plan: Partial Correlations + Diminishing Returns Detection (v2)

1. Add `partialCorrelation()` in `statistics.ts`.
2. Add `partialR` output to `FullAnalysisResult` (non-breaking optional).
3. Add `diminishingReturnsDetection()` helper (baseline slope change detection).
4. Add tests for `partialCorrelation` and diminishing returns detection.
5. Update report generator to include `partialR` when present.
