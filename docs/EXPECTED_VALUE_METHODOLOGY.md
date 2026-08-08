# Expected Value Methodology

**The rules live in code, not here**, so the prose cannot drift from the numbers
it describes:

- Source: `packages/data/src/parameters/expected-value-methodology.ts`
  (`EXPECTED_VALUE_METHODOLOGY_MARKDOWN`) — every figure is interpolated from the
  parameter catalog.
- Rendered for humans at **`/methodology`**.
- Quoted for agents in the MCP `setTaskImpact` / `proposeTaskImpact` tool
  descriptions via `EXPECTED_VALUE_RULE_SUMMARY`.
- Horizon and derived mission values:
  `packages/data/src/parameters/mission-value-horizon.ts`.

## The short version

> Conditional value = annual welfare effect × 73.4 years (one human lifetime),
> undiscounted, with probability stated separately. **A goal's value is written
> from sourced parameters, never summed from its subtasks.**

Zero discount rate because probability already prices uncertainty, and what
remains is time preference — an ethical choice rather than a measurement, better
made visible and uniform than buried per estimate.

No summing because sibling tasks are usually *alternative routes to one
outcome*: the six mechanisms under End War all carry the same peace dividend and
differ only in probability, so adding them counts it six times.

## Known inconsistency

`GLOBAL_WAR_COST_LIFETIME_*` use an 80-year "lifespan" and compound at SIPRI's
2.76% real CAGR. This methodology uses the measured 73.4
(`GLOBAL_LIFE_EXPECTANCY_2024`, itself corrected down from 79 by adversarial
review on the principle that a measured parameter must carry the measured
value). Those parameters feed published manual pages, so reconciling them is a
deliberate follow-up rather than a silent rewrite.
