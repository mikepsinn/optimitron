# Plan: OECD + Direct Outcomes + FRED Improvements (v2)

1. [x] Replace synthetic OECD direct outcomes with sourced series or mark explicitly as simulated.
   - ✅ Already done: `oecd-direct-outcomes.ts` has explicit SIMULATED markers on all fields + DATA_PROVENANCE tracking
2. [x] Add WHO HALE fetcher and wire dataset usage.
3. Expand OECD panel to include direct outcomes fields (education, healthcare, crime, climate).
   - Currently missing: Education outcomes (PISA?), Crime (Homicide is there, maybe Safety?), Climate (CO2 emissions?), Healthcare outcomes (beyond LE/HALE/Infant Mortality - maybe Cancer survival?)
4. Add GDP deflator option for US spending conversion.
5. Add caching and versioning metadata for static datasets.
6. Improve FRED fetcher reliability (keys, rate-limit handling).
7. [x] Publish dual-scale spending diagnostics in government-size outputs: `% GDP` bins + derived per-capita PPP bins.
   - Added adaptive binning metadata to JSON and companion markdown table (2026-02-13).
8. [x] Ensure reproducible workspace execution for examples by building upstream package deps before generation/tests.
   - `packages/examples/package.json` now runs `build:deps` ahead of `generate:*`, demos, and tests (2026-02-13).
9. [x] Define and publish `VariableRegistry` seed dataset for all predictor/outcome IDs.
   - Implemented in `packages/data/src/variable-registry.ts` with exported schema + helper APIs.
   - Includes units, directionality, coverage windows/status, transforms, and lag defaults.
10. [x] Add precompute index metadata for heavy pair analyses.
   - Implemented explorer precompute index in `packages/web/src/lib/analysis-explorer-data.ts`.
   - Added source fingerprints + cache key hash + counts:
     - outcomes, predictors, pairs, subjects
   - Added cache invalidation check using source hash snapshots.
   - Surfaced metadata in `ProvenanceBlock` on outcomes/outcome-hub/pair-study pages.
