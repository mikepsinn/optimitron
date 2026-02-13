# Plan: Jurisdiction N-of-1 Drilldown Pages and APIs (v1)

1. [x] Define jurisdiction summary row schema for pair studies.
   - `ExplorerSubjectSummary` in `packages/web/src/lib/analysis-explorer-types.ts`.
2. [x] Define jurisdiction drilldown payload schema with full diagnostics.
   - Added `ExplorerSubjectDrilldown` contract with:
     - quality gate results/reasons
     - aggregate comparison deltas
     - deterministic ranking metrics
3. [x] Add per-jurisdiction ranking metrics and sort order rules.
   - Implemented in `packages/web/src/lib/analysis-explorer-subjects.ts`.
   - Sort precedence:
     - quality gate pass first
     - higher ranking score
     - higher pair count
     - subject ID lexical tiebreaker
4. [x] Add quality-gating thresholds (minimum pairs, stability checks, missingness).
   - Implemented default thresholds in `DEFAULT_SUBJECT_QUALITY_THRESHOLDS`:
     - minimum pairs
     - min absolute forward/predictive correlation
     - min absolute percent-change signal
5. [x] Add jurisdiction comparison view (selected jurisdiction vs global aggregate).
   - Implemented in `packages/web/src/app/studies/[outcomeId]/[predictorId]/jurisdictions/[jurisdictionId]/page.tsx`.
   - Includes direction-agreement label + deltas vs aggregate predictive/forward/%-change.
6. [x] Implement jurisdiction drilldown page route and renderer.
   - Route existed and was expanded with quality gate + aggregate-comparison sections.
   - Jurisdiction list page now includes quality status and ranking score columns.
7. [x] Add tests for:
   - diagnostics completeness
   - ranking determinism
   - quality-gating behavior
   - Added:
     - `packages/web/src/lib/__tests__/analysis-explorer-data.test.ts`
     - `packages/web/src/lib/__tests__/analysis-explorer-subjects.test.ts`
8. [x] Add documentation on interpreting weak/confounded jurisdiction evidence.
   - Added `.conductor/tracks/jurisdiction-nof1-v1/interpretation.md`.
