# Track Spec: Universal Predictor-Outcome Explorer + Outcome Hubs (v1)

## Background
Current analysis outputs are report-specific and mostly precomputed around selected scenarios. Product direction now requires a general explorer where users can choose any predictor/outcome pair, inspect causal evidence, and navigate between global and jurisdiction-level evidence.

## Objective
Ship a web-native explorer with:
- A universal predictor/outcome selector.
- Outcome hub pages ranking strongest predictors ("mega studies").
- Pair study pages with global aggregate evidence and jurisdiction N-of-1 drilldowns.

## Scope
- Variable registry for predictors and outcomes (IDs, units, directionality, valid transforms, lag windows, coverage).
- Generic pair-analysis runner using canonical relationship semantics:
  - subject-level: `NOf1VariableRelationship` summaries
  - aggregate-level: `AggregateVariableRelationship` summaries
- Canonical relationship naming is aligned across optimizer contracts and db models.
- Pair-study scope identity uses `subjectId` (not `unitId`) to avoid collision with measurement `Unit` identifiers.
- Added `Subject` model foundation in DB contracts to support user/jurisdiction/cohort/organization analysis identities.
- Unit metadata standardization dependency:
  - Add UCUM-coded unit support in DB/data contracts and normalization pipelines.
  - Enforce FK naming so `<modelName>Id` only refers to that model (e.g., `unitId` only for `Unit`).
- Reusable pair-study payload as a presentation adapter (not a separate inference engine).
- Outcome-level ranking methodology with uncertainty controls.
  - Implemented with configurable multiple-testing correction and deterministic rank ordering.
- Cross-linking navigation:
  - Outcome hub -> pair study
  - Pair study -> jurisdiction N-of-1 detail
  - Pair study -> related outcomes and predictors

## Deliverables
- `VariableRegistry` schema and source map.
- Pair-analysis output schema (presentation adapter) including:
  - adaptive binning tables
  - optimal value estimates and uncertainty bands
  - evidence metrics and data coverage diagnostics
- Outcome hub ranking schema and renderer.
  - Schema and ranking implementation now available in `@optomitron/optimizer/src/outcome-mega-study-ranking.ts`.
- Study-page route and deep-linking conventions.
  - Implemented routes:
    - `/outcomes`
    - `/outcomes/:outcomeId`
    - `/studies/:outcomeId/:predictorId`
    - `/studies/:outcomeId/:predictorId/jurisdictions`
    - `/studies/:outcomeId/:predictorId/jurisdictions/:jurisdictionId`
  - Shared route helpers: `packages/web/src/lib/analysis-explorer-routes.ts`.
  - Shared cached adapter: `packages/web/src/lib/analysis-explorer-data.ts`.
- Offline/report artifact generator for registry-wide studies.
  - Outcome mega-study markdown files with predictor rankings and pair-study links.
  - Pair-study markdown files for predictor/outcome combinations with:
    - plain-language interpretation summaries
    - binned predictor/outcome pattern tables
    - lightweight distribution charts for exploratory QA
  - Machine-readable JSON summary for downstream QA and visualization.

## Acceptance Criteria
- Any predictor/outcome in the registry can render a study payload without custom code paths.
- Pair analysis is computed once via subject/aggregate relationship primitives, then adapted for explorer/report views.
- Pair-study contract uses `subjectId` for n-of-1 scope identity; `unitId` remains reserved for measurement-unit references.
- Outcome hubs rank predictors with effect size, confidence, and multiple-testing-adjusted significance.
- Users can click from an outcome ranking row to a predictor/outcome study page.
- Study pages expose both global aggregate and jurisdiction N-of-1 evidence summaries.

## Risks
- Sparse pair coverage can yield unstable rankings without adequate quality thresholds.
- Multiple comparison risk can create misleading "top predictors" if corrections are omitted.
- Runtime generation cost may be high without precompute/caching strategy.

