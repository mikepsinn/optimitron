# Plan: OECD + Direct Outcomes + FRED Improvements (v2)

1. [x] Replace synthetic OECD direct outcomes with sourced series or mark explicitly as simulated.
   - ✅ Already done: `oecd-direct-outcomes.ts` has explicit SIMULATED markers on all fields + DATA_PROVENANCE tracking
2. Add WHO HALE fetcher and wire dataset usage.
3. Expand OECD panel to include direct outcomes fields (education, healthcare, crime, climate).
4. Add GDP deflator option for US spending conversion.
5. Add caching and versioning metadata for static datasets.
6. Improve FRED fetcher reliability (keys, rate-limit handling).
