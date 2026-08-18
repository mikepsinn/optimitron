# AGENTS.md — @optimitron/optimizer

## Scope

Domain-agnostic causal inference engine. Takes any two time series and answers: does X cause Y, by how much, and what's the optimal value of X?

## Key Exports (do not break these signatures)

- `alignTimeSeries`, `alignOutcomeBased`, `alignPredictorBased` — temporal alignment
- `pearsonCorrelation`, `spearmanCorrelation`, `calculateEffectSize` — statistics
- `estimateDiminishingReturns`, `estimateMinimumEffectiveDose` — response curves
- `calculatePredictorImpactScore`, `validateDataQuality` — impact scoring
- `runFullAnalysis`, `generateMarkdownReport` — full pipeline
- All types from `./types.js`

## Dependencies

**None.** This is the foundation package. It must never import from any other `@optimitron/*` package.

## Rules

- **Domain-agnostic only.** Never reference drugs, policies, budgets, politicians, governments. Use: predictor, outcome, variable, measurement, effect.
- **Browser-safe.** No Node.js-only APIs, no Prisma, no DB imports.
- **Paper compliance.** Before changing any algorithm, read the dFDA Spec paper (`dfda-spec.warondisease.org`).
- **Test everything.** Every function should have unit tests with worked examples from the papers.

## Off-Limits

- Any other `packages/*` directory
- `packages/db/prisma/schema.prisma`
- `apps/optimitron/*`
