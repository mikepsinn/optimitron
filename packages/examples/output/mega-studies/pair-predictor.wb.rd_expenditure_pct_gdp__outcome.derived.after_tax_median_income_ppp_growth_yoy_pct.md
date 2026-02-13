# Pair Study: R&D Expenditure (% GDP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.wb.rd_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 1
- Duration years: 8
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6786
- Included subjects: 124
- Skipped subjects: 0
- Total aligned pairs: 4032
- Evidence grade: C
- Direction: positive
- Derived uncertainty score: 0.3060 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best R&D Expenditure (% GDP) level for higher After-Tax Median Income Growth (YoY %): 0.96252 % GDP.
- Approximate per-capita PPP equivalent of that best level: 136.04 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when R&D Expenditure (% GDP) is in [0.19763, 0.31143) (mean outcome 5.705).
- PPP per-capita equivalent in that best observed bin (p10-p90): [8.082, 50.121].
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Practical direction: increase R&D Expenditure (% GDP) toward the estimated best level, then monitor After-Tax Median Income Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher R&D Expenditure (% GDP) tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 124 subjects and 4032 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.19763, 0.31143) (mean outcome 5.705).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0057); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.0970 |
| Aggregate reverse Pearson | -0.0887 |
| Aggregate directional score (forward - reverse) | 0.1857 |
| Aggregate effect size (% baseline delta) | 62.6021 |
| Aggregate statistical significance | 0.6940 |
| Weighted average PIS | 0.1857 |
| Aggregate value predicting high outcome | 0.9625 |
| Aggregate value predicting low outcome | 0.9637 |
| Aggregate optimal daily value | 0.9625 |
| Observed predictor range | [0.0126, 6.0192] |
| Estimated best level (PPP per-capita equivalent) | 136.04 international $/person |
| Best observed PPP per-capita range (p10-p90) | [8.082, 50.121] |
| Median GDP per-capita PPP (context) | 14133.7 international $ |
| Pairs with PPP conversion | 4032 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 1 | 8 | interpolation | 0.6786 | 0.0000 | 124 | 4032 |
| Runner-up | predictor_default | 2 | 8 | interpolation | 0.6729 | 0.0057 | 124 | 4032 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.6723 | 0.0063 | 124 | 4032 |
| Runner-up | predictor_default | 3 | 8 | interpolation | 0.6719 | 0.0067 | 124 | 4032 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.01269, 0.11000) | 396 | 20 | 0.0640 | 0.0628 | 5.3506 | 4.9666 |
| 2 | [0.11000, 0.19763) | 411 | 33 | 0.1490 | 0.1514 | 4.0821 | 4.8969 |
| 3 | [0.19763, 0.31143) | 387 | 35 | 0.2476 | 0.2425 | 5.7047 | 5.5556 |
| 4 | [0.31143, 0.47981) | 419 | 37 | 0.3976 | 0.3969 | 4.6129 | 5.2448 |
| 5 | [0.47981, 0.63628) | 396 | 43 | 0.5646 | 0.5611 | 5.0696 | 5.2529 |
| 6 | [0.63628, 0.79333) | 410 | 46 | 0.7081 | 0.7073 | 5.6724 | 5.8026 |
| 7 | [0.79333, 1.136) | 403 | 41 | 0.9471 | 0.9459 | 5.0907 | 5.3869 |
| 8 | [1.136, 1.708) | 403 | 36 | 1.4183 | 1.4012 | 4.9582 | 5.1465 |
| 9 | [1.708, 2.228) | 403 | 26 | 1.9791 | 1.9839 | 4.7680 | 4.4070 |
| 10 | [2.228, 5.184] | 404 | 23 | 2.7991 | 2.6430 | 4.2975 | 4.0157 |

### Distribution Charts

```text
Predictor Distribution (R&D Expenditure (% GDP))
[0.01269, 0.44366) | ############################## 1505
[0.44366, 0.87462) | ##################### 1041
[0.87462, 1.306) | ######## 426
[1.306, 1.737) | ##### 270
[1.737, 2.168) | ###### 315
[2.168, 2.598) | ##### 258
[2.598, 3.029) | ## 107
[3.029, 3.460) | # 70
[3.460, 3.891) | # 19
[3.891, 4.322) | # 14
[4.322, 4.753) | # 5
[4.753, 5.184] | # 2
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-49.393, -40.524) | # 2
[-40.524, -31.654) | # 4
[-31.654, -22.785) | # 7
[-22.785, -13.916) | # 29
[-13.916, -5.047) | ## 140
[-5.047, 3.822) | ################## 1349
[3.822, 12.691) | ############################## 2255
[12.691, 21.560) | ### 209
[21.560, 30.430) | # 25
[30.430, 39.299) | # 7
[39.299, 48.168) | # 2
[48.168, 57.037] | # 3
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| NLD | 0.3946 | 1.1384 | 53.945 | 33 |
| IRL | 0.3059 | 1.1101 | 14.679 | 33 |
| NOR | 0.2539 | 1.0852 | 54.445 | 33 |
| PER | 0.2895 | 1.0462 | 55.157 | 33 |
| AZE | 0.4083 | 0.9762 | 3998.957 | 33 |
| IRN | 0.4662 | 0.9597 | -236.309 | 33 |
| MAC | 0.2450 | 0.9251 | -3.397 | 33 |
| PAK | -0.1986 | -0.9061 | -33.947 | 33 |
