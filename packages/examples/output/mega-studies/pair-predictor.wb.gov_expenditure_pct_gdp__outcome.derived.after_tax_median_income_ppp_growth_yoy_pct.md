# Pair Study: Government Expenditure (% GDP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.wb.gov_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 1
- Duration years: 1
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.7197
- Included subjects: 175
- Skipped subjects: 0
- Total aligned pairs: 5740
- Evidence grade: B
- Direction: positive
- Derived uncertainty score: 0.2662 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Government Expenditure (% GDP) level for higher After-Tax Median Income Growth (YoY %): 28.903 % GDP.
- Approximate per-capita PPP equivalent of that best level: 2597.5 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Government Expenditure (% GDP) is in [34.597, 40.103) (mean outcome 5.127).
- PPP per-capita equivalent in that best observed bin (p10-p90): [2519.0, 18951.7].
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Practical direction: increase Government Expenditure (% GDP) toward the estimated best level, then monitor After-Tax Median Income Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Expenditure (% GDP) tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 175 subjects and 5740 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [34.597, 40.103) (mean outcome 5.127).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Top temporal profiles are close (score delta 0.0229); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.1075 |
| Aggregate reverse Pearson | -0.1054 |
| Aggregate directional score (forward - reverse) | 0.2129 |
| Aggregate effect size (% baseline delta) | -568.2242 |
| Aggregate statistical significance | 0.7338 |
| Weighted average PIS | 0.2287 |
| Aggregate value predicting high outcome | 28.9033 |
| Aggregate value predicting low outcome | 25.8591 |
| Aggregate optimal daily value | 28.9033 |
| Observed predictor range | [2.0458, 758.9582] |
| Estimated best level (PPP per-capita equivalent) | 2597.5 international $/person |
| Best observed PPP per-capita range (p10-p90) | [2519.0, 18951.7] |
| Median GDP per-capita PPP (context) | 8986.9 international $ |
| Pairs with PPP conversion | 5740 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 1 | 1 | interpolation | 0.7197 | 0.0000 | 175 | 5740 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.6968 | 0.0229 | 175 | 5740 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.6739 | 0.0458 | 175 | 5740 |
| Runner-up | predictor_default | 0 | 2 | interpolation | 0.6637 | 0.0559 | 175 | 5740 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [2.046, 12.065) | 574 | 34 | 9.1446 | 9.6616 | 4.4145 | 4.8091 |
| 2 | [12.065, 15.194) | 574 | 59 | 13.9131 | 14.2011 | 4.6921 | 4.8462 |
| 3 | [15.194, 17.919) | 574 | 71 | 16.4176 | 16.3569 | 4.6273 | 4.5769 |
| 4 | [17.919, 20.827) | 572 | 70 | 19.3489 | 19.4561 | 4.4639 | 4.5845 |
| 5 | [20.827, 24.379) | 576 | 75 | 22.5878 | 22.5413 | 4.4566 | 4.3332 |
| 6 | [24.379, 26.977) | 574 | 81 | 25.5789 | 25.5928 | 4.3476 | 4.2284 |
| 7 | [26.977, 30.287) | 574 | 75 | 28.4752 | 28.4243 | 4.6165 | 4.2868 |
| 8 | [30.287, 34.597) | 574 | 81 | 32.5242 | 32.5687 | 4.9328 | 5.0249 |
| 9 | [34.597, 40.103) | 574 | 66 | 37.3180 | 37.3648 | 5.1269 | 4.9263 |
| 10 | [40.103, 721.62] | 574 | 47 | 66.6081 | 45.5728 | 4.5644 | 4.4926 |

### Distribution Charts

```text
Predictor Distribution (Government Expenditure (% GDP))
[2.046, 62.010) | ############################## 5672
[62.010, 121.97) | # 48
[121.97, 181.94) | # 2
[181.94, 241.90) | # 1
[241.90, 301.87) | # 1
[301.87, 361.83) | # 1
[421.80, 481.76) | # 1
[481.76, 541.73) | # 1
[541.73, 601.69) | # 1
[601.69, 661.66) | # 1
[661.66, 721.62] | # 11
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-62.405, -43.867) | # 4
[-43.867, -25.329) | # 22
[-25.329, -6.791) | # 204
[-6.791, 11.747) | ############################## 5039
[11.747, 30.285) | ### 445
[30.285, 48.823) | # 14
[48.823, 67.360) | # 8
[67.360, 85.898) | # 2
[141.51, 160.05] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| KWT | 0.4938 | 0.9950 | 771.360 | 33 |
| WSM | 0.2849 | 0.9547 | 216.670 | 33 |
| PAN | 0.1522 | 0.9136 | -33.675 | 33 |
| ALB | 0.3471 | 0.7869 | 109.413 | 33 |
| PSS | 0.2244 | 0.7739 | 35.496 | 33 |
| NOR | 0.4033 | 0.7661 | 158.364 | 33 |
| ZWE | 0.5154 | 0.7388 | -74473.010 | 33 |
| MAC | 0.3942 | 0.7346 | 670.784 | 33 |
