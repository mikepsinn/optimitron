# Pair Study: Government Health Expenditure (% GDP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.wb.gov_health_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 0
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6117
- Included subjects: 229
- Skipped subjects: 0
- Total aligned pairs: 7585
- Evidence grade: A
- Direction: positive
- Derived uncertainty score: 0.1260 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Government Health Expenditure (% GDP) level for higher After-Tax Median Income (PPP): 3.352 % GDP.
- Approximate per-capita PPP equivalent of that best level: 263.24 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean After-Tax Median Income (PPP) appears when Government Health Expenditure (% GDP) is in [6.266, 22.254] (mean outcome 35040.1).
- PPP per-capita equivalent in that best observed bin (p10-p90): [501.09, 4801.4].
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Moderate evidence; plausible signal but still sensitive to model assumptions.
- Practical direction: increase Government Health Expenditure (% GDP) toward the estimated best level, then monitor After-Tax Median Income (PPP).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Government Health Expenditure (% GDP) tends to align with better After-Tax Median Income (PPP).
- The estimate uses 229 subjects and 7585 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [6.266, 22.254] (mean outcome 35040.1).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Top temporal profiles are close (score delta 0.0001); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.5093 |
| Aggregate reverse Pearson | 0.4535 |
| Aggregate directional score (forward - reverse) | 0.0558 |
| Aggregate effect size (% baseline delta) | 70.1676 |
| Aggregate statistical significance | 0.8740 |
| Weighted average PIS | 0.6487 |
| Aggregate value predicting high outcome | 3.3517 |
| Aggregate value predicting low outcome | 2.8360 |
| Aggregate optimal daily value | 3.3517 |
| Observed predictor range | [0.0622, 22.2543] |
| Estimated best level (PPP per-capita equivalent) | 263.24 international $/person |
| Best observed PPP per-capita range (p10-p90) | [501.09, 4801.4] |
| Median GDP per-capita PPP (context) | 7853.9 international $ |
| Pairs with PPP conversion | 7585 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 0 | 3 | interpolation | 0.6117 | 0.0000 | 229 | 7585 |
| Runner-up | predictor_default | 0 | 2 | interpolation | 0.6116 | 0.0001 | 229 | 7585 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.6052 | 0.0065 | 229 | 7585 |
| Runner-up | predictor_default | 3 | 3 | interpolation | 0.5955 | 0.0162 | 229 | 7585 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.06221, 0.84870) | 759 | 44 | 0.5641 | 0.5869 | 2748.4548 | 2140.0000 |
| 2 | [0.84870, 1.212) | 758 | 65 | 1.0181 | 1.0183 | 5453.8744 | 2661.1329 |
| 3 | [1.212, 1.695) | 759 | 79 | 1.4550 | 1.4667 | 10398.5622 | 3480.0000 |
| 4 | [1.695, 2.084) | 758 | 86 | 1.8800 | 1.8802 | 10766.7977 | 5255.0000 |
| 5 | [2.084, 2.535) | 758 | 90 | 2.3034 | 2.3032 | 14574.9054 | 8071.2887 |
| 6 | [2.535, 3.038) | 759 | 91 | 2.7835 | 2.7754 | 12622.0393 | 8334.7768 |
| 7 | [3.038, 3.823) | 758 | 86 | 3.4014 | 3.3762 | 13984.6437 | 11130.0000 |
| 8 | [3.823, 4.823) | 759 | 75 | 4.3137 | 4.2800 | 15486.2970 | 12060.0000 |
| 9 | [4.823, 6.266) | 752 | 66 | 5.4924 | 5.5106 | 22502.4100 | 20645.0000 |
| 10 | [6.266, 22.254] | 765 | 44 | 7.9617 | 7.3242 | 35040.1418 | 36220.0000 |

### Distribution Charts

```text
Predictor Distribution (Government Health Expenditure (% GDP))
[0.06221, 1.912) | ############################## 2701
[1.912, 3.761) | ############################ 2553
[3.761, 5.610) | ############## 1282
[5.610, 7.460) | ######## 711
[7.460, 9.309) | ### 256
[9.309, 11.158) | # 37
[11.158, 13.008) | # 10
[13.008, 14.857) | # 6
[14.857, 16.706) | # 14
[16.706, 18.556) | # 3
[18.556, 20.405) | # 1
[20.405, 22.254] | # 11
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[280.00, 14356.7) | ############################## 5180
[14356.7, 28433.3) | ####### 1273
[28433.3, 42510.0) | ### 552
[42510.0, 56586.7) | ## 285
[56586.7, 70663.3) | # 142
[70663.3, 84740.0) | # 79
[84740.0, 98816.7) | # 43
[98816.7, 112893) | # 16
[112893, 126970) | # 10
[126970, 141047) | # 1
[141047, 155123) | # 1
[155123, 169200] | # 3
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| IRQ | 0.6022 | 0.8151 | 54.116 | 33 |
| BRB | 0.7263 | 0.8088 | 32.995 | 34 |
| TUV | -0.3677 | -0.7609 | -14.070 | 34 |
| TZA | 0.3306 | 0.7258 | 28.575 | 34 |
| MHL | -0.6213 | -0.6963 | -33.086 | 34 |
| AGO | 0.5214 | 0.6920 | 51.061 | 34 |
| ECA | 0.4351 | 0.6877 | 57.800 | 34 |
| GRD | 0.3231 | 0.6877 | 36.421 | 34 |
