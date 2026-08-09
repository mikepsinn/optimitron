# /methodology

## Metadata

- Page title: Mission Value and Task Expected Value | International Campaign to End War and Disease
- Meta description: See how mission outcome values differ from probability-weighted task estimates.
- Canonical: https://warondisease.org/methodology
- Open Graph title: Mission Value and Task Expected Value
- Open Graph description: See how mission outcome values differ from probability-weighted task estimates.
- Open Graph image: https://warondisease.org/api/og/route?path=%2Fmethodology
- Twitter title: Mission Value and Task Expected Value
- Twitter description: See how mission outcome values differ from probability-weighted task estimates.

## Visible Page Copy

## Mission value and task expected value
- Optimitron shows two different quantities. They answer different questions.
### Mission outcome: value if achieved
- A mission describes an outcome, such as ending war or ending disease. The mission value asks what that outcome would be worth under one stated scenario.
- Mission value is not a forecast. We do not estimate the mission's probability.
- The task tree labels this quantity Value if achieved. It does not use the quantity as task expected value or task priority.
#### Mission comparison scenario
- The current scenario uses this calculation:
- Value if achieved = current annual outcome value × 73.4 years
| ASSUMPTION | CURRENT CHOICE |
| --- | --- |
| Comparison period | 73.4 years |
| Reference for that period | Global life expectancy at birth ([WHO, 2024](https://manual.WarOnDisease.org/calculations.html#sec-global_life_expectancy_2024)) |
| Start of the full effect | Immediately |
| Annual value | Flat for the full period |
| Growth | None |
| Discount rate | 0 |
| Mission probability | Not estimated |
- These are chosen scenario assumptions. They are not facts about every task. Changing an assumption changes the mission value.
- The 73.4-year period does not become a default task duration. Each task keeps the duration supported by its own evidence.
### Task scenario: probability-weighted expected value
- A task estimate describes one stated success scenario. Current task-tree estimates use this calculation:
- Task scenario expected value = stated outcome value if the task succeeds × P(success | task funded or done)
- The probability is the stated chance of success if the task gets funded or completed.
- Current task-tree estimates do not subtract the chance of success without the task. They do not estimate the value caused by the task alone.
- Several alternative mechanisms can target the same outcome. Their estimates overlap. Do not add them.
#### When a without-task baseline exists
- A sourced without-task baseline can support a marginal decision estimate. This estimate measures the value caused by the task alone:
- Marginal decision estimate = stated outcome value × [P(success | task funded or done) − P(success | no task funding or work)]
- Use this formula only when sources support both probabilities. Call the result marginal. Current task-tree estimates do not use this formula.
- The task record stores the probability-weighted scenario value. The queue uses it with task effort and cost.
- Use the task's actual effect duration. A one-time benefit stays one-time. A five-year estimate stays five-year unless new analysis recalculates it.
- Recalculate the value before you change its duration or assumptions.
### Do not add task estimates into a mission
- Adding overlapping task estimates can count the same outcome more than once. A subtask must not change the mission's value if achieved.
- Show mission outcomes and task scenario estimates separately.
### Worked mission scenario: ending war
| STEP | SOURCE | VALUE |
| --- | --- | --- |
| Current annual cost of war | [direct and indirect global cost](https://manual.WarOnDisease.org/calculations.html#sec-global_annual_direct_indirect_war_cost) | $11.4T/year |
| × comparison period | 73.4 years | $834T |
- The task tree shows Value if achieved $834T. It does not claim that ending war has a known probability.
- This scenario uses the whole annual cost of war. The 1% Treaty addresses a smaller outcome and needs its own task scenario estimate.
### Worked mission scenario: ending disease
| STEP | SOURCE | VALUE |
| --- | --- | --- |
| Share of GDP lost to disease | [13%](https://manual.WarOnDisease.org/calculations.html#sec-disease_burden_gdp_drag_pct) | of [$115T](https://manual.WarOnDisease.org/calculations.html#sec-global_gdp_2025) |
| Current annual economic drag | Productivity loss and medical cost | $14.9T/year |
| × comparison period | 73.4 years | $1.1 quadrillion |
- This scenario covers economic drag. It does not price pain or suffering.
### Write a task estimate
- State the outcome and the task scenario.
- Estimate P(success | task funded or done).
- Use the effect duration supported by the evidence.
- Calculate the task scenario expected value.
- Record the formula, assumptions, and sources with the estimate.
- If a sourced without-task baseline exists, record both probabilities. Label the result as a marginal decision estimate.
- Leave the value empty when the evidence cannot support an estimate. A missing estimate is clearer than a guess that enters the ranking.
