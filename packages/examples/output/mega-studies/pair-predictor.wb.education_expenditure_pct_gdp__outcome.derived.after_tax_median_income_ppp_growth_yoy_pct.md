# Pair Study: Education Expenditure (% GDP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.wb.education_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 2
- Duration years: 3
- Temporal profile source: pair_override
- Filling strategy: interpolation
- Temporal candidates evaluated: 1
- Temporal candidates with valid results: 1
- Temporal profile score: 0.4973
- Included subjects: 218
- Skipped subjects: 0
- Total aligned pairs: 6955
- Evidence grade: C
- Direction: neutral
- Derived uncertainty score: 0.3291 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Education Expenditure (% GDP) level for higher After-Tax Median Income Growth (YoY %): 4.185 % GDP.
- Approximate per-capita PPP equivalent of that best level: 328.70 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Education Expenditure (% GDP) is in [3.276, 3.629) (mean outcome 5.462).
- PPP per-capita equivalent in that best observed bin (p10-p90): [64.237, 1220.6].
- Directional signal is neutral; use caution when treating the estimated optimal value as prescriptive.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Practical direction: no strong directional guidance; prioritize additional data and robustness checks.
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- No strong directional pattern is detected between Education Expenditure (% GDP) and After-Tax Median Income Growth (YoY %).
- The estimate uses 218 subjects and 6955 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [3.276, 3.629) (mean outcome 5.462).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.0048 |
| Aggregate reverse Pearson | 0.0172 |
| Aggregate directional score (forward - reverse) | -0.0124 |
| Aggregate effect size (% baseline delta) | 61.3951 |
| Aggregate statistical significance | 0.6709 |
| Weighted average PIS | 0.1815 |
| Aggregate value predicting high outcome | 4.1852 |
| Aggregate value predicting low outcome | 4.3181 |
| Aggregate optimal daily value | 4.1852 |
| Observed predictor range | [0.0000, 44.3340] |
| Estimated best level (PPP per-capita equivalent) | 328.70 international $/person |
| Best observed PPP per-capita range (p10-p90) | [64.237, 1220.6] |
| Median GDP per-capita PPP (context) | 7853.9 international $ |
| Pairs with PPP conversion | 6955 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | pair_override | 2 | 3 | interpolation | 0.4973 | 0.0000 | 218 | 6955 |
| Runner-up | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 2.252) | 696 | 55 | 1.7266 | 1.7541 | 4.2273 | 4.4599 |
| 2 | [2.252, 2.761) | 695 | 85 | 2.5157 | 2.5255 | 4.6659 | 4.6512 |
| 3 | [2.761, 3.276) | 696 | 103 | 3.0199 | 3.0043 | 4.8761 | 4.7059 |
| 4 | [3.276, 3.629) | 695 | 114 | 3.4474 | 3.4470 | 5.4618 | 5.1546 |
| 5 | [3.629, 3.987) | 695 | 114 | 3.8059 | 3.8118 | 4.4350 | 4.6957 |
| 6 | [3.987, 4.392) | 695 | 117 | 4.1619 | 4.1388 | 4.7791 | 4.7575 |
| 7 | [4.392, 4.874) | 692 | 104 | 4.6379 | 4.6379 | 4.6942 | 4.4664 |
| 8 | [4.874, 5.423) | 700 | 101 | 5.1194 | 5.1105 | 4.6148 | 4.5284 |
| 9 | [5.423, 6.301) | 695 | 81 | 5.7824 | 5.7419 | 3.9740 | 3.9702 |
| 10 | [6.301, 44.334] | 696 | 58 | 8.4459 | 7.2085 | 3.7570 | 4.0375 |

### Distribution Charts

```text
Predictor Distribution (Education Expenditure (% GDP))
[0.00000, 3.694) | ####################### 2904
[3.694, 7.389) | ############################## 3731
[7.389, 11.083) | ## 238
[11.083, 14.778) | # 50
[14.778, 18.472) | # 19
[18.472, 22.167) | # 2
[22.167, 25.861) | # 2
[25.861, 29.556) | # 1
[29.556, 33.250) | # 2
[33.250, 36.945) | # 2
[36.945, 40.639) | # 2
[40.639, 44.334] | # 2
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-62.405, -43.867) | # 4
[-43.867, -25.329) | # 26
[-25.329, -6.791) | # 227
[-6.791, 11.747) | ############################## 6156
[11.747, 30.285) | ### 516
[30.285, 48.823) | # 15
[48.823, 67.360) | # 6
[67.360, 85.898) | # 4
[141.51, 160.05] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| TJK | -0.6963 | -0.8862 | -128.380 | 33 |
| FIN | 0.4714 | 0.8627 | 85.616 | 33 |
| COD | 0.2617 | 0.8619 | 311.634 | 33 |
| KWT | 0.3192 | 0.8565 | 2115.539 | 33 |
| MIC | -0.5162 | -0.8488 | -32.088 | 33 |
| EAR | -0.5670 | -0.8084 | -38.358 | 33 |
| ECS | -0.3261 | -0.8073 | -40.208 | 33 |
| NGA | -0.0345 | -0.7506 | 11.964 | 15 |
