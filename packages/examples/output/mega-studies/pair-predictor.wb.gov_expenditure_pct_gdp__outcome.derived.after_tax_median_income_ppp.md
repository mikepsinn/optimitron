# Pair Study: Government Expenditure (% GDP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.wb.gov_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6017
- Included subjects: 175
- Skipped subjects: 0
- Total aligned pairs: 5915
- Evidence grade: A
- Direction: negative
- Derived uncertainty score: 0.1378 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Government Expenditure (% GDP) level for higher After-Tax Median Income (PPP): 26.782 % GDP.
- Approximate per-capita PPP equivalent of that best level: 2176.7 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean After-Tax Median Income (PPP) appears when Government Expenditure (% GDP) is in [34.154, 39.858) (mean outcome 28954.9).
- PPP per-capita equivalent in that best observed bin (p10-p90): [2450.5, 17750.2].
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Moderate evidence; plausible signal but still sensitive to model assumptions.
- Practical direction: decrease Government Expenditure (% GDP) toward the estimated best level, then monitor After-Tax Median Income (PPP).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Government Expenditure (% GDP) tends to align with worse After-Tax Median Income (PPP).
- The estimate uses 175 subjects and 5915 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [34.154, 39.858) (mean outcome 28954.9).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0007); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.2919 |
| Aggregate reverse Pearson | 0.3419 |
| Aggregate directional score (forward - reverse) | -0.0500 |
| Aggregate effect size (% baseline delta) | 47.5095 |
| Aggregate statistical significance | 0.8622 |
| Weighted average PIS | 0.5357 |
| Aggregate value predicting high outcome | 26.7821 |
| Aggregate value predicting low outcome | 28.4090 |
| Aggregate optimal daily value | 26.7821 |
| Observed predictor range | [2.0458, 758.9582] |
| Estimated best level (PPP per-capita equivalent) | 2176.7 international $/person |
| Best observed PPP per-capita range (p10-p90) | [2450.5, 17750.2] |
| Median GDP per-capita PPP (context) | 8127.4 international $ |
| Pairs with PPP conversion | 5915 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.6017 | 0.0000 | 175 | 5915 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.6011 | 0.0007 | 175 | 5915 |
| Runner-up | predictor_default | 0 | 2 | interpolation | 0.5833 | 0.0184 | 175 | 5915 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.5820 | 0.0198 | 175 | 5915 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [2.806, 11.794) | 592 | 31 | 9.0215 | 9.6404 | 9089.3750 | 2065.0000 |
| 2 | [11.794, 15.024) | 590 | 54 | 13.7680 | 13.9899 | 10537.1273 | 4555.0000 |
| 3 | [15.024, 17.621) | 593 | 64 | 16.1680 | 16.1360 | 12072.4975 | 5760.0000 |
| 4 | [17.621, 20.439) | 591 | 64 | 18.9931 | 18.8780 | 11327.6645 | 6459.0157 |
| 5 | [20.439, 23.991) | 591 | 62 | 22.0254 | 21.9081 | 12652.9639 | 6940.0000 |
| 6 | [23.991, 26.450) | 592 | 68 | 25.1489 | 24.9990 | 15544.5613 | 9750.0000 |
| 7 | [26.450, 29.490) | 591 | 67 | 27.9438 | 27.8750 | 15108.2652 | 10960.0000 |
| 8 | [29.490, 34.154) | 592 | 62 | 31.9176 | 32.0564 | 20254.0384 | 15432.3177 |
| 9 | [34.154, 39.858) | 591 | 48 | 36.8783 | 36.8164 | 28954.9259 | 24480.0000 |
| 10 | [39.858, 758.96] | 592 | 41 | 70.7944 | 45.5730 | 22484.5937 | 19840.0000 |

### Distribution Charts

```text
Predictor Distribution (Government Expenditure (% GDP))
[2.806, 65.819) | ############################## 5843
[65.819, 128.83) | # 49
[128.83, 191.84) | # 1
[191.84, 254.86) | # 1
[254.86, 317.87) | # 1
[317.87, 380.88) | # 1
[380.88, 443.89) | # 1
[443.89, 506.91) | # 1
[569.92, 632.93) | # 1
[632.93, 695.95) | # 13
[695.95, 758.96] | # 3
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[280.00, 10724.2) | ############################## 3264
[10724.2, 21168.3) | ########### 1158
[21168.3, 31612.5) | ###### 616
[31612.5, 42056.7) | ### 347
[42056.7, 52500.8) | ## 231
[52500.8, 62945.0) | # 121
[62945.0, 73389.2) | # 78
[73389.2, 83833.3) | # 38
[83833.3, 94277.5) | # 28
[94277.5, 104722) | # 21
[104722, 115166) | # 9
[115166, 125610] | # 4
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| TZA | -0.5522 | -1.1771 | -45.358 | 34 |
| LAO | 0.7598 | 0.9299 | 195.071 | 34 |
| MHL | -0.4775 | -0.9293 | -34.997 | 34 |
| KAZ | -0.3861 | -0.8933 | -31.316 | 31 |
| BIH | 0.6096 | 0.8720 | 167.858 | 34 |
| ZMB | -0.1086 | -0.8653 | -21.008 | 34 |
| AZE | -0.3388 | -0.8219 | -13.125 | 34 |
| ZWE | 0.5882 | 0.7889 | 68.858 | 34 |
