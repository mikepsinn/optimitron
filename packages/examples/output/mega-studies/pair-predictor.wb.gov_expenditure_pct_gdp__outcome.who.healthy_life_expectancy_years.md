# Pair Study: Government Expenditure (% GDP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.wb.gov_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years`
- Lag years: 2
- Duration years: 1
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6393
- Included subjects: 147
- Skipped subjects: 0
- Total aligned pairs: 9702
- Evidence grade: A
- Direction: negative
- Derived uncertainty score: 0.0998 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Government Expenditure (% GDP) level for higher Healthy Life Expectancy (HALE): 25.417 % GDP.
- Approximate per-capita PPP equivalent of that best level: 2491.5 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean Healthy Life Expectancy (HALE) appears when Government Expenditure (% GDP) is in [34.249, 39.825) (mean outcome 66.285).
- PPP per-capita equivalent in that best observed bin (p10-p90): [2799.1, 23010.0].
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger evidence for directional signal relative to other predictors in this report.
- Practical direction: decrease Government Expenditure (% GDP) toward the estimated best level, then monitor Healthy Life Expectancy (HALE).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Government Expenditure (% GDP) tends to align with worse Healthy Life Expectancy (HALE).
- The estimate uses 147 subjects and 9702 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [34.249, 39.825) (mean outcome 66.285).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0073); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.1548 |
| Aggregate reverse Pearson | 0.2290 |
| Aggregate directional score (forward - reverse) | -0.0742 |
| Aggregate effect size (% baseline delta) | 1.6825 |
| Aggregate statistical significance | 0.9002 |
| Weighted average PIS | 0.3814 |
| Aggregate value predicting high outcome | 25.4167 |
| Aggregate value predicting low outcome | 28.3958 |
| Aggregate optimal daily value | 25.4167 |
| Observed predictor range | [2.0458, 758.9582] |
| Estimated best level (PPP per-capita equivalent) | 2491.5 international $/person |
| Best observed PPP per-capita range (p10-p90) | [2799.1, 23010.0] |
| Median GDP per-capita PPP (context) | 9802.8 international $ |
| Pairs with PPP conversion | 9702 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 1 | interpolation | 0.6393 | 0.0000 | 147 | 9702 |
| Runner-up | predictor_default | 1 | 3 | interpolation | 0.6320 | 0.0073 | 147 | 9702 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.6308 | 0.0084 | 147 | 9702 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.6303 | 0.0090 | 147 | 9702 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [2.046, 11.475) | 969 | 27 | 8.9446 | 9.6404 | 53.9619 | 53.2916 |
| 2 | [11.475, 15.204) | 972 | 45 | 13.5455 | 13.5515 | 60.3825 | 60.9295 |
| 3 | [15.204, 17.687) | 969 | 52 | 16.3839 | 16.3309 | 60.6126 | 62.0763 |
| 4 | [17.687, 20.286) | 969 | 52 | 18.9363 | 18.8114 | 60.4724 | 62.6150 |
| 5 | [20.286, 23.571) | 972 | 53 | 21.8143 | 21.8768 | 60.5712 | 62.1253 |
| 6 | [23.571, 26.850) | 969 | 54 | 25.2319 | 25.1793 | 62.3085 | 63.3744 |
| 7 | [26.850, 30.254) | 969 | 52 | 28.4044 | 28.3301 | 62.8186 | 64.1583 |
| 8 | [30.254, 34.249) | 972 | 50 | 32.3787 | 32.4242 | 65.1707 | 66.1106 |
| 9 | [34.249, 39.825) | 969 | 46 | 36.9137 | 36.9607 | 66.2849 | 68.0013 |
| 10 | [39.825, 758.96] | 972 | 34 | 62.0329 | 44.2642 | 65.1360 | 68.1365 |

### Distribution Charts

```text
Predictor Distribution (Government Expenditure (% GDP))
[2.046, 65.122) | ############################## 9612
[65.122, 128.20) | # 60
[191.27, 254.35) | # 3
[254.35, 317.43) | # 3
[317.43, 380.50) | # 3
[380.50, 443.58) | # 3
[443.58, 506.65) | # 3
[569.73, 632.81) | # 3
[632.81, 695.88) | # 6
[695.88, 758.96] | # 6
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[36.729, 39.928) | # 71
[39.928, 43.126) | ## 148
[43.126, 46.325) | #### 238
[46.325, 49.524) | ##### 324
[49.524, 52.723) | ######## 505
[52.723, 55.921) | ########## 695
[55.921, 59.120) | ############# 886
[59.120, 62.319) | #################### 1324
[62.319, 65.517) | ############################ 1890
[65.517, 68.716) | ############################## 1995
[68.716, 71.915) | ####################### 1520
[71.915, 75.113] | ## 106
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| MWI | -0.7605 | -1.2451 | -16.590 | 66 |
| SYC | -0.2067 | -1.1478 | -1.202 | 66 |
| TZA | -0.3918 | -0.8596 | -7.977 | 66 |
| VCT | 0.0136 | -0.7997 | 0.138 | 66 |
| PER | -0.1315 | -0.7711 | -0.201 | 66 |
| UZB | -0.0121 | -0.7703 | 6.202 | 66 |
| ARG | 0.3717 | 0.6870 | 1.500 | 66 |
| FSM | 0.2163 | -0.6738 | 1.743 | 66 |
