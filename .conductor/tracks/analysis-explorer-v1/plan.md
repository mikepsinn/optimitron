# Plan: Universal Predictor-Outcome Explorer + Outcome Hubs (v1)

1. [x] Normalize core relationship terminology in optimizer and db.
   - Renamed `UserVariableRelationship` -> `NOf1VariableRelationship`.
   - Renamed `GlobalVariableRelationship` -> `AggregateVariableRelationship`.
   - Renamed `UserVariable` -> `NOf1Variable` and `numberOfUserVariables` -> `numberOfNOf1Variables`.
   - Renamed aggregation helper `aggregateGlobalVariableRelationships` -> `aggregateNOf1VariableRelationships`.
   - Updated runner payload fields to `nOf1VariableRelationship` and `aggregateVariableRelationship`.
   - Updated Prisma models and Zod schemas to `NOf1VariableRelationship` / `AggregateVariableRelationship`.
   - Renamed aggregate count field `numberOfUsers` -> `numberOfUnits`.
2. [x] Define `VariableRegistry` contract for predictors/outcomes.
   - Implemented in `@optomitron/data` via `src/variable-registry.ts` + tests.
   - Includes canonical ID, unit, welfare direction (for outcomes), transform defaults, lag defaults, and coverage metadata.
3. [x] Define generic `PairStudyResult` schema for predictor/outcome pairs.
   - Implemented in `@optomitron/optimizer` via `src/pair-study.ts` + `src/__tests__/pair-study.test.ts`.
   - Includes adaptive bin tables, optimal values, evidence metrics, quality flags, and data-flow diagnostics.
   - Explicitly treated as a presentation/report adapter over unit/aggregate relationship semantics (not a separate inference path).
4. [x] Build a reusable pair-analysis runner (aggregate + jurisdiction support).
   - Implemented in `@optomitron/optimizer` via `src/variable-relationship-runner.ts` + tests.
   - Produces unit-level `NOf1VariableRelationship` summaries + aggregate `AggregateVariableRelationship`.
5. [x] Define and implement outcome "mega study" ranking method.
   - Implemented in `@optomitron/optimizer` via `src/outcome-mega-study-ranking.ts` + tests.
   - Includes configurable multiple-testing correction (`benjamini_hochberg`, `bonferroni`, `none`), confidence scoring, deterministic tie-breaking, and per-outcome grouped rankings.
6. [x] Build outcome hub pages (`/outcomes/:outcomeId`) with sortable predictor rankings.
   - Implemented in `packages/web/src/app/outcomes/page.tsx` and `packages/web/src/app/outcomes/[outcomeId]/page.tsx`.
   - Uses `@optomitron/optimizer` ranking output via shared adapter in `packages/web/src/lib/analysis-explorer-data.ts`.
7. [x] Build pair study pages (`/studies/:outcomeId/:predictorId`) with:
   - summary report
   - adaptive binning table(s)
   - optimal value section
   - evidence/diagnostics section
   - Implemented in `packages/web/src/app/studies/[outcomeId]/[predictorId]/page.tsx`.
   - Pair-study payloads are validated against `PairStudyResultSchema` before rendering.
8. [x] Add click-through navigation from outcome hubs to pair study pages.
   - Added route helpers in `packages/web/src/lib/analysis-explorer-routes.ts`.
   - Outcome hubs now link each ranked predictor to `/studies/:outcomeId/:predictorId`.
9. [x] Add link-outs from pair study pages to jurisdiction drilldown views.
   - Added `/studies/:outcomeId/:predictorId/jurisdictions` list and `/studies/:outcomeId/:predictorId/jurisdictions/:jurisdictionId` detail pages.
10. [x] Add precompute/caching strategy for heavy pair computations.
   - Added module-level cached explorer catalog in `packages/web/src/lib/analysis-explorer-data.ts`.
   - Rankings, pair studies, and route params are built once and reused.
11. [x] Add tests:
    - schema/contract tests
    - ranking correctness tests
    - route-level smoke tests
   - Added web adapter + route smoke tests in:
     - `packages/web/src/lib/__tests__/analysis-explorer-data.test.ts`
     - `packages/web/src/lib/__tests__/analysis-explorer-routes.test.ts`
