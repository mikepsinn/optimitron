# Mission Value and Task Expected Value

The canonical public explanation lives in
`packages/data/src/parameters/expected-value-methodology.ts`.
Optimitron renders it at `/methodology`.

Worked values come from the current parameter catalog.

## Contract

Mission outcomes and task scenarios use different quantities.

- A mission shows `Value if achieved`.
- A mission value does not claim a success probability.
- A mission value does not create task priority.
- A task stores a probability-weighted scenario expected value.
- Current task-tree estimates use P(success | task funded or done).
- Current task-tree estimates do not subtract a without-task probability.
- Alternative-mechanism estimates can overlap and must not be added.
- Each task keeps the effect duration supported by its evidence.
- A frame label must not change without a recalculation.
- A mission value must not equal the sum of child task values.

## Mission comparison scenario

Most mission scenarios multiply the current annual outcome value by
`MISSION_VALUE_HORIZON_YEARS`. The extinction scenario values the current
population once.

That period uses the current global life expectancy at birth. It is a chosen
comparison period, not a universal task duration.

The scenario assumes:

- The full effect starts immediately.
- The annual value stays flat.
- Growth is zero.
- The discount rate is zero.
- The mission probability is not estimated.

These assumptions keep the annual mission examples comparable. They do not make
the resulting values forecasts.

## Task scenario formula

Current task-tree estimates use:

```text
task scenario expected value
= stated outcome value if the task succeeds
  x P(success | task funded or done)
```

The `expectedEconomicValueUsd*` fields hold this probability-weighted task
value. Ranking can then apply effort, cost, and blockers.

These estimates do not measure the value caused by the task alone. If sources
provide both task and without-task probabilities, a marginal estimate can use:

```text
stated outcome value
x (P(success | task funded or done) - P(success | no task funding or work))
```

Label that result as marginal. Do not imply that current managed estimates use
the probability difference.

Mission scenarios use the metric key `value_if_achieved_usd`. Readers must not
interpret that metric as task expected value.

## Sources and assumptions

Store the formula, scenario, assumptions, and sources with each task estimate.
Store the without-task baseline when you calculate a marginal estimate. Leave
an unsupported value empty.

When an input is wrong, update it and recalculate each affected managed
estimate.
