# @optimitron/obg

Optimal Budget Generator — optimizes budget allocation using diminishing returns modeling, cost-effectiveness analysis, and Budget Impact Scores.

**Paper:** [Optimal Budget Generator](https://obg.warondisease.org) — Evidence-based budget optimization using diminishing returns curves and welfare maximization.

**Related:**
- [Optimocracy](https://optimocracy.warondisease.org) — Two-metric welfare function
- [dFDA Specification](https://dfda-spec.warondisease.org) — Causal inference engine (dependency)

**Source:** [QMD](https://github.com/mikepsinn/disease-eradication-plan/blob/main/knowledge/appendix/optimal-budget-generator-spec.qmd)

## Country budget generator

`generateOptimalBudget()` assembles public spending categories from supplied
country observations and scales their per-resident costs to a population.
`scaleOptimalBudgetScenario()` rescales a result without selecting references again.
The package stays browser-safe; source fetching and country datasets live in
`@optimitron/data`, and `/obg` supplies those inputs.

For healthcare, `calculateHealthcareFrontier()` compares total care costs and
healthy life expectancy worldwide. The public budget uses the selected system's
government health spending, including research and investment. Other categories
use `selectBudgetReferences()` to choose the cheapest country meeting the outcome
targets. It shares the selection primitive used by the existing
`analyzeEfficiency()` API, whose thresholds and output remain unchanged.

The checked-in example uses 2017–2019 spending in constant 2021 international
dollars, 178 healthcare systems, and 30 countries with comparable functional
public accounts. Median income and healthy life expectancy remain separate
outcome targets. The result assumes the selected systems can be adopted together.

Regenerate sources and the downloadable JSON/Markdown report from the repo root:

```bash
pnpm --filter @optimitron/data generate:optimal-budget
pnpm --filter @optimitron/data generate:healthcare-cofog
pnpm --filter @optimitron/obg... build
pnpm --filter @optimitron/web generate:optimal-budget
```

Source generators reuse cached responses under `packages/data/output/`; use
`--refresh` to download them again. Their snapshots retain source URLs, retrieval
times, raw-response hashes, units, and missing values.

## Tests

Unit-tested — run `pnpm --filter @optimitron/obg test` for the live count.

```bash
pnpm test --filter @optimitron/obg
```
