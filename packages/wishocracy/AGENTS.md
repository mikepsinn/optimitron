# AGENTS.md — @optimitron/wishocracy

## Scope

RAPPA calculation engine — Randomized Aggregated Pairwise Preference Allocation. Pure math for preference aggregation, eigenvector methods, alignment scoring, and manipulation detection.

## Key Exports (do not break these signatures)

- Pairwise comparison and aggregation functions
- Weighted aggregation with eigenvector methods
- Alignment analysis and scoring
- Convergence testing
- Matrix completion and bootstrap confidence intervals
- Manipulation detection

## Dependencies

**None.** Standalone pure math library. Must never import from any other `@optimitron/*` package.

## Rules

- **Browser-safe.** No Node.js-only APIs, no Prisma, no DB imports.
- **Paper compliance.** Before changing any algorithm, read the Wishocracy paper (`wishocracy.warondisease.org`).
- **Pure functions.** No side effects, no I/O. Input data in, results out.

## Off-Limits

- Any other `packages/*` directory
- `packages/db/prisma/schema.prisma`