12. [x] Enforce n-of-1 subject ID naming consistency across explorer contracts.
   - Replaced ambiguous analysis identity fields named `unitId` with `subjectId` in explorer-facing schemas/helpers.
   - Kept `unitId` reserved for `Unit` model references only.
13. [x] Add UCUM-based unit standardization foundation.
   - Added `UnitCodeSystem` enum with `UCUM` to DB schema and Zod contracts.
   - Added required `ucumCode` on `Unit` and seeded UCUM codes for baseline units.
   - Added validator tests for unit code system defaults and required `ucumCode`.
   - Follow-up: broaden importer/unit-conversion normalization rules to canonical UCUM equivalents during ingestion.
14. [x] Align foreign-key field names to explicit target model IDs.
   - Renamed ambiguous FK fields in Prisma + Zod contracts:
     - `connectionId` -> `integrationConnectionId`
     - `providerId` -> `integrationProviderId`
     - `parentId` -> `parentJurisdictionId`
     - `runId` -> `aggregationRunId`
   - Added missing `AlignmentScore -> AggregationRun` relation and back-reference on `AggregationRun`.
   - Updated seed and validator tests to match renamed FK fields.
15. [x] Remove residual analysis-level "unit" ambiguity in explorer contracts.
   - Renamed runner payload keys to subject terminology:
     - `units` -> `subjects`
     - `onUnitError` -> `onSubjectError`
     - `unitResults` -> `subjectResults`
     - `skippedUnits` -> `skippedSubjects`
   - Renamed pair-study coverage/bin/optimal support fields:
     - `includedUnits` -> `includedSubjects`
     - `skippedUnits` -> `skippedSubjects`
     - `units` -> `subjects` (bin rows)
     - `supportUnits` -> `supportSubjects`
16. [x] Standardize n-of-1 identity name to `subjectId`.
   - Replaced `nOf1EntityId`/`nOf1EntityName` with `subjectId`/`subjectName` in optimizer + db relationship contracts.
   - Updated pair-study n-of-1 scope key to `subject_n_of_1`.
   - Intentionally kept `userId` unchanged for ownership/auth semantics and kept `NOf1Variable` model naming unchanged for now.
17. [x] Add DB subject identity foundation for phased migration.
   - Added `SubjectType` enum and `Subject` model in Prisma + Zod contracts.
   - Linked `NOf1VariableRelationship.subjectId` to `Subject` as an explicit FK relation.
   - Added optional `NOf1Variable.subjectId` relation for forward-compatible ownership migration.
   - Added validator coverage for `SubjectType` and `Subject` model defaults/invalid values.
18. [x] Add bulk markdown artifact generation for registry-wide mega studies.
   - Added generator: `packages/examples/src/analysis-explorer/mega-study-generator.ts`.
   - Added CLI entry: `packages/examples/src/analysis-explorer/generate-mega-studies.ts`.
   - Added npm script: `pnpm --filter @optomitron/examples generate:mega-studies`.
   - Generates:
     - per-outcome mega-study markdown reports (ranked predictors + optimal values)
     - per predictor/outcome pair-study markdown reports
     - consolidated JSON + index markdown artifacts under `packages/examples/output/mega-studies`.
19. [x] Improve mega-study report readability and diagnostics.
   - Clarified directional metric language:
     - "Predictive Pearson" -> "Directional score (forward - reverse)".
   - Added explicit uncertainty-note text so adjusted p-values are not interpreted as classical NHST p-values.
   - Added evidence grade + direction columns to outcome ranking tables.
   - Added pair-level quality warnings (coverage/significance/directional-range checks).
   - Added observed predictor range in pair reports + extrapolation warning when optimal values fall outside observed support.
20. [x] Add richer study storytelling and exploratory distribution diagnostics.
   - Pair-study markdown now includes plain-language summary bullets.
   - Added predictor-bin pattern tables with outcome means/medians by bin.
   - Added text-based distribution charts (fixed-width histograms) for predictor and outcome values.
   - Outcome mega-study markdown now includes a plain-language top-predictor summary section.

