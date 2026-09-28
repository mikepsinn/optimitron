# @optimitron/obg

Optimal Budget Generator — optimizes budget allocation using diminishing returns modeling, cost-effectiveness analysis, and Budget Impact Scores.

**Paper:** [Optimal Budget Generator](https://obg.warondisease.org) — Evidence-based budget optimization using diminishing returns curves and welfare maximization.

**Related:**
- [Optimocracy](https://optimocracy.warondisease.org) — Two-metric welfare function
- [dFDA Specification](https://dfda-spec.warondisease.org) — Causal inference engine (dependency)

**Source:** [QMD](https://github.com/mikepsinn/disease-eradication-plan/blob/main/knowledge/appendix/optimal-budget-generator-spec.qmd)

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

## Tests

Unit-tested — run `pnpm --filter @optimitron/obg test` for the live count.

```bash
pnpm test --filter @optimitron/obg
```
