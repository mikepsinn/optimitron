# Conventions

## Naming

| Convention | Example | Rationale |
|-----------|---------|-----------|
| FK field names match target model | `globalVariableId` not `variableId` | Unambiguous foreign keys |
| Predictor/outcome terminology | `predictorGlobalVariableId` | More scientifically honest than cause/effect |
| Outcome not effect in properties | `outcomeBaselineAverage` | But `effectSize` stays (Cohen's d is correct) |
| Enums over magic strings | `FillingType.ZERO` | DB-enforced valid values |
| `deletedAt` on all models | Soft deletes | cr-sqlite sync, audit trail, data recovery |
| No CureDAO/QuantiModo branding | "legacy API" | Mike doesn't want DAO association |

## Package Naming

Each package is named after its corresponding paper:
- `optimizer` → dFDA Spec (causal inference engine)
- `wishocracy` → Wishocracy paper (RAPPA)
- `opg` → Optimal Policy Generator paper
- `obg` → Optimal Budget Generator paper
- `data` → Data fetchers (no paper)
- `db` → Database schema (no paper)

## Commit Messages

Conventional commits:
```
feat(optimizer): Add reverse Pearson correlation
fix(data): Guard against NaN in daily aggregation
test(wishocracy): Add weighted aggregation tests
docs: Update ARCHITECTURE.md
ci: Fix deploy workflow pnpm version
```

## Domain Agnosticism

`@optimitron/optimizer` MUST be completely domain-agnostic:
- ❌ "drugs", "supplements", "patients", "policies", "budgets", "politicians"
- ✅ "predictor", "outcome", "variable", "measurement", "effect size", "time series"

A business analyst should be able to use it for revenue optimization without seeing the word "government".

## Testing

- Every function gets a test. No exceptions.
- Integration tests spanning packages go in `packages/examples/`
- Use `describe.skip` for tests that need pending work, not deletion
- Edge cases: NaN, Infinity, empty arrays, single-element arrays, zero values
- `pnpm review:test-output -- --file <path>` is available for non-blocking AI triage of test/build/typecheck logs

## File Size Limits

- Functions: <30 lines
- Files: <300 lines
- If bigger, split it
