# US Drug War Spending vs Overdose Deaths

- Time range: 1999-2023
- Predictor: Federal Drug Control Spending Per Capita (USD/person)
- Outcome: Drug Overdose Deaths (deaths, lower is better)

## Topline

| Metric | Value |
|--------|-------|
| Selected lag | 5 year(s) |
| Effect window | 2 year(s) |
| Aligned observations | 25 |
| Forward correlation (spending -> deaths) | 0.934 |
| Predictive direction score | -0.037 |
| Significance score | 0.870 |
| Suggested spending level | $61.3 /person |
| Minimum effective level | $0 /person |
| First detected change level | $64.8 /person |
| Slowdown knee | $78.6 /person |
| Best observed spending bin | [61.3, 63) (mean deaths 21,731) |
| Sensitivity check (death rate forward correlation) | 0.929 |

## Spending Bins (Observed Data)

| Spending Bin (USD/person) | Observations | Mean Overdose Deaths | Median Overdose Deaths |
|---------------------------|-------------:|---------------------:|-----------------------:|
| [61.3, 63) | 6 | 21,731 | 21,456 |
| [63, 66.8) | 3 | 33,416 | 34,425 |
| [66.8, 71.1) | 3 | 37,261 | 37,004 |
| [71.1, 76.9) | 3 | 42,275 | 41,502 |
| [76.9, 80.1) | 3 | 56,696 | 52,404 |
| [80.1, 80.9) | 3 | 74,266 | 67,367 |
| [80.9, 95.4] | 4 | 99,709 | 108,850 |

## Lag Sensitivity

| Lag | Duration | Score | Pairs | Forward r | Predictive r | Significance |
|----:|---------:|------:|------:|----------:|-------------:|-------------:|
| 5 | 2 | 0.473 | 25 | 0.934 | -0.037 | 0.870 |
| 5 | 1 | 0.472 | 25 | 0.937 | -0.035 | 0.870 |
| 5 | 3 | 0.471 | 25 | 0.932 | -0.034 | 0.870 |
| 4 | 3 | 0.469 | 25 | 0.946 | -0.029 | 0.870 |
| 4 | 2 | 0.467 | 25 | 0.948 | -0.026 | 0.870 |
| 1 | 2 | 0.465 | 25 | 0.972 | -0.021 | 0.870 |
| 3 | 3 | 0.465 | 25 | 0.960 | -0.021 | 0.870 |
| 0 | 3 | 0.463 | 25 | 0.976 | -0.018 | 0.870 |
| 1 | 3 | 0.463 | 25 | 0.975 | -0.018 | 0.870 |
| 4 | 1 | 0.463 | 25 | 0.953 | -0.018 | 0.870 |
| 2 | 3 | 0.463 | 25 | 0.970 | -0.017 | 0.870 |
| 2 | 1 | 0.462 | 25 | 0.971 | -0.015 | 0.870 |
| 3 | 2 | 0.462 | 25 | 0.964 | -0.015 | 0.870 |
| 1 | 1 | 0.461 | 25 | 0.977 | -0.014 | 0.870 |
| 2 | 2 | 0.461 | 25 | 0.973 | -0.013 | 0.870 |
| 0 | 2 | 0.459 | 25 | 0.981 | -0.009 | 0.870 |
| 3 | 1 | 0.458 | 25 | 0.969 | -0.008 | 0.870 |
| 0 | 1 | 0.455 | 25 | 0.983 | -0.001 | 0.870 |

## Notes

- No beneficial spending threshold was detected above the lowest observed spending bin; MED is set to $0.
- Predictive direction is weak, suggesting reverse-causation/trend effects may dominate.
- This is single-jurisdiction time-series evidence (US only), so confounding risk remains.
- Suggested level is support-constrained to observed data, not unconstrained extrapolation.
- Positive forward correlation means higher spending precedes higher overdose deaths (worse).

