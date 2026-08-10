import {
  DISEASE_BURDEN_GDP_DRAG_PCT,
  GLOBAL_ANNUAL_DIRECT_INDIRECT_WAR_COST,
  GLOBAL_GDP_2025,
  GLOBAL_LIFE_EXPECTANCY_2024,
  GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025,
  GLOBAL_POPULATION_2024,
  PRIZE_TARGET_MEDIAN_INCOME_YEAR_15,
  VALUE_OF_STATISTICAL_LIFE,
} from "./parameters-calculations-citations";
import {
  END_DISEASE_MISSION_SCENARIO_VALUE_USD,
  END_POVERTY_MISSION_SCENARIO_VALUE_USD,
  END_WAR_MISSION_SCENARIO_VALUE_USD,
  FARMED_ANIMAL_ADVOCACY_SPENDING_2024,
  MINIMIZE_ANIMAL_SUFFERING_MISSION_SCENARIO_VALUE_USD,
  MISSION_VALUE_HORIZON_YEARS,
  PREVENT_EXTINCTION_MISSION_SCENARIO_VALUE_USD,
} from "./mission-value-horizon";

/**
 * Best available provenance link for a parameter, or null.
 *
 * Not every parameter carries `sourceUrl` -- a calculated one like the war
 * cost has a derivation (`calculationsUrl`) rather than a single citation.
 * Reaching straight for `sourceUrl` published "(undefined)" as the href on a
 * public page, so this resolves in order of usefulness and the caller renders
 * plain text when there is nothing to link.
 */
function provenanceUrl(param: {
  calculationsUrl?: string;
  manualPageUrl?: string;
  sourceUrl?: string;
}): string | null {
  return (
    param.calculationsUrl ?? param.sourceUrl ?? param.manualPageUrl ?? null
  );
}

/** Markdown link when the parameter has provenance, plain text when it does not. */
function citedText(
  label: string,
  param: {
    calculationsUrl?: string;
    manualPageUrl?: string;
    sourceUrl?: string;
  },
) {
  const url = provenanceUrl(param);
  return url ? `[${label}](${url})` : label;
}

function usdShort(value: number) {
  if (Math.abs(value) >= 1e15) {
    const scaled = value / 1e15;
    return `$${scaled.toFixed(Math.abs(scaled) >= 100 ? 0 : 1)} quadrillion`;
  }
  const units: Array<[number, string]> = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
  ];
  for (const [size, suffix] of units) {
    if (Math.abs(value) >= size) {
      const scaled = value / size;
      return `$${scaled.toFixed(Math.abs(scaled) >= 100 ? 0 : 1)}${suffix}`;
    }
  }
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/**
 * Human-readable methodology. Catalog values are interpolated so the worked
 * examples use the same current inputs as the mission calculations.
 */
