# AGENTS.md — @optimitron/obg

## Scope

Optimal Budget Generator — diminishing returns, cost-effectiveness analysis, Budget Impact Score, efficient frontier, overspend analysis, and budget reports.

## Key Exports (do not break these signatures)

- Diminishing returns estimation
- Cost-effectiveness analysis
- Budget Impact Score calculation
- Efficient frontier computation
- Country analysis and reports
- Re-exports welfare types from `@optimitron/opg`

## Dependencies

- `@optimitron/optimizer` — causal inference
- `@optimitron/opg` — welfare metrics, policy types
- `import type` from `@optimitron/db` is OK (type-only)

## Rules

- **No Prisma runtime imports.** Use `import type` only from `@optimitron/db`.
- **Paper compliance.** Read the OBG paper (`obg.warondisease.org`) before algorithm changes.
- **Browser-safe.** Library code must work in browser.

## Off-Limits

- `packages/optimizer/*`, `packages/opg/*` — use them, don't modify them
- `packages/web/*`
- `packages/db/prisma/schema.prisma`
