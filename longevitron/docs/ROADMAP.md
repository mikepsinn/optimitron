# Longevitron Roadmap

The goal and the limits are in [SPEC.md](SPEC.md). This file gives the order of work.

## Principle

Agents do not write budgets or bills. Code computes them from evidence records. Agents add one evidence record set or one code change per pull request, and the evals decide what merges.

```
sources → records (quote-checked)
   → model (code; must pass backtest and known answers)
      → budget and ranked policies (computed, not written)
         → bill sections (adapted from enacted laws)
            → organizations endorse

Agent loop: pick the largest evidence gap → one pull request → evals → auto-merge or owner review
```

## Proposed method change — owner approval needed

Category-level data alone cannot give a credible budget, for two reasons:

1. A category such as "Health" or "Defence" is too broad to act on.
2. Across countries, wealth raises both spending and HALE. The data cannot separate the two well.

Proposal: add a **league table**. It is a list of specific programs and policies. Each entry has a cost per healthy year gained (DALY averted), taken from published studies. The budget pays for the cheapest healthy years first, until the money runs out. This is the same equal-marginal-value rule as in SPEC.md, applied to individual programs. The same table selects the bill sections.

The category-level model stays. It tests large moves, such as defence cuts, against country data, and it supplies the backtest.

## Steps

| # | Step | Output | Status |
|---|---|---|---|
| 1 | First slice | WHO HALE records, record check, source check, static site | Done in PR #412 |
| 2 | Evidence from studies | Saved papers and web pages as sources. Quote check for text sources. Owner-approved list of about 20 known effects. | Next |
| 3 | Spending data and backtest | US outlays by budget function (OMB historical tables). OECD spending by function (COFOG). Backtest eval. | Planned |
| 4 | League table v0 | 20–30 US-relevant programs and policies, each with a quote-checked cost per healthy year | Planned |
| 5 | US budget v0 | Budget computed from steps 3 and 4. The site labels it "draft" until all evals pass. | Planned |
| 6 | Bills v0 | Top 5 policies as bill sections adapted from enacted laws | Planned |
| 7 | Agent loop | Scheduled agent runs. Starts only after steps 2 and 3, because before then no eval stops slop. | Planned |
| 8 | Organizations | Endorsement records and outreach, after the first verified result | Planned |