export const EXPECTED_VALUE_METHODOLOGY_MARKDOWN = `# Mission value and task expected value

Optimitron shows two different quantities. They answer different questions.

## Mission outcome: value if achieved

A mission describes an outcome, such as ending war or ending disease. The
mission value asks what that outcome would be worth under one stated scenario.

**Mission value is not a forecast. We do not estimate the mission's probability.**

The task tree labels comparable mission scenarios **Value if achieved**. It
does not use the quantity as task expected value or task priority.

The tree leaves a mission value empty when the available scenario measures a
different quantity. The methodology can still show that scenario as context.

### Mission comparison scenario

End War, End Disease, and End Poverty use this calculation:

**Value if achieved = current annual outcome value × ${MISSION_VALUE_HORIZON_YEARS} years**

The extinction reference scenario values today's population once. It does not
multiply current lives by the comparison period. The tree does not compare it
with the three annual-flow scenarios.

| Assumption | Current choice |
| --- | --- |
| Comparison period | **${MISSION_VALUE_HORIZON_YEARS} years** |
| Reference for that period | Global life expectancy at birth (${citedText("WHO, 2024", GLOBAL_LIFE_EXPECTANCY_2024)}) |
| Start of the full effect | Immediately |
| Annual value | Flat for the full period |
| Growth | None |
| Discount rate | **0** |
| Mission probability | Not estimated |

These are chosen scenario assumptions. They are not facts about every task.
Changing an assumption changes the mission value.

The ${MISSION_VALUE_HORIZON_YEARS}-year period does not become a default task
duration. Each task keeps the duration supported by its own evidence.

## Task scenario: probability-weighted expected value

A task estimate describes one stated success scenario. Current task-tree
estimates use this calculation:

**Task scenario expected value = stated outcome value if the task succeeds × P(success | task funded or done)**

The probability is the stated chance of success if the task gets funded or
completed.

Current task-tree estimates do not subtract the chance of success without the
task. They do not estimate the value caused by the task alone.

Several alternative mechanisms can target the same outcome. Their estimates
overlap. Do not add them.

### When a without-task baseline exists

A sourced without-task baseline can support a marginal decision estimate. This
estimate measures the value caused by the task alone:

**Marginal decision estimate = stated outcome value × [P(success | task funded or done) − P(success | no task funding or work)]**

Use this formula only when sources support both probabilities. Call the result
marginal. Current task-tree estimates do not use this formula.

The task record stores the probability-weighted scenario value. The queue uses
it with task effort and cost.

Use the task's actual effect duration. A one-time benefit stays one-time. A
five-year estimate stays five-year unless new analysis recalculates it.

Recalculate the value before you change its duration or assumptions.

## Do not add task estimates into a mission

Adding overlapping task estimates can count the same outcome more than once. A
subtask must not change the mission's value if achieved.

Show mission outcomes and task scenario estimates separately.

## Worked mission scenario: ending war

| Step | Source | Value |
| --- | --- | --- |
| Current annual cost of war | ${citedText("direct and indirect global cost", GLOBAL_ANNUAL_DIRECT_INDIRECT_WAR_COST)} | ${usdShort(GLOBAL_ANNUAL_DIRECT_INDIRECT_WAR_COST.value)}/year |
| × comparison period | ${MISSION_VALUE_HORIZON_YEARS} years | **${usdShort(END_WAR_MISSION_SCENARIO_VALUE_USD)}** |

The task tree shows **Value if achieved ${usdShort(END_WAR_MISSION_SCENARIO_VALUE_USD)}**.
It does not claim that ending war has a known probability.

This scenario uses the whole annual cost of war. The 1% Treaty addresses a
smaller outcome and needs its own task scenario estimate.

## Worked mission scenario: ending disease

| Step | Source | Value |
| --- | --- | --- |
| Share of GDP lost to disease | ${citedText(`${(DISEASE_BURDEN_GDP_DRAG_PCT.value * 100).toFixed(0)}%`, DISEASE_BURDEN_GDP_DRAG_PCT)} | of ${citedText(usdShort(GLOBAL_GDP_2025.value), GLOBAL_GDP_2025)} |
| Current annual economic drag | Productivity loss and medical cost | ${usdShort(DISEASE_BURDEN_GDP_DRAG_PCT.value * GLOBAL_GDP_2025.value)}/year |
| × comparison period | ${MISSION_VALUE_HORIZON_YEARS} years | **${usdShort(END_DISEASE_MISSION_SCENARIO_VALUE_USD)}** |

This scenario covers economic drag. It does not price pain or suffering.

## Worked mission scenario: ending poverty

| Step | Source | Value |
| --- | --- | --- |
| Current global median after-tax income | ${citedText(usdShort(GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025.value), GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025)} | per person per year |
| 2040 prize target | ${citedText(usdShort(PRIZE_TARGET_MEDIAN_INCOME_YEAR_15.value), PRIZE_TARGET_MEDIAN_INCOME_YEAR_15)} | per person per year |
| Annual gap × current population | ${citedText(GLOBAL_POPULATION_2024.value.toLocaleString("en-US"), GLOBAL_POPULATION_2024)} people | ${usdShort((PRIZE_TARGET_MEDIAN_INCOME_YEAR_15.value - GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025.value) * GLOBAL_POPULATION_2024.value)}/year |
| × comparison period | ${MISSION_VALUE_HORIZON_YEARS} years | **${usdShort(END_POVERTY_MISSION_SCENARIO_VALUE_USD)}** |

This population-equivalent scenario values the income gap at the global median.
It is not a forecast of income distribution or mission success.

## Reference scenario: preventing extinction

| Step | Source | Value |
| --- | --- | --- |
| Current human population | ${citedText(GLOBAL_POPULATION_2024.value.toLocaleString("en-US"), GLOBAL_POPULATION_2024)} | current lives only |
| Value per statistical life | ${citedText(usdShort(VALUE_OF_STATISTICAL_LIFE.value), VALUE_OF_STATISTICAL_LIFE)} | policy-analysis value |
| Current lives × value per life | One-time scenario | **${usdShort(PREVENT_EXTINCTION_MISSION_SCENARIO_VALUE_USD)}** |

The task tree does not display this number as a mission value. It is not
comparable with the three annual-flow scenarios.

The scenario excludes every future generation. It does not multiply current
lives by the ${MISSION_VALUE_HORIZON_YEARS}-year comparison period. It does not
estimate extinction probability. The value of a statistical life represents
collective willingness to pay for small mortality-risk reductions. It is not a
price assigned to a certain death.

## Funding context: minimizing animal suffering

No accepted dollar conversion covers all species and harmful experiences. The
task tree therefore leaves this mission value empty.

| Step | Source | Value |
| --- | --- | --- |
| Farmed-animal advocacy allocation in 2024 | ${citedText(usdShort(FARMED_ANIMAL_ADVOCACY_SPENDING_2024.value), FARMED_ANIMAL_ADVOCACY_SPENDING_2024)} | observed annual spending |
| × comparison period | ${MISSION_VALUE_HORIZON_YEARS} years | **${usdShort(MINIMIZE_ANIMAL_SUFFERING_MISSION_SCENARIO_VALUE_USD)} in funding context** |

This amount covers farmed-animal advocacy. It excludes companion-animal markets,
wild-animal welfare, and most direct animal care. It does not include pet food
or veterinary spending. It is an input cost, not the value of minimizing animal
suffering. The tree does not display it as a mission value or use it for ranking.

[Rethink Priorities estimates](https://rethinkpriorities.org/research-area/welfare-range-estimates/)
a median welfare range of 0.332 for chickens, compared with 1.0 for humans.
That estimate concerns possible experience intensity. It does not mean one
chicken life equals 0.332 human lives. A dollar valuation would also require
the affected populations, duration, intensity, intervention effect, and moral
weights. No accepted model currently supplies all of those inputs.

## Write a task estimate

1. State the outcome and the task scenario.
2. Estimate P(success | task funded or done).
3. Use the effect duration supported by the evidence.
4. Calculate the task scenario expected value.
5. Record the formula, assumptions, and sources with the estimate.

If a sourced without-task baseline exists, record both probabilities. Label the
result as a marginal decision estimate.

Leave the value empty when the evidence cannot support an estimate. A missing
estimate is clearer than a guess that enters the ranking.
`;
