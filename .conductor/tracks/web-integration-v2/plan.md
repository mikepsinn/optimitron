# Plan: Wire Library Outputs to Pages + JSON Schema (v2)

1. [x] Define JSON schema for outcome hub ranking payload.
   - Implemented in `@optomitron/optimizer/src/outcome-mega-study-ranking.ts`.
   - Includes row schema, ranking payload schema, and multiple-testing metadata.
2. [x] Normalize relationship naming in optimizer-facing contracts.
   - `UnitVariableRelationship` and `AggregateVariableRelationship` are canonical.
   - Runner payload fields now use `unitVariableRelationship` and `aggregateVariableRelationship`.
   - `@optomitron/db` models and Zod schemas use the same canonical names.
3. [ ] Define JSON schema for pair study payload.
4. [ ] Define JSON schema for jurisdiction N-of-1 summary payload.
5. [ ] Add route map and URL contract docs for:
   - `/outcomes/:outcomeId`
   - `/studies/:outcomeId/:predictorId`
   - `/studies/:outcomeId/:predictorId/jurisdictions/:jurisdictionId`
6. [ ] Implement web pages for the above routes.
7. [ ] Add provenance/freshness block shared component.
8. [ ] Add schema validation in build or CI.
9. [ ] Add end-to-end smoke test for explorer navigation flow.
