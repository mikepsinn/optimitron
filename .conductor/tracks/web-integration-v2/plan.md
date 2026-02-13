# Plan: Wire Library Outputs to Pages + JSON Schema (v2)

1. [x] Define JSON schema for outcome hub ranking payload.
   - Implemented in `@optomitron/optimizer/src/outcome-mega-study-ranking.ts`.
   - Includes row schema, ranking payload schema, and multiple-testing metadata.
2. [x] Normalize relationship naming in optimizer-facing contracts.
   - `NOf1VariableRelationship` and `AggregateVariableRelationship` are canonical.
   - Runner payload fields now use `nOf1VariableRelationship` and `aggregateVariableRelationship`.
   - `@optomitron/db` models and Zod schemas use the same canonical names.
3. [x] Define JSON schema for pair study payload.
   - Implemented in `@optomitron/optimizer/src/pair-study.ts`.
   - Web adapter validates generated payloads through `validatePairStudyResult(...)`.
4. [x] Define JSON schema for jurisdiction N-of-1 summary payload.
   - Implemented as typed explorer contract in `packages/web/src/lib/analysis-explorer-types.ts` (`ExplorerSubjectSummary`).
5. [x] Add route map and URL contract docs for:
   - `/outcomes/:outcomeId`
   - `/studies/:outcomeId/:predictorId`
   - `/studies/:outcomeId/:predictorId/jurisdictions/:jurisdictionId`
   - Added route docs: `.conductor/tracks/web-integration-v2/routes.md`.
   - Added route helper module: `packages/web/src/lib/analysis-explorer-routes.ts`.
6. [x] Implement web pages for the above routes.
   - Added:
     - `packages/web/src/app/outcomes/page.tsx`
     - `packages/web/src/app/outcomes/[outcomeId]/page.tsx`
     - `packages/web/src/app/studies/[outcomeId]/[predictorId]/page.tsx`
     - `packages/web/src/app/studies/[outcomeId]/[predictorId]/jurisdictions/page.tsx`
     - `packages/web/src/app/studies/[outcomeId]/[predictorId]/jurisdictions/[jurisdictionId]/page.tsx`
7. [x] Add provenance/freshness block shared component.
   - Added `packages/web/src/components/analysis/provenance-block.tsx`.
8. [x] Add schema validation in build or CI.
   - Adapter enforces `PairStudyResultSchema` at build/runtime via `validatePairStudyResult(...)`.
9. [x] Add end-to-end smoke test for explorer navigation flow.
   - Added route-level smoke tests in `packages/web/src/lib/__tests__/analysis-explorer-routes.test.ts`.
