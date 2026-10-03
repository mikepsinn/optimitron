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

## Program funding scenarios

`optimizeWithUncertainty()` selects one feasible portfolio by expected net
benefit, then evaluates that same choice across common Monte Carlo draws.
Mutually exclusive options share a group, so overlapping clinical programs
cannot have their standalone benefits added together. The allocation grid
rounds costs up and permits unspent funds.

`evaluateClinicalDiscoveryScenario()` integrates a supplied discovery-rate
schedule over a finite horizon. It separates the financed period from later
benefits, discounts annual flows, and retains negative effects.

The standalone US example combines five explicit reference interventions with
four military funding ceilings. It reports native outcomes, model intervals,
source inputs, sensitivity cases, and a balanced federal ledger. Its monetized
objective does not estimate a country budget that maximizes median health and
after-tax income. Existing app pages do not consume these results.

From the repository root:

```bash
pnpm --filter @optimitron/obg... build
pnpm --filter @optimitron/web generate:policy-scenarios --generated-at 2026-09-27T00:00:00.000Z
```

The command writes JSON and Markdown to
`apps/optimitron/public/reports/us-budget-policy-decision.{json,md}`.
Use `--draws`, `--seed`, or `--output-dir` to change the simulation or output.
The same seed, inputs, draw count, and timestamp reproduce both files.

Input definitions live in
`@optimitron/data/datasets/us-policy-scenario-inputs`; US-specific financing and
valuation assumptions live in `apps/optimitron/scripts/analysis/`. The OBG
library accepts supplied values and has no data or filesystem dependency.

## Deferred welfare solver research

`optimizeWelfareBudget()` allocates a fixed total across supplied, additive
concave response curves for median healthy life years and median real after-tax
income growth. It reuses the existing diminishing-return functions and OPG
welfare definition. Paired curve draws select one allocation by expected welfare
and evaluate that same allocation across all draws.

No calibrated country response curves or national results ship with this branch.
The tests use synthetic analytical examples. The solver does not power any app
page, and it does not estimate the total budget itself.

To evaluate a supplied `WelfareBudgetDocument` after building OBG:

```bash
pnpm --filter @optimitron/web generate:welfare-budget --input document.json --output output/welfare-budget
```

The document must name the jurisdiction, fiscal year, currency, effect horizon,
exact median endpoints, and source references for every adjustable category.
The adapter writes matching JSON and Markdown. Sources document the supplied
curves; their presence does not establish causal calibration.

## Tests

Unit-tested — run `pnpm --filter @optimitron/obg test` for the live count.

```bash
pnpm test --filter @optimitron/obg
```
