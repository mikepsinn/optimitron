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

> Conditional value = annual welfare effect × one human lifetime
> (`MISSION_VALUE_HORIZON_YEARS`, which tracks `GLOBAL_LIFE_EXPECTANCY_2024`),
> undiscounted, with success probability recorded in its own field.
> **A goal's value is written from sourced parameters, never summed from its
> subtasks.**

The horizon is deliberately not repeated here — read it from the constant or
from `/methodology`, both of which come from the catalog. A number copied into
prose is a number that goes stale.

Zero discount rate because probability already prices uncertainty, and what
remains is time preference — an ethical choice rather than a measurement, better
made visible and uniform than buried per estimate.

No summing because sibling tasks are usually *alternative routes to one
outcome*: six mechanisms across the tree (the Court, the treaty, the Loving
Takeover, the prize, the dFDA, the shirt cascade) all carry the same peace
dividend and differ only in probability, so adding them counts it six times.
They sit under different parents — the dFDA under End Disease, the shirt seed
under the treaty — because they reach that dividend by different arguments.

Conditional value and expected value are distinct: `expectedEconomicValueUsd*`
fields hold conditional × probability, and the MCP write path expects the caller
to have done that multiplication already. `/methodology` spells this out.

## Known inconsistency

`GLOBAL_WAR_COST_LIFETIME_*` use an 80-year "lifespan" and compound at SIPRI's
2.76% real CAGR. This methodology uses the measured 73.4
(`GLOBAL_LIFE_EXPECTANCY_2024`, itself corrected down from 79 by adversarial
review on the principle that a measured parameter must carry the measured
value). Those parameters feed published manual pages, so reconciling them is a
deliberate follow-up rather than a silent rewrite.
