# Pair Study: R&D Expenditure (% GDP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.wb.rd_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 3
- Duration years: 8
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6680
- Included subjects: 124
- Skipped subjects: 0
- Total aligned pairs: 4156
- Evidence grade: A
- Direction: positive
- Derived uncertainty score: 0.1163 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best R&D Expenditure (% GDP) level for higher After-Tax Median Income (PPP): 0.99755 % GDP.
- Approximate per-capita PPP equivalent of that best level: 125.77 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean After-Tax Median Income (PPP) appears when R&D Expenditure (% GDP) is in [2.216, 4.749] (mean outcome 40116.5).
- PPP per-capita equivalent in that best observed bin (p10-p90): [415.64, 1583.4].
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Moderate evidence; plausible signal but still sensitive to model assumptions.
- Practical direction: increase R&D Expenditure (% GDP) toward the estimated best level, then monitor After-Tax Median Income (PPP).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher R&D Expenditure (% GDP) tends to align with better After-Tax Median Income (PPP).
- The estimate uses 124 subjects and 4156 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [2.216, 4.749] (mean outcome 40116.5).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0028); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.5057 |
| Aggregate reverse Pearson | 0.3970 |
| Aggregate directional score (forward - reverse) | 0.1087 |
| Aggregate effect size (% baseline delta) | 76.5073 |
| Aggregate statistical significance | 0.8837 |
| Weighted average PIS | 0.6981 |
| Aggregate value predicting high outcome | 0.9976 |
| Aggregate value predicting low outcome | 0.8112 |
| Aggregate optimal daily value | 0.9976 |
| Observed predictor range | [0.0126, 6.0192] |
| Estimated best level (PPP per-capita equivalent) | 125.77 international $/person |
| Best observed PPP per-capita range (p10-p90) | [415.64, 1583.4] |
| Median GDP per-capita PPP (context) | 12607.5 international $ |
| Pairs with PPP conversion | 4156 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 8 | interpolation | 0.6680 | 0.0000 | 124 | 4156 |
| Runner-up | predictor_default | 2 | 8 | interpolation | 0.6652 | 0.0028 | 124 | 4156 |
| Runner-up | predictor_default | 1 | 8 | interpolation | 0.6537 | 0.0144 | 124 | 4156 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.6452 | 0.0228 | 124 | 4156 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.01287, 0.10883) | 416 | 19 | 0.0635 | 0.0623 | 14065.9856 | 6050.0000 |
| 2 | [0.10883, 0.19299) | 415 | 33 | 0.1476 | 0.1508 | 14177.2530 | 7120.0000 |
| 3 | [0.19299, 0.31076) | 416 | 35 | 0.2457 | 0.2408 | 14416.7548 | 10065.0000 |
| 4 | [0.31076, 0.47252) | 399 | 33 | 0.3892 | 0.3848 | 12719.6494 | 10870.0000 |
| 5 | [0.47252, 0.62261) | 432 | 39 | 0.5478 | 0.5528 | 17524.6501 | 9888.1547 |
| 6 | [0.62261, 0.77149) | 415 | 42 | 0.6897 | 0.6905 | 13442.0634 | 9780.0000 |
| 7 | [0.77149, 1.070) | 416 | 41 | 0.9082 | 0.8896 | 16570.1688 | 12980.0000 |
| 8 | [1.070, 1.662) | 407 | 35 | 1.3689 | 1.3199 | 30904.6039 | 27930.0000 |
| 9 | [1.662, 2.216) | 422 | 26 | 1.9298 | 1.9033 | 33803.8299 | 29340.0000 |
| 10 | [2.216, 4.749] | 418 | 20 | 2.7243 | 2.5556 | 40116.5076 | 39670.0000 |

### Distribution Charts

```text
Predictor Distribution (R&D Expenditure (% GDP))
[0.01287, 0.40757) | ############################## 1482
[0.40757, 0.80227) | ###################### 1080
[0.80227, 1.197) | ######### 448
[1.197, 1.592) | ##### 237
[1.592, 1.986) | ####### 324
[1.986, 2.381) | ###### 280
[2.381, 2.776) | ### 166
[2.776, 3.170) | # 54
[3.170, 3.565) | # 63
[3.565, 3.960) | # 6
[3.960, 4.355) | # 13
[4.355, 4.749] | # 3
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[440.00, 10870.8) | ############################## 1696
[10870.8, 21301.7) | ################## 993
[21301.7, 31732.5) | ########## 568
[31732.5, 42163.3) | ###### 353
[42163.3, 52594.2) | #### 224
[52594.2, 63025.0) | ## 125
[63025.0, 73455.8) | # 84
[73455.8, 83886.7) | # 44
[83886.7, 94317.5) | # 33
[94317.5, 104748) | # 21
[104748, 115179) | # 10
[115179, 125610] | # 5
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| MNG | 0.4828 | 1.1647 | 67.536 | 34 |
| ARM | 0.6691 | 1.1234 | 188.145 | 34 |
| ZAF | 0.9325 | 1.1202 | 67.537 | 34 |
| RUS | 0.6764 | 1.0495 | 266.510 | 34 |
| MEX | 0.9092 | 1.0415 | 74.236 | 34 |
| SVK | -0.4521 | -1.0065 | -32.176 | 34 |
| SAS | 0.4855 | 0.9835 | 56.608 | 34 |
| TSA | 0.4855 | 0.9835 | 56.608 | 34 |
