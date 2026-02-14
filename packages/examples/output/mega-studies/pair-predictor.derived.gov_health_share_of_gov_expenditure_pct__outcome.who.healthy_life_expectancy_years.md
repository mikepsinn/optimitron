# Pair Study: Government Health Share of Government Spending -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.who.healthy_life_expectancy_years`
- Lag years: 2
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.6832
- Included subjects: 141
- Skipped subjects: 0
- Total aligned pairs: 9306
- Evidence grade: A
- Data sufficiency: sufficient
- Reliability score: 0.736 (moderate)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.0830 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target Government Health Share of Government Spending level for higher Healthy Life Expectancy (HALE): 27.789 % of government expenditure (support constrained).
- Observed-support target from binned response curve: 27.789 % of government expenditure.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 25.736 % of government expenditure; model-optimal minus observed-anchor difference is -12.122 (-47.1%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 19.044 % of government expenditure.
- Raw vs robust optimal differs by 39.9%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 6.559 % of government expenditure.
- Diminishing returns likely begin near 10.748 % of government expenditure.
- Saturation/plateau zone starts around 11.833 % of government expenditure and extends through 13.752 % of government expenditure.
- Highest observed mean Healthy Life Expectancy (HALE) appears when Government Health Share of Government Spending is in [20.671, 66.811] (mean outcome 67.739).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger evidence for directional signal relative to other predictors in this report.
- Directional hint: higher Government Health Share of Government Spending is associated with better Healthy Life Expectancy (HALE).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Government Health Share of Government Spending tends to align with better Healthy Life Expectancy (HALE).
- The estimate uses 141 subjects and 9306 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [20.671, 66.811] (mean outcome 67.739).
- A minimum effective predictor level appears near 6.559 % of government expenditure in the binned response curve.
- Reliability score is 0.736 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Forward association sign conflicts with directional score sign; reverse-direction signal may dominate.
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0029); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 39.9% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.1233 |
| Aggregate reverse Pearson | 0.2356 |
| Aggregate directional score (forward - reverse) | -0.1123 |
| Aggregate effect size (% baseline delta) | 0.5927 |
| Aggregate statistical significance | 0.9170 |
| Weighted average PIS | 0.4433 |
| Aggregate value predicting high outcome | 13.6139 |
| Aggregate value predicting low outcome | 13.2356 |
| Aggregate optimal daily value | 13.6139 |
| Decision target value (reader-facing) | 27.789 % of government expenditure (support constrained) |
| Model-derived optimum (diagnostics) | 13.614 % of government expenditure |
| Support-constrained optimal value | 27.789 % of government expenditure |
| Support-constrained optimal range | [21.427, 66.811] |
| Response-curve robust optimal value | 19.278 % of government expenditure |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.8069, 88.0822] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [20.671, 66.811] |
| Robust best observed range (trimmed) | [17.457, 20.671] |
| Raw best observed outcome mean | 67.739 |
| Robust best observed outcome mean | 66.565 |
| Robust optimal value (bin median) | 19.044 % of government expenditure |
| Raw vs robust optimal delta | 5.430 (+39.9%) |
| Robustness retained fraction | 80.0% (7446/9306) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.7361 (moderate) |
| Reliability support component | 0.9700 |
| Reliability significance component | 0.9170 |
| Reliability directional component | 0.7484 |
| Reliability temporal-stability component | 0.0966 |
| Reliability robustness component | 0.6679 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 6.559 % of government expenditure (z=5.29) |
| Diminishing-returns knee | 10.748 % of government expenditure (ratio=0.282) |
| Saturation / plateau range | [11.339, 14.418) |
| Support-constrained target reason | identified |
| Raw to support delta | -14.175 (-51.0%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 3 | interpolation | 0.6832 | 0.0000 | 141 | 9306 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.6803 | 0.0029 | 141 | 9306 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.6803 | 0.0029 | 141 | 9306 |
| Runner-up | predictor_default | 3 | 3 | interpolation | 0.6789 | 0.0043 | 141 | 9306 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.84646, 6.064) | 930 | 27 | 4.6016 | 4.8183 | 55.4973 | 56.0828 |
| 2 | [6.064, 8.367) | 930 | 38 | 7.1937 | 7.1054 | 57.9656 | 59.0612 |
| 3 | [8.367, 9.836) | 930 | 48 | 9.1458 | 9.1828 | 57.4419 | 58.4163 |
| 4 | [9.836, 11.078) | 930 | 58 | 10.4751 | 10.5482 | 61.9745 | 63.6314 |
| 5 | [11.078, 12.442) | 930 | 63 | 11.7450 | 11.6654 | 62.5383 | 63.7841 |
| 6 | [12.442, 13.537) | 933 | 62 | 12.9125 | 12.8713 | 62.2404 | 63.8637 |
| 7 | [13.537, 14.909) | 930 | 61 | 14.1587 | 14.1494 | 62.8571 | 64.7948 |
| 8 | [14.909, 16.642) | 918 | 51 | 15.7520 | 15.7726 | 63.8168 | 65.6232 |
| 9 | [16.642, 20.671) | 942 | 38 | 18.5866 | 18.6320 | 66.3759 | 67.9688 |
| 10 | [20.671, 66.811] | 933 | 26 | 30.3436 | 25.7362 | 67.7386 | 68.9217 |

### Distribution Charts

```text
Predictor Distribution (Government Health Share of Government Spending)
[0.84646, 6.343) | ########## 1077
[6.343, 11.841) | ############################# 3204
[11.841, 17.338) | ############################## 3336
[17.338, 22.835) | ########## 1074
[22.835, 28.332) | ## 240
[28.332, 33.829) | ## 183
[33.829, 39.326) | # 51
[39.326, 44.823) | # 51
[44.823, 50.320) | # 9
[50.320, 55.817) | # 15
[55.817, 61.314) | # 6
[61.314, 66.811] | # 60
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[36.729, 39.928) | # 71
[39.928, 43.126) | ## 121
[43.126, 46.325) | #### 231
[46.325, 49.524) | ##### 316
[49.524, 52.723) | ####### 483
[52.723, 55.921) | ########## 678
[55.921, 59.120) | ############# 841
[59.120, 62.319) | ################### 1223
[62.319, 65.517) | ############################ 1810
[65.517, 68.716) | ############################## 1938
[68.716, 71.915) | ####################### 1488
[71.915, 75.113] | ## 106
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| ITA | 0.4734 | 1.0254 | 0.699 | 66 |
| TGO | 0.8099 | 0.9393 | 8.691 | 66 |
| ARG | -0.0258 | -0.8894 | -0.274 | 66 |
| UZB | 0.0549 | 0.8764 | 5.858 | 66 |
| ZMB | -0.7418 | -0.8235 | -12.392 | 66 |
| ECU | 0.0242 | -0.8163 | 1.116 | 66 |
| PER | -0.2364 | -0.8152 | -0.947 | 66 |
| BIH | 0.0198 | -0.7635 | 0.421 | 66 |
