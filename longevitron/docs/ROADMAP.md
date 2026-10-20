# Longevitron Roadmap

The goal, the limits, and the model are in [SPEC.md](SPEC.md). Similar existing work is in [PRIOR_ART.md](PRIOR_ART.md). This file gives the order of work.

## Principle

Agents do not write budgets, trial lists, or bills. Code computes them from evidence records. Agents add one evidence record set or one code change per pull request, and the evals decide what merges.

```
sources → records (quote-checked)
   → options: delivery, trials, rules (each with cited costs, effects, priors, capacities)
      → value-of-information optimizer (must pass backtest, known answers, prior calibration)
         → ranked trials + budget + bill sections (computed, not written)
            → organizations endorse

Agent loop: pick the largest evidence gap → one pull request → evals → auto-merge or owner review
```

## Method (owner-approved)

The model is a value-of-information model. See SPEC.md, section Model.

1. One unit for every option: expected discounted healthy life-years per dollar.
2. Three option types: delivery of proven interventions, trials of untested candidates, and rules (taxes, labels, product standards).
3. A trial has value because its result changes later funding decisions. The model calculates this value (EVSI) for each trial.
4. Integer selection with capacity limits picks the combination of options. Total trial capacity grows at a capped rate each year.
5. The category-level spending model is a check and a backtest. It does not select options.

Why: a league table of proven interventions alone gives zero value to learning. It underfunds trials whenever untested candidates are good. Similar projects (HIPtool, DCP, ACE-Prevention) share this gap.

## Steps

| # | Step | Output | Status |
|---|---|---|---|
| 1 | First slice | WHO HALE records, record check, source check, static site | Done in PR #412 |
| 2 | Evidence from studies | Saved papers and web pages as sources. Quote check for text sources. Owner-approved list of about 20 known effects. Base rates for priors, for example the share of trials of each kind that succeed. | Next |
| 3 | Spending data and backtest | US outlays by budget function (OMB historical tables). Spending by function (COFOG) for OECD countries. Backtest eval. | Planned |
| 4 | Delivery and rule options v0 | 20–30 US-relevant options with quote-checked cost, effect, capacity, and reach | Planned |
| 5 | Trial options v0 | 20–30 untested candidates with a cited prior, an effect distribution, reach, adoption, and trial cost | Planned |
| 6 | Optimizer v0 | Integer selection with capacities and the trial-capacity ramp. Outputs a ranked US trial list and US budget v0. The site labels both "draft" until all evals pass. | Planned |
| 7 | Bills v0 | Bill sections for the top 5 rule options, adapted from enacted laws | Planned |
| 8 | Agent loop | Scheduled agent runs. Starts only after steps 2 and 3, because before then no eval stops slop. | Planned |
| 9 | Organizations | Endorsement records and outreach, after the first verified result | Planned |

## Open owner decisions

1. **Horizon.** Recommended: total healthy life-years over 30 years, discounted 3% per year.
2. **Trial-capacity growth rate.** The maximum yearly growth of total trial capacity.
3. **NIH allocation.** Whether to add a step that allocates NIH money across research areas, after step 6.
