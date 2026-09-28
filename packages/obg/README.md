# @optimitron/obg

Optimal Budget Generator — optimizes budget allocation using diminishing returns modeling, cost-effectiveness analysis, and Budget Impact Scores.

**Paper:** [Optimal Budget Generator](https://obg.warondisease.org) — Evidence-based budget optimization using diminishing returns curves and welfare maximization.

**Related:**
- [Optimocracy](https://optimocracy.warondisease.org) — Two-metric welfare function
- [dFDA Specification](https://dfda-spec.warondisease.org) — Causal inference engine (dependency)

**Source:** [QMD](https://github.com/mikepsinn/disease-eradication-plan/blob/main/knowledge/appendix/optimal-budget-generator-spec.qmd)

## Generate an optimal budget

`generateOptimalBudget()` in `src/optimal-budget-generator.ts` is the public
entry point for assembling a country budget. It selects category references,
uses the global healthcare frontier, reconciles public healthcare accounts and
service breakdowns, and scales annual allocations to the supplied population.
It returns all supported outcome-target and healthcare-gap scenarios.

Pass the comparable country dataset and separate public healthcare accounts
from `@optimitron/data`; OBG itself does not load datasets or depend on the app:

```ts
import { generateOptimalBudget, scaleOptimalBudgetScenario } from '@optimitron/obg';
import { OPTIMAL_BUDGET_DATA } from '@optimitron/data/datasets/optimal-budget';
import { HEALTHCARE_COFOG_DATA } from '@optimitron/data/datasets/healthcare-cofog';

const budget = generateOptimalBudget({
  ...OPTIMAL_BUDGET_DATA,
  healthcareBudgets: HEALTHCARE_COFOG_DATA.countries,
  population: 1_000_000,
});
const largerCountry = scaleOptimalBudgetScenario(budget.scenarios[0]!, 2_000_000);
```

The page and report generator share this entry point. `selectBudgetReferences()`
and `calculateHealthcareFrontier()` remain reusable selection helpers;
`optimizeWelfareBudget()` remains the separate response-curve allocation solver.

## Tests

Unit-tested — run `pnpm --filter @optimitron/obg test` for the live count.

```bash
pnpm test --filter @optimitron/obg
```
