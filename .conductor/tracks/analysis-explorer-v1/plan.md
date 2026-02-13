# Plan: Universal Predictor-Outcome Explorer + Outcome Hubs (v1)

1. [x] Normalize core relationship terminology in optimizer and db.
   - Renamed `UserVariableRelationship` -> `UnitVariableRelationship`.
   - Renamed `GlobalVariableRelationship` -> `AggregateVariableRelationship`.
   - Renamed `UserVariable` -> `UnitVariable` and `numberOfUserVariables` -> `numberOfUnitVariables`.
   - Renamed aggregation helper `aggregateGlobalVariableRelationships` -> `aggregateUnitVariableRelationships`.
   - Updated runner payload fields to `unitVariableRelationship` and `aggregateVariableRelationship`.
   - Updated Prisma models and Zod schemas to `UnitVariableRelationship` / `AggregateVariableRelationship`.
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
   - Produces unit-level `UnitVariableRelationship` summaries + aggregate `AggregateVariableRelationship`.
5. [x] Define and implement outcome "mega study" ranking method.
   - Implemented in `@optomitron/optimizer` via `src/outcome-mega-study-ranking.ts` + tests.
   - Includes configurable multiple-testing correction (`benjamini_hochberg`, `bonferroni`, `none`), confidence scoring, deterministic tie-breaking, and per-outcome grouped rankings.
6. [ ] Build outcome hub pages (`/outcomes/:outcomeId`) with sortable predictor rankings.
7. [ ] Build pair study pages (`/studies/:outcomeId/:predictorId`) with:
   - summary report
   - adaptive binning table(s)
   - optimal value section
   - evidence/diagnostics section
8. [ ] Add click-through navigation from outcome hubs to pair study pages.
9. [ ] Add link-outs from pair study pages to jurisdiction drilldown views.
10. [ ] Add precompute/caching strategy for heavy pair computations.
11. [ ] Add tests:
    - schema/contract tests
    - ranking correctness tests
    - route-level smoke tests
